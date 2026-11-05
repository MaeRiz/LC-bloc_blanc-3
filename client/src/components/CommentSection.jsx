import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { createComment, deleteComment, fetchComments, updateComment } from '../api/comments';
import { useAuth } from '../context/AuthContext';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';

const CommentSection = ({ articleId }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);

    useEffect(() => {
        // Ignores a late answer if the reader has moved to another article.
        let ignore = false;

        const load = async () => {
            try {
                const data = await fetchComments(articleId);
                if (!ignore) setComments(data);
            } catch (err) {
                console.error(err);
                if (!ignore) setLoadFailed(true);
            } finally {
                if (!ignore) setLoading(false);
            }
        };
        load();

        return () => {
            ignore = true;
        };
    }, [articleId]);

    const handleCreate = async (content) => {
        const comment = await createComment(articleId, content);
        setComments((current) => [...current, comment]);
    };

    const handleUpdate = async (id, content) => {
        const updated = await updateComment(id, content);
        setComments((current) => current.map((comment) => (comment.id === id ? updated : comment)));
    };

    const handleDelete = async (id) => {
        await deleteComment(id);
        setComments((current) => current.filter((comment) => comment.id !== id));
    };

    return (
        <section style={{ marginTop: '50px', paddingTop: '30px', borderTop: '1px solid var(--border)' }}>
            <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MessageSquare size={24} /> Commentaires ({comments.length})
            </h2>

            {user ? (
                <div className="glass" style={{ padding: '20px', marginBottom: '30px' }}>
                    <CommentForm submitLabel="Commenter" onSubmit={handleCreate} />
                </div>
            ) : (
                <p className="glass" style={{ padding: '20px', marginBottom: '30px', color: 'var(--text-muted)' }}>
                    <Link to="/login" style={{ color: 'var(--primary)' }}>Connectez-vous</Link> pour laisser un commentaire.
                </p>
            )}

            {loading && <p style={{ color: 'var(--text-muted)' }}>Chargement des commentaires...</p>}
            {loadFailed && <p role="alert" style={{ color: '#ef4444' }}>Impossible de charger les commentaires.</p>}
            {!loading && !loadFailed && comments.length === 0 && (
                <p style={{ color: 'var(--text-muted)' }}>Aucun commentaire pour le moment.</p>
            )}

            <ul style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {comments.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} onUpdate={handleUpdate} onDelete={handleDelete} />
                ))}
            </ul>
        </section>
    );
};

export default CommentSection;
