const request = require('supertest');
const app = require('../app');
const { pool } = require('../config/db');
const { setupTestDb, teardownTestDb } = require('./helpers/testDb');

const ADMIN = { email: 'admin@blog.com', password: 'password123' };
const ALICE = { username: 'alice', email: 'alice@test.local', password: 'password-alice' };
const BOB = { username: 'bob', email: 'bob@test.local', password: 'password-bob' };

const login = async ({ email, password }) => {
    const { body } = await request(app).post('/api/auth/login').send({ email, password });
    return body;
};

describe('Comments', () => {
    let adminToken, aliceToken, bobToken;
    let aliceId;
    let articleId;

    const post = (content, token = aliceToken, id = articleId) =>
        request(app)
            .post(`/api/articles/${id}/comments`)
            .set('Authorization', `Bearer ${token}`)
            .send({ content });

    const put = (id, content, token = aliceToken) =>
        request(app).put(`/api/comments/${id}`).set('Authorization', `Bearer ${token}`).send({ content });

    const remove = (id, token = aliceToken) =>
        request(app).delete(`/api/comments/${id}`).set('Authorization', `Bearer ${token}`);

    const list = (id = articleId) => request(app).get(`/api/articles/${id}/comments`);

    const contentOf = async (id) => {
        const { body } = await list();
        return body.find((comment) => comment.id === id)?.content;
    };

    beforeAll(async () => {
        await setupTestDb();

        await request(app).post('/api/auth/register').send(ALICE);
        await request(app).post('/api/auth/register').send(BOB);

        const admin = await login(ADMIN);
        const alice = await login(ALICE);
        const bob = await login(BOB);

        adminToken = admin.token;
        aliceToken = alice.token;
        bobToken = bob.token;
        aliceId = alice.user.id;

        const [articles] = await pool.query('SELECT id FROM articles ORDER BY id LIMIT 1');
        articleId = articles[0].id;
    });

    afterAll(teardownTestDb);

    describe('reading', () => {
        test('is open to visitors', async () => {
            const response = await list();

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('returns 404 for an unknown article', async () => {
            expect((await list(999999)).status).toBe(404);
        });

        test.each(['abc', '0', '-1', '1.5', '99999999999'])('returns 400 for the id %s', async (id) => {
            expect((await list(id)).status).toBe(400);
        });

        test('returns comments from oldest to newest', async () => {
            const first = await post('premier');
            const second = await post('second');

            const ids = (await list()).body.map((comment) => comment.id);

            expect(ids.indexOf(first.body.id)).toBeLessThan(ids.indexOf(second.body.id));
        });

        test('never exposes the email or the password of the author', async () => {
            await post('commentaire public');

            const response = await list();

            expect(response.body.length).toBeGreaterThan(0);
            expect(JSON.stringify(response.body)).not.toContain(ALICE.email);
            expect(response.body[0]).not.toHaveProperty('email');
            expect(response.body[0]).not.toHaveProperty('password');
        });
    });

    describe('creating', () => {
        test('refuses a visitor', async () => {
            const response = await request(app)
                .post(`/api/articles/${articleId}/comments`)
                .send({ content: 'anonyme' });

            expect(response.status).toBe(401);
        });

        test('refuses a forged token', async () => {
            expect((await post('faux', 'forged-token')).status).toBe(401);
        });

        test('creates a comment for the connected user', async () => {
            const response = await post('Bonjour');

            expect(response.status).toBe(201);
            expect(response.body).toMatchObject({
                content: 'Bonjour',
                article_id: articleId,
                user_id: aliceId,
                username: ALICE.username,
            });
            expect(response.body.created_at).toBeTruthy();
        });

        test('ignores an author sent in the body', async () => {
            const response = await request(app)
                .post(`/api/articles/${articleId}/comments`)
                .set('Authorization', `Bearer ${bobToken}`)
                .send({ content: 'usurpation', user_id: aliceId });

            expect(response.status).toBe(201);
            expect(response.body.user_id).not.toBe(aliceId);
        });

        test.each([
            ['missing', undefined],
            ['empty', ''],
            ['made of spaces', '   \n '],
            ['too long', 'a'.repeat(5001)],
            ['an object', { evil: true }],
            ['an array', ['a']],
            ['a number', 42],
        ])('refuses a content that is %s', async (label, content) => {
            expect((await post(content)).status).toBe(400);
        });

        test('accepts a content of exactly 5000 characters', async () => {
            expect((await post('a'.repeat(5000))).status).toBe(201);
        });

        test('returns 404 for an unknown article', async () => {
            expect((await post('perdu', aliceToken, 999999)).status).toBe(404);
        });

        test('returns 400 without leaking details on malformed JSON', async () => {
            const response = await request(app)
                .post(`/api/articles/${articleId}/comments`)
                .set('Authorization', `Bearer ${aliceToken}`)
                .set('Content-Type', 'application/json')
                .send('{"content":');

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: 'Invalid request' });
        });

        test('stores an SQL injection attempt as plain text', async () => {
            const content = "'); DROP TABLE comments; --";

            const { body } = await post(content);

            expect(await contentOf(body.id)).toBe(content);
        });
    });

    describe('updating', () => {
        test('lets the author update the comment', async () => {
            const { body: comment } = await post('avant');

            const response = await put(comment.id, 'après');

            expect(response.status).toBe(200);
            expect(response.body.content).toBe('après');
            expect(await contentOf(comment.id)).toBe('après');
        });

        test('refuses another user and leaves the comment unchanged', async () => {
            const { body: comment } = await post('à alice');

            const response = await put(comment.id, 'piraté', bobToken);

            expect(response.status).toBe(403);
            expect(await contentOf(comment.id)).toBe('à alice');
        });

        test('refuses a visitor', async () => {
            const { body: comment } = await post('à alice');

            const response = await request(app).put(`/api/comments/${comment.id}`).send({ content: 'x' });

            expect(response.status).toBe(401);
        });

        test('refuses an invalid content', async () => {
            const { body: comment } = await post('à alice');

            expect((await put(comment.id, '   ')).status).toBe(400);
        });

        test('returns 404 for an unknown comment', async () => {
            expect((await put(999999, 'x')).status).toBe(404);
        });
    });

    describe('deleting', () => {
        test('lets the author delete the comment', async () => {
            const { body: comment } = await post('à supprimer');

            const response = await remove(comment.id);

            expect(response.status).toBe(200);
            expect(await contentOf(comment.id)).toBeUndefined();
        });

        test('refuses another user', async () => {
            const { body: comment } = await post('à alice');

            expect((await remove(comment.id, bobToken)).status).toBe(403);
            expect(await contentOf(comment.id)).toBe('à alice');
        });

        test('refuses the author of the article, who is not the author of the comment', async () => {
            const { body: comment } = await post('à alice');

            expect((await remove(comment.id, adminToken)).status).toBe(403);
            expect(await contentOf(comment.id)).toBe('à alice');
        });

        test('refuses a visitor', async () => {
            const { body: comment } = await post('à alice');

            expect((await request(app).delete(`/api/comments/${comment.id}`)).status).toBe(401);
        });

        test('returns 404 for an unknown comment', async () => {
            expect((await remove(999999)).status).toBe(404);
        });
    });

    describe('cascade', () => {
        test('deleting an article removes its comments', async () => {
            const [result] = await pool.query("INSERT INTO articles (title, content, user_id) VALUES ('t', 'c', ?)", [aliceId]);
            const { body: comment } = await post('sur article éphémère', aliceToken, result.insertId);

            await request(app).delete(`/api/articles/${result.insertId}`).set('Authorization', `Bearer ${aliceToken}`);

            const [rows] = await pool.query('SELECT id FROM comments WHERE id = ?', [comment.id]);
            expect(rows).toHaveLength(0);
        });

        test('deleting a user removes their comments and refuses their remaining session', async () => {
            const { body: comment } = await post('dernier mot', bobToken);
            const [bob] = await pool.query('SELECT id FROM users WHERE email = ?', [BOB.email]);

            await pool.query('DELETE FROM users WHERE id = ?', [bob[0].id]);

            const [rows] = await pool.query('SELECT id FROM comments WHERE id = ?', [comment.id]);
            expect(rows).toHaveLength(0);
            expect((await post('fantôme', bobToken)).status).toBe(401);
        });
    });
});
