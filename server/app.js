const express = require('express');
const helmet = require('helmet');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const articleRoutes = require('./routes/article.routes');
const userRoutes = require('./routes/user.routes');
const commentRoutes = require('./routes/comment.routes');
const errorHandler = require('./middleware/errorHandler');

// The app is defined apart from server.js so that tests can send requests to
// it without opening a port.
const app = express();

// Number of reverse proxies in front of the API: without it, rate limiting
// would see the proxy's address instead of the visitor's.
app.set('trust proxy', Number(process.env.TRUST_PROXY) || 0);

// Middleware
// No CORS header is sent: the front and the API share the same origin (Vite
// proxy in development, nginx in production), so other origins stay blocked.
app.use(helmet());
app.use(express.json({ limit: '50kb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/users', userRoutes);
app.use('/api', commentRoutes);

// Basic route
app.get('/', (req, res) => {
    res.send('Blog API is running...');
});

// Must stay after the routes to catch their errors
app.use(errorHandler);

module.exports = app;
