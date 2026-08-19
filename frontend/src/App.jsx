import { useState } from 'react'
import './App.css'
import Register from './pages/Register'
import Login from './pages/Login'

function App() {

  // Controls whether the registration screen is displayed
  const [showRegister, setShowRegister] = useState(false)
  // Controls whether the login/registration screens are displayed
  const [showLogin, setShowLogin] = useState(false)

  return (
    <>
      {/* Show the Login button only on the main page */}
      {!showLogin && (
        <button className="login-button" onClick={() => setShowLogin(true)}>
          Login
        </button>
      )}

      {/* Display the Login or Registration screen after clicking Login */}
      {showLogin && (
        <>
          {showRegister ? (
            <Register onSwitchToLogin={() => setShowRegister(false)} />
          ) : (
            <Login onSwitchToRegister={() => setShowRegister(true)} />
          )}
        </>
      )}
    </>
  )
}

export default App
