import { useEffect } from 'react';
import { useAuthStore, SESSION_DURATION } from '../../store/useAuthStore';

/**
 * Composant invisible monté à la racine de l'app.
 * Vérifie au démarrage si la session (1 heure) n'est pas expirée,
 * puis programme un setTimeout précis pour expirer la session exactement à l'échéance.
 * Se re-programme si loginAt change (ex : après un refresh de token).
 * Débloque les route guards via setInitializing(false) dans tous les cas.
 */
export function AuthInitializer() {
    useEffect(() => {
        const { setInitializing } = useAuthStore.getState();

        let timer: ReturnType<typeof setTimeout> | null = null;

        const scheduleOrExpire = () => {
            if (timer !== null) {
                clearTimeout(timer);
                timer = null;
            }
            const { token, loginAt, logout } = useAuthStore.getState();
            if (!token || !loginAt) return;
            const remaining = SESSION_DURATION - (Date.now() - loginAt);
            if (remaining <= 0) {
                logout();
            } else {
                timer = setTimeout(scheduleOrExpire, remaining);
            }
        };

        scheduleOrExpire();
        setInitializing(false);

        const unsubscribe = useAuthStore.subscribe((state, prev) => {
            if (state.loginAt === prev.loginAt) return;
            if (state.loginAt !== null) {
                scheduleOrExpire();
            } else if (timer !== null) {
                clearTimeout(timer);
                timer = null;
            }
        });

        return () => {
            if (timer !== null) clearTimeout(timer);
            unsubscribe();
        };
    }, []);

    return null;
}
