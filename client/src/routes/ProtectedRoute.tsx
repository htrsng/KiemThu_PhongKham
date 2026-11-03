import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AppShell } from '../layout/AppShell'

export function ProtectedRoute() {
    const { isAuthenticated } = useAuth()

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    // Nếu đã xác thực, hiển thị layout chính của ứng dụng
    return <AppShell />
}