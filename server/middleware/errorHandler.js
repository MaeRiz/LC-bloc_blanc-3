const multer = require('multer');

// Express recognises an error handler by its four parameters.
const errorHandler = (err, req, res, next) => {
    if (res.headersSent) return next(err);

    const status = err instanceof multer.MulterError ? 400 : err.status || 500;

    if (status >= 500) {
        // Details stay in the server logs: SQL errors reveal the database structure.
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
    }

    res.status(status).json({ message: 'Invalid request' });
};

module.exports = errorHandler;
