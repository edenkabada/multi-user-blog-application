import { useState } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import AdminLogin from './pages/AdminLogin'
import Home from './pages/Home'
import PostCreate from './pages/PostCreate'
import ProtectedRoute from './ProtectedRoute'
import PostView from './pages/PostView'
import PostEdit from './pages/PostEdit'

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

          {/* Display the Admin Login page */}
          <Route
            path="/admin/login"
            element={
              <AdminLogin
                onLoginSuccess={() => setIsLoggedIn(true)}
              />
            }
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

          {/* Display a specific post */}
          <Route
            path="/posts/:postId"
            element={<PostView />}
          />

          {/* Protect the post editing page */}
          <Route
            path="/posts/:postId/edit"
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <PostEdit />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App