import { createContext, useContext, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

// Decodes the payload of a JWT without verifying its signature. This is
// only used to read the userId/username the backend already embeds in
// the token, for display purposes — it is not a security check.
function decodeToken(token) {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload))
    return { userId: decoded.sub, username: decoded.username }
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('access_token'))
  const [user, setUser] = useState(() => {
    const existingToken = localStorage.getItem('access_token')
    return existingToken ? decodeToken(existingToken) : null
  })
  const navigate = useNavigate()

  // Store a newly issued token and derive the current user from it
  const login = useCallback((newToken) => {
    localStorage.setItem('access_token', newToken)
    setToken(newToken)
    setUser(decodeToken(newToken))
  }, [])

  // Clear the stored token and redirect to the login page
  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    setToken(null)
    setUser(null)
    navigate('/login')
  }, [navigate])

  const value = {
    user,
    token,
    isLoggedIn: !!token,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
