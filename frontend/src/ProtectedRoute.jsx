import { Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Check the stored JWT is an admin session (role and tokenType both
// 'admin', mirroring the backend AdminGuard), without verifying it --
// the backend is still the source of truth on every actual request
function isAdminSession() {
    const token = localStorage.getItem('access_token')

    if (!token) {
        return false
    }

    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role === 'admin' && payload.tokenType === 'admin'
}

function ProtectedRoute({ adminOnly, children }) {
    const { isLoggedIn } = useAuth()

    // Redirect unauthenticated users to the home page
    if (!isLoggedIn) {
        return <Navigate to="/" replace />
    }

    // Redirect non-admins away from admin-only routes
    if (adminOnly && !isAdminSession()) {
        return <Navigate to="/" replace />
    }

    return children
}

export default ProtectedRoute
