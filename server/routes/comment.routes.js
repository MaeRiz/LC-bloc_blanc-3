const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const verifyToken = require('../middleware/auth');
const validateId = require('../middleware/validateId');

router.get('/articles/:articleId/comments', validateId('articleId'), commentController.getComments);
router.post('/articles/:articleId/comments', verifyToken, validateId('articleId'), commentController.createComment);
router.put('/comments/:id', verifyToken, validateId('id'), commentController.updateComment);
router.delete('/comments/:id', verifyToken, validateId('id'), commentController.deleteComment);

module.exports = router;
