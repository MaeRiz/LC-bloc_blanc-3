process.env.NODE_ENV = 'production';

const { pool } = require('../config/db');
const { setupTestDb, teardownTestDb } = require('./helpers/testDb');

describe('Demo data in production', () => {
    beforeAll(setupTestDb);
    afterAll(teardownTestDb);

    test('does not create the default admin account', async () => {
        const [users] = await pool.query('SELECT id FROM users');

        expect(users).toHaveLength(0);
    });
});
