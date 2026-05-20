import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

interface AdminRouteProps {
    children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
    const token = useAuthStore((s) => s.token);
    const user = useAuthStore((s) => s.user);
    const isInitializing = useAuthStore((s) => s.isInitializing);

    if (isInitializing) return null;

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (user?.role !== 'ADMINISTRATEUR') {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}
