const request = require('supertest');
const app = require('../app');
const { setupTestDb, teardownTestDb } = require('./helpers/testDb');

const USER = { username: 'carol', email: 'carol@test.local', password: 'password-carol' };

describe('Authentication and profiles', () => {
    let userId;

    const register = (body) => request(app).post('/api/auth/register').send(body);
    const login = (body) => request(app).post('/api/auth/login').send(body);

    beforeAll(async () => {
        await setupTestDb();
        await register(USER);

        const { body } = await login(USER);
        userId = body.user.id;
    });

    afterAll(teardownTestDb);

    describe('registering', () => {
        test.each([
            ['no body', undefined],
            ['no password', { username: 'x', email: 'x@test.local' }],
            ['no email', { username: 'x', password: 'password' }],
            ['an object as email', { username: 'x', email: { a: 1 }, password: 'password' }],
            ['an object as password', { username: 'x', email: 'x@test.local', password: { a: 1 } }],
            ['a too long username', { username: 'a'.repeat(51), email: 'x@test.local', password: 'password' }],
        ])('returns 400 with %s', async (label, body) => {
            expect((await register(body)).status).toBe(400);
        });

        test('refuses an email already in use', async () => {
            expect((await register({ ...USER, username: 'other' })).status).toBe(400);
        });

        test('refuses a username already in use', async () => {
            expect((await register({ ...USER, email: 'other@test.local' })).status).toBe(400);
        });
    });

    describe('logging in', () => {
        test('accepts valid credentials', async () => {
            expect((await login(USER)).status).toBe(200);
        });

        test('refuses a wrong password', async () => {
            expect((await login({ ...USER, password: 'wrong' })).status).toBe(401);
        });

        test.each([
            ['no body', undefined],
            ['an object as email', { email: { email: 1 }, password: USER.password }],
            ['an array as email', { email: [USER.email], password: USER.password }],
            ['an object as password', { email: USER.email, password: { a: 1 } }],
        ])('returns 400 with %s', async (label, body) => {
            expect((await login(body)).status).toBe(400);
        });
    });

    describe('public profile', () => {
        test('does not expose the email', async () => {
            const response = await request(app).get(`/api/users/${userId}`);

            expect(response.status).toBe(200);
            expect(response.body.username).toBe(USER.username);
            expect(response.body).not.toHaveProperty('email');
            expect(JSON.stringify(response.body)).not.toContain(USER.email);
        });
    });
});
