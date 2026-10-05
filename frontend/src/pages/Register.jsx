import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'
import './Register.css'

function Register() {

    // Store the values entered in the registration form
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    // Store registration error messages
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const navigate = useNavigate()

    // Handle form submission and registration request
    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validate that all required fields are filled
        if (!username.trim()) {
            setError('Username is required')
            return
        }

        if (!email.trim()) {
            setError('Email is required')
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
            // Send the registration data to the backend
            const response = await fetch(`${API_BASE_URL}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                }),
            })

            const data = await response.json().catch(() => null)

            if (!response.ok) {
                const messages = Array.isArray(data?.message)
                    ? data.message
                    : [data?.message]

                const friendlyMessages = messages.map((message) => {
                    if (message.includes('username must be shorter than or equal to 50 characters')) {
                        return 'Username must be 50 characters or less.'
                    }

                    if (message.includes('email must be an email')) {
                        return 'Please enter a valid email address.'
                    }

                    if (message.includes('password must be longer than or equal to 8 characters')) {
                        return 'Password must be at least 8 characters.'
                    }

                    return message
                })

                setError(friendlyMessages)
                return
            }

            navigate('/login')
        } catch {
            setError('Unable to reach the server. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="register-page">

            <div
                className="register-logo"
                onClick={() => navigate('/')}
            >
                <span className="logo-accent">MU</span>Blog
            </div>

            <div className="register-container">

                <h1>Create Account</h1>

                {error && (
                    <div className="error-message">
                        {Array.isArray(error)
                            ? error.map((message, index) => (
                                <p key={index}>{message}</p>
                            ))
                            : <p>{error}</p>
                        }
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <label htmlFor="username">Username</label>

                    <input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <label htmlFor="email">Email</label>

                    <input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                        {isSubmitting ? 'Registering...' : 'Register'}
                    </button>

                </form>

                <p className="login-link">
                    Already have an account?{' '}
                    <button onClick={() => navigate('/login')}>
                        Login
                    </button>
                </p>

            </div>
        </div>
    )
}

export default Register
