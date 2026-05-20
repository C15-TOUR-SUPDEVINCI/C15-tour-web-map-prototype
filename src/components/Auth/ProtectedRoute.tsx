import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const token = useAuthStore((s) => s.token);
    const isInitializing = useAuthStore((s) => s.isInitializing);

    if (isInitializing) return null;

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
