const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { isFilledString } = require('../utils/validate');

// Lengths of the users table
const USERNAME_MAX_LENGTH = 50;
const EMAIL_MAX_LENGTH = 100;
// Only rejects absurd input: this is not a password policy.
const PASSWORD_MAX_LENGTH = 1000;

const isValidEmail = (email) => isFilledString(email, EMAIL_MAX_LENGTH);
const isValidPassword = (password) => isFilledString(password, PASSWORD_MAX_LENGTH);

exports.register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body ?? {};

        if (!isFilledString(username, USERNAME_MAX_LENGTH) || !isValidEmail(email) || !isValidPassword(password)) {
            return res.status(400).json({ message: 'Username, email and password are required' });
        }

        // Check if user exists
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
        if (existing.length > 0) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body ?? {};

        // pool.query expands an object into SQL: only strings may reach it.
        if (!isValidEmail(email) || !isValidPassword(password)) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token,
            user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar }
        });
    } catch (err) {
        next(err);
    }
};
