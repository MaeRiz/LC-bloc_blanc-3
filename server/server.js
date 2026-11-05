require('dotenv').config();

const app = require('./app');
const { initDB } = require('./config/db');

const PORT = process.env.PORT || 5030;

const start = async () => {
    // Without a secret, tokens could not be signed or verified safely.
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not set');
    }

    await initDB();

    // Express 5 passes listening errors, such as a busy port, to this callback.
    app.listen(PORT, (err) => {
        if (err) throw err;
        console.log(`Server is running on port ${PORT}`);
    });
};

start().catch((err) => {
    console.error('Server failed to start:', err);
    process.exit(1);
});
