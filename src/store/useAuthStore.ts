import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ApiUserResponse } from '../domain';
import { getProfile, refreshToken } from '../services/auth.service';

export const SESSION_DURATION = 60 * 60 * 1000; // 1 heure

export type AuthUser = ApiUserResponse;

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
            login: (token, user) => set({ token, user, loginAt: Date.now() }),
            logout: () => set({ token: null, user: null, loginAt: null }),
            setInitializing: (value) => set({ isInitializing: value }),
            refreshAccessToken: async () => {
                try {
                    const data = await refreshToken();
                    const newToken = data.access_token;
                    if (!newToken) return false;
                    try {
                        const user = await getProfile(newToken);
                        set({ token: newToken, loginAt: Date.now(), user });
                    } catch {
                        set({ token: newToken, loginAt: Date.now() });
                    }
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
