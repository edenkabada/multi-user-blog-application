import { useState } from 'react'

function Register() {

    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()

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

        setError('')
        setSuccess('')
        setIsSubmitting(true)

        try {
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

            if (response.ok) {
                setSuccess('Registration successful!')
                return
            }

            const message = Array.isArray(data?.message)
                ? data.message.join(', ')
                : data?.message || 'Registration failed. Please try again.'
            setError(message)
        } catch {
            setError('Unable to reach the server. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div>
            <h1>Register</h1>
            {error && <p>{error}</p>}
            {success && <p>{success}</p>}
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
        </div>
    )
}

export default Register