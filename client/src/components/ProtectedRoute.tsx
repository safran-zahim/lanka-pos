import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const user = useAuthStore((state) => state.user);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles) {
        const normalizedRole = String(user.role || '').toLowerCase();
        const normalizedAllowed = allowedRoles.map((role) => role.toLowerCase());
        if (!normalizedAllowed.includes(normalizedRole)) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 p-6">
                    <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center">
                        <h1 className="text-xl font-bold mb-2">Unauthorized</h1>
                        <p className="text-sm text-gray-600">
                            Your account does not have access to this page. Required roles: {allowedRoles.join(', ')}.
                        </p>
                    </div>
                </div>
            );
        }
    }

    return <Outlet />;
};
