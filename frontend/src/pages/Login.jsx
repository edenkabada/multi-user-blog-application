import useAuthForm from '../hooks/useAuthForm'
import FormField from '../components/FormField'

// Receive a callback to switch to the registration screen
function Login({ onSwitchToRegister }) {
    const { values, setValue, error, success, isSubmitting, submit } = useAuthForm({
        fields: { username: '', password: '' },
        requiredFields: ['username', 'password'],
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        submit('/users/login', {
            successMessage: 'Login successful!',
            // Store the JWT token received from the backend
            onSuccess: (data) => localStorage.setItem('access_token', data.access_token),
        })
    }

    return (
        <div>
            <h1>Login</h1>
            {error && <p>{error}</p>}
            {success && <p>{success}</p>}
            <form onSubmit={handleSubmit}>

                <FormField
                    id="username"
                    label="Username"
                    placeholder="Enter your username"
                    value={values.username}
                    onChange={(value) => setValue('username', value)}
                />

                <FormField
                    id="password"
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    value={values.password}
                    onChange={(value) => setValue('password', value)}
                />

                <button type="submit" disabled={isSubmitting}>
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
