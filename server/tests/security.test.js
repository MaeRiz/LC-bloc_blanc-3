const request = require('supertest');
const app = require('../app');
const { setupTestDb, teardownTestDb } = require('./helpers/testDb');

describe('Security', () => {
    let token;

    beforeAll(async () => {
        await setupTestDb();

        const { body } = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@blog.com', password: 'password123' });
        token = body.token;
    });

    afterAll(teardownTestDb);

    const createArticle = (title) =>
        request(app)
            .post('/api/articles')
            .set('Authorization', `Bearer ${token}`)
            .field('title', title)
            .field('content', 'Contenu');

    test('sends the security headers and hides Express', async () => {
        const response = await request(app).get('/api/articles');

        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers['strict-transport-security']).toBeDefined();
        expect(response.headers['x-powered-by']).toBeUndefined();
    });

    test('does not allow other origins to read the API', async () => {
        const response = await request(app).get('/api/articles').set('Origin', 'https://evil.example');

        expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    test('hides SQL details when the database refuses a value', async () => {
        const response = await createArticle('a'.repeat(300));

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: 'Internal server error' });
    });

    test('refuses a file that is not an image', async () => {
        const response = await request(app)
            .post('/api/articles')
            .set('Authorization', `Bearer ${token}`)
            .field('title', 'Titre')
            .field('content', 'Contenu')
            .attach('image', Buffer.from('<script>alert(1)</script>'), { filename: 'x.html', contentType: 'text/html' });

        expect(response.status).toBe(400);
    });

    test('explains why a file format is refused', async () => {
        const response = await request(app)
            .post('/api/articles')
            .set('Authorization', `Bearer ${token}`)
            .field('title', 'Titre')
            .field('content', 'Contenu')
            .attach('image', Buffer.from('GIF89a'), { filename: 'x.gif', contentType: 'image/gif' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: 'Unsupported image format' });
    });

    test('explains why a file is too large', async () => {
        const response = await request(app)
            .post('/api/articles')
            .set('Authorization', `Bearer ${token}`)
            .field('title', 'Titre')
            .field('content', 'Contenu')
            .attach('image', Buffer.alloc(5 * 1024 * 1024 + 1), { filename: 'x.png', contentType: 'image/png' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: 'Image too large' });
    });

    test('refuses a body larger than the limit', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'a'.repeat(60 * 1024), password: 'x' });

        expect(response.status).toBe(413);
    });
});
