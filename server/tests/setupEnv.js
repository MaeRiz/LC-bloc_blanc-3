// Runs before each test file, before the application is loaded.
process.env.DOTENV_CONFIG_QUIET = 'true';
require('dotenv').config();

// The tests delete their data: they must never run on the development database.
process.env.DB_NAME = 'blog_test';
process.env.JWT_SECRET = 'test-secret';

// The suite sends many requests from one address: only rateLimit.test.js
// tests the real limits.
process.env.RATE_LIMIT_LOGIN = '100000';
process.env.RATE_LIMIT_REGISTER = '100000';
process.env.RATE_LIMIT_COMMENTS = '100000';
