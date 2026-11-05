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

    test('hides internal details when a route receives no body', async () => {
        const response = await request(app).post('/api/auth/register');

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

    test('refuses a body larger than the limit', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'a'.repeat(60 * 1024), password: 'x' });

        expect(response.status).toBe(413);
    });
});
