import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import CommentSection from '../components/CommentSection';
import { createComment, deleteComment, fetchComments, updateComment } from '../api/comments';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));

vi.mock('../api/comments', async (importOriginal) => ({
    ...(await importOriginal()),
    fetchComments: vi.fn(),
    createComment: vi.fn(),
    updateComment: vi.fn(),
    deleteComment: vi.fn(),
}));

const ALICE = { id: 1, username: 'alice' };
const BOB = { id: 2, username: 'bob' };

const aliceComment = {
    id: 10,
    content: "Commentaire d'alice",
    article_id: 5,
    user_id: ALICE.id,
    username: ALICE.username,
    avatar: null,
    created_at: '2026-11-05T10:00:00.000Z',
};

const renderAs = (user) => {
    useAuth.mockReturnValue({ user });

    return render(
        <MemoryRouter>
            <CommentSection articleId="5" />
        </MemoryRouter>,
    );
};

describe('CommentSection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetchComments.mockResolvedValue([aliceComment]);
    });

    test('shows the comments and a login link to a visitor', async () => {
        renderAs(null);

        expect(await screen.findByText("Commentaire d'alice")).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Connectez-vous' })).toHaveAttribute('href', '/login');
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    test('shows the actions to the author', async () => {
        renderAs(ALICE);

        expect(await screen.findByRole('button', { name: 'Modifier' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Supprimer' })).toBeInTheDocument();
    });

    test('hides the actions from another user', async () => {
        renderAs(BOB);

        await screen.findByText("Commentaire d'alice");

        expect(screen.queryByRole('button', { name: 'Modifier' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument();
    });

    test('adds a new comment to the list', async () => {
        const user = userEvent.setup();
        createComment.mockResolvedValue({ ...aliceComment, id: 11, content: 'Nouveau' });
        renderAs(ALICE);
        await screen.findByText("Commentaire d'alice");

        await user.type(screen.getByRole('textbox'), 'Nouveau');
        await user.click(screen.getByRole('button', { name: 'Commenter' }));

        expect(await screen.findByText('Nouveau')).toBeInTheDocument();
        expect(createComment).toHaveBeenCalledWith('5', 'Nouveau');
        expect(screen.getByRole('textbox')).toHaveValue('');
    });

    test('updates a comment in place', async () => {
        const user = userEvent.setup();
        updateComment.mockResolvedValue({ ...aliceComment, content: 'Corrigé' });
        renderAs(ALICE);

        await user.click(await screen.findByRole('button', { name: 'Modifier' }));
        const [, editor] = screen.getAllByRole('textbox');
        await user.clear(editor);
        await user.type(editor, 'Corrigé');
        await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

        expect(await screen.findByText('Corrigé')).toBeInTheDocument();
        expect(updateComment).toHaveBeenCalledWith(10, 'Corrigé');
    });

    test('deletes a comment after confirmation', async () => {
        const user = userEvent.setup();
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        deleteComment.mockResolvedValue({});
        renderAs(ALICE);

        await user.click(await screen.findByRole('button', { name: 'Supprimer' }));

        await waitFor(() => expect(screen.queryByText("Commentaire d'alice")).not.toBeInTheDocument());
        expect(deleteComment).toHaveBeenCalledWith(10);
    });

    test('keeps the comment when the deletion is cancelled', async () => {
        const user = userEvent.setup();
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        renderAs(ALICE);

        await user.click(await screen.findByRole('button', { name: 'Supprimer' }));

        expect(deleteComment).not.toHaveBeenCalled();
        expect(screen.getByText("Commentaire d'alice")).toBeInTheDocument();
    });

    test('shows a clear message when the API refuses the action', async () => {
        const user = userEvent.setup();
        createComment.mockRejectedValue({ response: { status: 401 } });
        renderAs(ALICE);
        await screen.findByText("Commentaire d'alice");

        await user.type(screen.getByRole('textbox'), 'Refusé');
        await user.click(screen.getByRole('button', { name: 'Commenter' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Votre session a expiré');
        expect(screen.getByRole('textbox')).toHaveValue('Refusé');
    });

    test('shows an error when the comments cannot be loaded', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        fetchComments.mockRejectedValue(new Error('network'));
        renderAs(null);

        expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de charger');
    });

    test('filters a dangerous comment before displaying it', async () => {
        fetchComments.mockResolvedValue([{ ...aliceComment, content: 'Bonjour <img src=x onerror="alert(1)">' }]);
        const { container } = renderAs(null);

        expect(await screen.findByText('Bonjour')).toBeInTheDocument();
        expect(container.querySelector('img')).toBeNull();
    });
});
