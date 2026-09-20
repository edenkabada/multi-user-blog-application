import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
            const response = await fetch('http://localhost:3000/users/register', {
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
                const message = Array.isArray(data?.message)
                    ? data.message.join(', ')
                    : data?.message || 'Registration failed. Please try again.'
                setError(message)
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
            Multi User Blog
        </div>

        <div className="register-container">

            <h1>Create Account</h1>

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
