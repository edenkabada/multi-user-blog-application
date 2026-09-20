import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminLogin.css'

function AdminLogin({ onLoginSuccess }) {

    // Store the values entered in the login form
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    // Store login error messages
    const [error, setError] = useState('')

    const navigate = useNavigate()

    // Handle form submission and admin login request
    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validate that all required fields are filled
        if (!username.trim()) {
            setError('Username is required')
            return
        }

        if (!password.trim()) {
            setError('Password is required')
            return
        }

        // Clear previous error message
        setError('')

        // Admin login uses the same endpoint as regular login -- role is
        // checked below, after authentication, not at this request
        const response = await fetch('http://localhost:3000/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                password,
            }),
        })

        // Display the error returned by the backend
        if (!response.ok) {
            const data = await response.json()
            setError(data.message)
            return
        }

        const data = await response.json()
        const payload = JSON.parse(atob(data.access_token.split('.')[1]))

        // Only accounts with the admin role are allowed past this page
        if (payload.role !== 'admin') {
            setError('This account does not have admin access.')
            return
        }

        // Store the JWT token received from the backend
        localStorage.setItem('access_token', data.access_token)
        onLoginSuccess()
        navigate('/admin/dashboard')
    }


    return (
        <div className="admin-login-page">

            <div
                className="admin-login-logo"
                onClick={() => navigate('/')}
            >
                Multi User Blog
            </div>

            <div className="admin-login-container">

                <h1>Admin Login</h1>

                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleSubmit}>

                    <label htmlFor="username">Username</label>

                    <input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <label htmlFor="password">Password</label>

                    <input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button type="submit">
                        Login
                    </button>

                </form>

            </div>
        </div>
    )

}
export default AdminLogin
