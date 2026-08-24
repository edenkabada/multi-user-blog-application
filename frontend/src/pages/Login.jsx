import { useState } from 'react'
import { useNavigate } from 'react-router-dom'


function Login({onLoginSuccess}) {

    // Store the values entered in the login form
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    // Store login error messages
    const [error, setError] = useState('')

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
            onLoginSuccess()
            navigate('/')

        }

        // Display the error returned by the backend
        if (!response.ok) {
            const data = await response.json()
            setError(data.message)
            return
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

                    <button type="submit">
                        Login
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