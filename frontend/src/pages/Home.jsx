import { useState } from 'react'


function Home({ isLoggedIn, onLogin, onCreatePost }) {

  // Control the login message modal
  const [showLoginMessage, setShowLoginMessage] = useState(false)

  // Handle the Create Post button click
  const handleCreatePostClick = () => {
    if (isLoggedIn) {
      onCreatePost()
    } else {
      setShowLoginMessage(true)
    }
  }


  return (
    <>
      {/* Navigation bar */}
      <nav className="navbar">
        <div className="logo">
          Multi User Blog
        </div>

        <div className="navbar-actions">
          <button
            className="create-post-button"
            onClick={handleCreatePostClick}
          >
            Create Post
          </button>

          {!isLoggedIn && (
            <button
              className="login-button"
              onClick={onLogin}
            >
              Login
            </button>
          )}
        </div>
      </nav>

      {/* Welcome section */}
      <main>
        <section className="welcome-section">
          <h1>Welcome to our blog</h1>
          <p>Discover stories from our community</p>
        </section>
      </main>

      {/* Login message modal for unauthenticated users */}
      {showLoginMessage && (
        <div className="modal-overlay">
          <div className="login-modal">
            <button
              className="modal-close"
              onClick={() => setShowLoginMessage(false)}
            >
              ×
            </button>

            <p>You need to log in to create a post.</p>
          </div>
        </div>
      )}
    </>
  )
}

export default Home