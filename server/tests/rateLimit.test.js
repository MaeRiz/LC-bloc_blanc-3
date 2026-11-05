// Low limits, set before the application is loaded.
process.env.RATE_LIMIT_LOGIN = '3';
process.env.RATE_LIMIT_REGISTER = '2';
process.env.RATE_LIMIT_COMMENTS = '2';

const request = require('supertest');
const app = require('../app');
const { setupTestDb, teardownTestDb } = require('./helpers/testDb');

describe('Rate limiting', () => {
    beforeAll(setupTestDb);
    afterAll(teardownTestDb);

    const login = (password) =>
        request(app).post('/api/auth/login').send({ email: 'admin@blog.com', password });

    test('does not count successful logins', async () => {
        for (let attempt = 0; attempt < 5; attempt++) {
            expect((await login('password123')).status).toBe(200);
        }
    });

    test('blocks login after too many failed attempts, even with the right password', async () => {
        for (let attempt = 0; attempt < 3; attempt++) {
            expect((await login('wrong')).status).toBe(401);
        }

        const blocked = await login('password123');

        expect(blocked.status).toBe(429);
        expect(blocked.body.message).toMatch(/too many requests/i);
    });

    test('limits account creation', async () => {
        const register = (name) =>
            request(app)
                .post('/api/auth/register')
                .send({ username: name, email: `${name}@test.local`, password: 'password' });

        expect((await register('one')).status).toBe(201);
        expect((await register('two')).status).toBe(201);
        expect((await register('three')).status).toBe(429);
    });

    test('limits comment writes but not reading', async () => {
        const write = () => request(app).post('/api/articles/1/comments').send({ content: 'spam' });

        expect((await write()).status).toBe(401);
        expect((await write()).status).toBe(401);
        expect((await write()).status).toBe(429);
        expect((await request(app).get('/api/articles/1/comments')).status).toBe(200);
    });
});
