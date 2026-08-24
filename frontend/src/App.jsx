import { useState } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import Home from './pages/Home'
import PostCreate from './pages/PostCreate'
import ProtectedRoute from './ProtectedRoute'

function App() {

  // Controls whether the user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem('access_token')
  )


  return (
    <BrowserRouter>
      <div className="app">
        <Routes>

          {/* Display the Home page */}
          <Route
            path="/"
            element={<Home isLoggedIn={isLoggedIn} />}
          />

          {/* Display the Login page */}
          <Route
            path="/login"
            element={
              <Login
                onLoginSuccess={() => setIsLoggedIn(true)}
              />
            }
          />

          {/* Display the Registration page */}
          <Route
            path="/register"
            element={<Register />}
          />

          {/* Protect the Post Creation page */}
          <Route
            path="/posts/new"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <PostCreate />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App