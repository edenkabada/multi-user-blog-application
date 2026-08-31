import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Register from './pages/Register'
import Login from './pages/Login'
import Home from './pages/Home'
import PostCreate from './pages/PostCreate'
import ProtectedRoute from './ProtectedRoute'
import PostView from './pages/PostView'
import PostEdit from './pages/PostEdit'
import Profile from './pages/Profile'

function App() {

  return (
    <BrowserRouter>
      {/* AuthProvider must be inside BrowserRouter — it uses useNavigate
          for the logout redirect */}
      <AuthProvider>
        <div className="app">
          <Routes>

            {/* Display the Home page */}
            <Route
              path="/"
              element={<Home />}
            />

            {/* Display the Login page */}
            <Route
              path="/login"
              element={<Login />}
            />

            {/* Display the Registration page */}
            <Route
              path="/register"
              element={<Register />}
            />

            {/* Display a user's profile */}
            <Route
              path="/profile/:id"
              element={<Profile />}
            />

            {/* Protect the Post Creation page */}
            <Route
              path="/posts/new"
              element={
                <ProtectedRoute>
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
                <ProtectedRoute>
                  <PostEdit />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
