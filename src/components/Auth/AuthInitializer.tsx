import { useEffect } from 'react';
import { useAuthStore, SESSION_DURATION } from '../../store/useAuthStore';

/**
 * Composant invisible monté à la racine de l'app.
 * Vérifie au démarrage si la session (30 min) n'est pas expirée.
 * Débloque les route guards via setInitializing(false) dans tous les cas.
 */
export function AuthInitializer() {
    useEffect(() => {
        const { token, loginAt, logout, setInitializing } = useAuthStore.getState();

        if (token && loginAt && Date.now() - loginAt > SESSION_DURATION) {
            logout();
        }

        setInitializing(false);
    }, []);

    return null;
}
