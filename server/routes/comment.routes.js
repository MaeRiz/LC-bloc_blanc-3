const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const verifyToken = require('../middleware/auth');
const validateId = require('../middleware/validateId');
const { commentWriteLimiter } = require('../middleware/rateLimit');

router.get('/articles/:articleId/comments', validateId('articleId'), commentController.getComments);
router.post(
    '/articles/:articleId/comments',
    commentWriteLimiter,
    verifyToken,
    validateId('articleId'),
    commentController.createComment,
);
router.put('/comments/:id', commentWriteLimiter, verifyToken, validateId('id'), commentController.updateComment);
router.delete('/comments/:id', commentWriteLimiter, verifyToken, validateId('id'), commentController.deleteComment);

module.exports = router;
