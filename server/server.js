require('dotenv').config();

const app = require('./app');
const { initDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

// DB initialization
(async () => {
    await initDB();
})();

app.listen(PORT, () => {
    console.log('CORS IS UP TO EVERYTHING')
    console.log(`Server is running on port ${PORT}`);
});
