import { Navigate } from 'react-router-dom'

function ProtectedRoute({ isLoggedIn, children }) {

    // Redirect unauthenticated users to the home page
    if (!isLoggedIn) {
        return <Navigate to="/" replace />
    }

    return children
}

export default ProtectedRoute