import { useState } from 'react'

// Receive a callback to switch to the registration screen
function Login({ onSwitchToRegister }) {

    // Store the values entered in the login form
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    // Store validation and API response messages
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Handle form submission, validation, and login request
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

        // Clear previous error and success messages
        setError('')
        setSuccess('')

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

        if (response.ok) {
            const data = await response.json()
            // Store the JWT token received from the backend
            localStorage.setItem('access_token', data.access_token)

            setSuccess('Login successful!')
        }

        // Display the error returned by the backend
        if (!response.ok) {
            const data = await response.json()
            setError(data.message)
            return
        }
    }


    return (
        <div>
            <h1>Login</h1>
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

            {/* Allow the user to switch to the Registration screen */}
            <p>
                Don't have an account?{' '}
                <button onClick={onSwitchToRegister}>
                    Register
                </button>
            </p>
        </div>
    )

}
export default Login