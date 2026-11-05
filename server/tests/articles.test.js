const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../app');
const { setupTestDb, teardownTestDb } = require('./helpers/testDb');

const ONE_PIXEL_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64',
);

describe('Articles', () => {
    let token;

    beforeAll(async () => {
        await setupTestDb();

        const { body } = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@blog.com', password: 'password123' });
        token = body.token;
    });

    afterAll(teardownTestDb);

    const createArticle = (title, content) =>
        request(app)
            .post('/api/articles')
            .set('Authorization', `Bearer ${token}`)
            .field('title', title)
            .field('content', content);

    test('the API answers on its base route', async () => {
        const response = await request(app).get('/');

        expect(response.status).toBe(200);
    });

    test('creates an article with an ordinary title', async () => {
        const response = await createArticle('Mon titre', 'Mon contenu');

        expect(response.status).toBe(201);
    });

    test('stores an SQL injection attempt as plain text', async () => {
        const title = '(SELECT email FROM users LIMIT 1)';
        const content = '(SELECT password FROM users LIMIT 1)';

        const { body: created } = await createArticle(title, content);
        const { body: article } = await request(app).get(`/api/articles/${created.id}`);

        expect(article.title).toBe(title);
        expect(article.content).toBe(content);
    });

    test('keeps a reachable image path when an article is updated', async () => {
        const { body: created } = await createArticle('Avec image', 'Contenu');

        await request(app)
            .put(`/api/articles/${created.id}`)
            .set('Authorization', `Bearer ${token}`)
            .field('title', 'Avec image')
            .field('content', 'Contenu')
            .attach('image', ONE_PIXEL_PNG, { filename: 'a.png', contentType: 'image/png' });

        const { body: article } = await request(app).get(`/api/articles/${created.id}`);
        const image = await request(app).get(article.image);

        fs.rmSync(path.join(__dirname, '..', article.image));

        expect(article.image).toMatch(/^\/uploads\/[^\s]+\.png$/);
        expect(image.status).toBe(200);
    });
});
