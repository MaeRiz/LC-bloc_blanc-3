import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Edit, Trash2, User } from 'lucide-react';
import { getCommentError } from '../api/comments';
import { useAuth } from '../context/AuthContext';
import CommentForm from './CommentForm';

const CommentItem = ({ comment, onUpdate, onDelete }) => {
    const { user } = useAuth();
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    // Comfort only: the API is what actually enforces this rule.
    const isAuthor = user && user.id === comment.user_id;

    const handleUpdate = async (content) => {
        await onUpdate(comment.id, content);
        setEditing(false);
    };

    const handleDelete = async () => {
        if (!window.confirm('Voulez-vous vraiment supprimer ce commentaire ?')) return;

        setDeleting(true);
        setError('');

        try {
            await onDelete(comment.id);
        } catch (err) {
            setError(getCommentError(err));
            setDeleting(false);
        }
    };

    return (
        <li className="glass" style={{ padding: '20px', listStyle: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {comment.avatar ? (
                        <img
                            src={comment.avatar}
                            alt={comment.username}
                            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                    ) : <User size={24} />}
                    <div>
                        <Link to={`/profile/${comment.user_id}`} style={{ fontWeight: 'bold' }}>{comment.username}</Link>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={12} /> {new Date(comment.created_at).toLocaleString()}
                        </div>
                    </div>
                </div>

                {isAuthor && !editing && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setEditing(true)}
                            className="btn glass"
                            style={{ padding: '6px 10px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                            <Edit size={14} /> Modifier
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="btn"
                            style={{ padding: '6px 10px', background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                            <Trash2 size={14} /> Supprimer
                        </button>
                    </div>
                )}
            </div>

            {editing ? (
                <CommentForm
                    initialContent={comment.content}
                    submitLabel="Enregistrer"
                    onSubmit={handleUpdate}
                    onCancel={() => setEditing(false)}
                />
            ) : (
                <div style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{comment.content}</div>
            )}

            {error && <div role="alert" style={{ color: '#ef4444', marginTop: '12px' }}>{error}</div>}
        </li>
    );
};

export default CommentItem;
