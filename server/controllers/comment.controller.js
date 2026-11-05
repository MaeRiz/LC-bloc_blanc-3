const { pool } = require('../config/db');
const { isFilledString } = require('../utils/validate');

const CONTENT_MAX_LENGTH = 5000;

// Only public fields: the author's email must never leave the API.
const COMMENT_SELECT = `
    SELECT comments.id, comments.content, comments.article_id, comments.user_id,
           comments.created_at, users.username, users.avatar
    FROM comments
    JOIN users ON comments.user_id = users.id
`;

const findComment = async (id) => {
    const [rows] = await pool.execute(`${COMMENT_SELECT} WHERE comments.id = ?`, [id]);
    return rows[0];
};

const articleExists = async (id) => {
    const [rows] = await pool.execute('SELECT id FROM articles WHERE id = ?', [id]);
    return rows.length > 0;
};

const isValidContent = (content) => isFilledString(content, CONTENT_MAX_LENGTH);

const rejectContent = (res) =>
    res.status(400).json({ message: `Content is required (${CONTENT_MAX_LENGTH} characters maximum)` });

// Express 5 forwards the errors of async handlers to the error middleware.
exports.getComments = async (req, res) => {
    const { articleId } = req.params;

    if (!(await articleExists(articleId))) {
        return res.status(404).json({ message: 'Article not found' });
    }

    const [comments] = await pool.execute(
        `${COMMENT_SELECT} WHERE comments.article_id = ? ORDER BY comments.created_at ASC, comments.id ASC`,
        [articleId],
    );

    res.json(comments);
};

exports.createComment = async (req, res) => {
    const { articleId } = req.params;
    const { content } = req.body ?? {};

    if (!isValidContent(content)) return rejectContent(res);

    if (!(await articleExists(articleId))) {
        return res.status(404).json({ message: 'Article not found' });
    }

    try {
        // The author always comes from the verified session, never from the body.
        const [result] = await pool.execute(
            'INSERT INTO comments (content, article_id, user_id) VALUES (?, ?, ?)',
            [content, articleId, req.userId],
        );

        res.status(201).json(await findComment(result.insertId));
    } catch (err) {
        // The article exists, so the foreign key failed on a deleted account
        // whose session is still valid.
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        throw err;
    }
};

exports.updateComment = async (req, res) => {
    const { id } = req.params;
    const { content } = req.body ?? {};

    if (!isValidContent(content)) return rejectContent(res);

    const comment = await findComment(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.user_id !== req.userId) return res.status(403).json({ message: 'Not authorized' });

    await pool.execute('UPDATE comments SET content = ? WHERE id = ? AND user_id = ?', [content, id, req.userId]);

    res.json(await findComment(id));
};

exports.deleteComment = async (req, res) => {
    const { id } = req.params;

    const comment = await findComment(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.user_id !== req.userId) return res.status(403).json({ message: 'Not authorized' });

    await pool.execute('DELETE FROM comments WHERE id = ? AND user_id = ?', [id, req.userId]);

    res.json({ message: 'Comment deleted successfully' });
};
