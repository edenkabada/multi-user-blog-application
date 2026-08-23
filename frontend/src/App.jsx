import { useState } from 'react'
import './App.css'
import Register from './pages/Register'
import Login from './pages/Login'
import Home from './pages/Home'

function App() {

  // Controls whether the login/registration screens are displayed
  const [showLogin, setShowLogin] = useState(false)

  // Controls whether the user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem('access_token')
  )

  // Controls whether the registration screen is displayed
  const [showRegister, setShowRegister] = useState(false)

  return (
    <div className="app">
      {!showLogin ? (
        <Home
          isLoggedIn={isLoggedIn}
          onLogin={() => setShowLogin(true)}
        />
      ) : (
        <>
          {/* Display the Login or Registration screen */}
          {showRegister ? (
            <Register
              onSwitchToLogin={() => setShowRegister(false)}
              onBackToHome={() => setShowLogin(false)}
            />
          ) : (
            <Login
              onSwitchToRegister={() => setShowRegister(true)}
              onBackToHome={() => setShowLogin(false)}
              onLoginSuccess={() => setIsLoggedIn(true)}
            />
          )}
        </>
      )}
    </div>
  )
}

export default App