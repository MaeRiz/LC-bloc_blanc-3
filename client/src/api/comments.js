import API from './axios';

export const COMMENT_MAX_LENGTH = 5000;

export const fetchComments = async (articleId) => {
    const { data } = await API.get(`/articles/${articleId}/comments`);
    return data;
};

export const createComment = async (articleId, content) => {
    const { data } = await API.post(`/articles/${articleId}/comments`, { content });
    return data;
};

export const updateComment = async (id, content) => {
    const { data } = await API.put(`/comments/${id}`, { content });
    return data;
};

export const deleteComment = (id) => API.delete(`/comments/${id}`);

const ERROR_MESSAGES = {
    400: `Le commentaire doit contenir entre 1 et ${COMMENT_MAX_LENGTH} caractères.`,
    401: 'Votre session a expiré. Reconnectez-vous pour continuer.',
    403: "Vous n'êtes pas autorisé à effectuer cette action.",
    404: "Ce commentaire ou cet article n'existe plus.",
};

export const getCommentError = (err) =>
    ERROR_MESSAGES[err.response?.status] ?? 'Une erreur est survenue. Réessayez plus tard.';
