import { useState } from 'react';
import { Send } from 'lucide-react';
import { COMMENT_MAX_LENGTH, getCommentError } from '../api/comments';

const CommentForm = ({ initialContent = '', submitLabel, onSubmit, onCancel }) => {
    const [content, setContent] = useState(initialContent);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            await onSubmit(content);
            setContent('');
        } catch (err) {
            setError(getCommentError(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <textarea
                aria-label="Votre commentaire"
                placeholder="Écrivez votre commentaire..."
                rows="4"
                maxLength={COMMENT_MAX_LENGTH}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                style={{ fontFamily: 'inherit' }}
            />

            {error && <div role="alert" style={{ color: '#ef4444', marginBottom: '15px' }}>{error}</div>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {content.length} / {COMMENT_MAX_LENGTH}
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {onCancel && (
                        <button type="button" onClick={onCancel} className="btn glass" style={{ padding: '8px 12px', color: 'var(--text)' }}>
                            Annuler
                        </button>
                    )}
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving || !content.trim()}
                        style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Send size={16} /> {saving ? 'Envoi...' : submitLabel}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default CommentForm;
