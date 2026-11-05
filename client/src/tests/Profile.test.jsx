import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import API from '../api/axios';
import EditProfile from '../pages/EditProfile';
import Profile from '../pages/Profile';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../api/axios', () => ({ default: { get: vi.fn(), put: vi.fn() } }));

const SESSION_USER = { id: 1, username: 'alice', email: 'alice@test.local', avatar: null };
const PUBLIC_PROFILE = { id: 1, username: 'alice', bio: '', avatar: null, created_at: '2026-11-05T10:00:00.000Z' };

const renderProfile = (user) => {
    useAuth.mockReturnValue({ user });

    return render(
        <MemoryRouter initialEntries={['/profile/1']}>
            <Routes>
                <Route path="/profile/:id" element={<Profile />} />
            </Routes>
        </MemoryRouter>,
    );
};

describe('Email privacy', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        API.get.mockResolvedValue({ data: PUBLIC_PROFILE });
    });

    test('shows the email to its owner', async () => {
        renderProfile(SESSION_USER);

        expect(await screen.findByText(SESSION_USER.email)).toBeInTheDocument();
    });

    test('hides the email from another user', async () => {
        renderProfile({ id: 2, username: 'bob', email: 'bob@test.local' });

        await screen.findByRole('heading', { name: 'alice' });

        expect(screen.queryByText(/@test\.local/)).not.toBeInTheDocument();
    });

    test('hides the email from a visitor', async () => {
        renderProfile(null);

        await screen.findByRole('heading', { name: 'alice' });

        expect(screen.queryByText(/@test\.local/)).not.toBeInTheDocument();
    });

    test('keeps the email in the session after a profile update', async () => {
        const user = userEvent.setup();
        const login = vi.fn();
        useAuth.mockReturnValue({ user: SESSION_USER, login });
        API.put.mockResolvedValue({});

        render(
            <MemoryRouter>
                <EditProfile />
            </MemoryRouter>,
        );
        await user.click(await screen.findByRole('button', { name: /enregistrer/i }));

        await vi.waitFor(() => expect(login).toHaveBeenCalled());
        expect(login.mock.calls[0][0].email).toBe(SESSION_USER.email);
    });
});
