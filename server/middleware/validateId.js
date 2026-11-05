const { isPositiveId } = require('../utils/validate');

const validateId = (paramName) => (req, res, next) => {
    if (!isPositiveId(req.params[paramName])) {
        return res.status(400).json({ message: 'Invalid id' });
    }
    next();
};

module.exports = validateId;
