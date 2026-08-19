import useAuthForm from '../hooks/useAuthForm'
import FormField from '../components/FormField'

// Receive a callback to switch to the login screen
function Register({ onSwitchToLogin }) {
    const { values, setValue, error, success, isSubmitting, submit } = useAuthForm({
        fields: { username: '', email: '', password: '' },
        requiredFields: ['username', 'email', 'password'],
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        submit('/users/register', { successMessage: 'Registration successful!' })
    }

    return (
        <div>
            <h1>Register</h1>
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
                    id="email"
                    label="Email"
                    type="email"
                    placeholder="Enter your email"
                    value={values.email}
                    onChange={(value) => setValue('email', value)}
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
                    Register
                </button>

            </form>

            {/* Allow the user to switch to the Login screen */}
            <p>
                Already have an account?{' '}
                <button onClick={onSwitchToLogin}>
                    Login
                </button>
            </p>
        </div>
    )
}

export default Register
