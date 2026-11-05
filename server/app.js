const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const articleRoutes = require('./routes/article.routes');
const userRoutes = require('./routes/user.routes');
const commentRoutes = require('./routes/comment.routes');
const errorHandler = require('./middleware/errorHandler');

// The app is defined apart from server.js so that tests can send requests to
// it without opening a port.
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
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
