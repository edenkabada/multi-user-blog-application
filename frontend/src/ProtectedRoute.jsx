import { Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Decode the role claim from the stored JWT, without verifying it --
// the backend is still the source of truth on every actual request
function getRole() {
    const token = localStorage.getItem('access_token')

    if (!token) {
        return null
    }

    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role
}

function ProtectedRoute({ adminOnly, children }) {
    const { isLoggedIn } = useAuth()

    // Redirect unauthenticated users to the home page
    if (!isLoggedIn) {
        return <Navigate to="/" replace />
    }

    // Redirect non-admins away from admin-only routes
    if (adminOnly && getRole() !== 'admin') {
        return <Navigate to="/" replace />
    }

    return children
}

export default ProtectedRoute
