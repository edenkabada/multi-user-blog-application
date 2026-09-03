import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

function Login({ onLoginSuccess }) {

    // Store the values entered in the login form
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    // Store login error messages
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const navigate = useNavigate()

    // Handle form submission and login request
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
        setIsSubmitting(true)

        try {
            // Send the login data to the backend
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

            const data = await response.json().catch(() => null)

            if (!response.ok) {
                setError(data?.message || 'Login failed. Please try again.')
                return
            }

            // Store the JWT token received from the backend
            localStorage.setItem('access_token', data.access_token)
            onLoginSuccess()
            navigate('/')
        } catch {
            setError('Unable to reach the server. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }


    return (
        <div className="login-page">

            <div
                className="login-logo"
                onClick={() => navigate('/')}
            >
                Multi User Blog
            </div>

            <div className="login-container">

                <h1>Login</h1>

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

                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Logging in...' : 'Login'}
                    </button>

                </form>

                <p className="register-link">
                    Don't have an account?{' '}
                    <button onClick={() => navigate('/register')}>
                        Register
                    </button>
                </p>

            </div>
        </div>
    )

}
export default Login
