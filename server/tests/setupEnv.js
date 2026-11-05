// Runs before each test file, before the application is loaded.
process.env.DOTENV_CONFIG_QUIET = 'true';
require('dotenv').config();

// The tests delete their data: they must never run on the development database.
process.env.DB_NAME = 'blog_test';
process.env.JWT_SECRET = 'test-secret';
