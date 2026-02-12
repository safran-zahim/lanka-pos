import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../db/db';

interface AuthState {
    user: User | null;
    token: string | null;
    login: (user: User, token?: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            login: (user, token) => {
                if (token) {
                    localStorage.setItem('token', token);
                    sessionStorage.setItem('token', token);
                }
                set({ user, token });
            },
            logout: () => {
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                set({ user: null, token: null });
            },
        }),
        {
            name: 'pos-auth-storage',
        }
    )
);
