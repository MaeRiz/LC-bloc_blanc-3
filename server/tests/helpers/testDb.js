const { pool, initDB } = require('../../config/db');

const TEST_DB_NAME = 'blog_test';

const setupTestDb = async () => {
    await initDB();
};

const teardownTestDb = async () => {
    // Last safeguard before an irreversible operation.
    if (process.env.DB_NAME !== TEST_DB_NAME) {
        throw new Error(`Refusing to drop database ${process.env.DB_NAME}`);
    }

    await pool.query(`DROP DATABASE ${TEST_DB_NAME}`);
    await pool.end();
};

module.exports = { setupTestDb, teardownTestDb };
