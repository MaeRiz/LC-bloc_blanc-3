const { rateLimit } = require('express-rate-limit');

const ONE_MINUTE = 60 * 1000;
const FIFTEEN_MINUTES = 15 * ONE_MINUTE;
const ONE_HOUR = 60 * ONE_MINUTE;

const createLimiter = (windowMs, limit, options = {}) =>
    rateLimit({
        windowMs,
        limit,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: { message: 'Too many requests, please try again later' },
        ...options,
    });

// Slows down password guessing: only failed attempts count.
const loginLimiter = createLimiter(FIFTEEN_MINUTES, Number(process.env.RATE_LIMIT_LOGIN) || 10, {
    skipSuccessfulRequests: true,
});

// Limits the mass creation of accounts.
const registerLimiter = createLimiter(ONE_HOUR, Number(process.env.RATE_LIMIT_REGISTER) || 10);

// Limits comment spam.
const commentWriteLimiter = createLimiter(ONE_MINUTE, Number(process.env.RATE_LIMIT_COMMENTS) || 20);

module.exports = { loginLimiter, registerLimiter, commentWriteLimiter };
