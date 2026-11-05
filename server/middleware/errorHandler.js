const multer = require('multer');

const MULTER_MESSAGES = {
    LIMIT_FILE_SIZE: 'Image too large',
};

// Express recognises an error handler by its four parameters.
const errorHandler = (err, req, res, next) => {
    if (res.headersSent) return next(err);

    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: MULTER_MESSAGES[err.code] ?? 'Invalid upload' });
    }

    const status = err.status || 500;

    if (status >= 500) {
        // Details stay in the server logs: SQL errors reveal the database structure.
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
    }

    res.status(status).json({ message: err.publicMessage ?? 'Invalid request' });
};

module.exports = errorHandler;
