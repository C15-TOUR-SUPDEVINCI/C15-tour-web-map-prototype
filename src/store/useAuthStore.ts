import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { API_URL } from '../config';

export const SESSION_DURATION = 60 * 60 * 1000; // 1 heure

export interface AuthUser {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
}

interface AuthState {
    token: string | null;
    user: AuthUser | null;
    loginAt: number | null;
    isInitializing: boolean;
    login: (token: string, user: AuthUser) => void;
    logout: () => void;
    setInitializing: (value: boolean) => void;
    refreshAccessToken: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            loginAt: null,
            isInitializing: true,
            login: (token, user) => set({ token, user, loginAt: Date.now(), isInitializing: false }),
            logout: () => set({ token: null, user: null, loginAt: null, isInitializing: false }),
            setInitializing: (value) => set({ isInitializing: value }),
            refreshAccessToken: async () => {
                try {
                    const res = await fetch(`${API_URL}/api/auth/refresh`, {
                        method: 'POST',
                        credentials: 'include',
                    });
                    if (!res.ok) return false;
                    const data = await res.json();
                    const newToken: string = data.access_token || data.token;
                    if (!newToken) return false;
                    set({ token: newToken, loginAt: Date.now() });
                    return true;
                } catch {
                    return false;
                }
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                loginAt: state.loginAt,
            }),
        }
    )
);
