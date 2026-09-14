import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Home.css'


function Home() {

  // Control the login message modal
  const [showLoginMessage, setShowLoginMessage] = useState(false)
  const [posts, setPosts] = useState([])
  const { isLoggedIn, logout } = useAuth()

  // Fetch posts from the backend
  useEffect(() => {
    fetch('http://localhost:3000/posts')
      .then((response) => response.json())
      .then((data) => setPosts(data))
  }, [])

  const navigate = useNavigate()

  // Handle the Create Post button click
  const handleCreatePostClick = () => {
    if (isLoggedIn) {
      navigate('/posts/new')
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
              onClick={() => navigate('/login')}
            >
              Login
            </button>
          )}

          {isLoggedIn && (
            <button
              className="login-button"
              onClick={logout}
            >
              Logout
            </button>
          )}
        </div>
      </nav>

      <main>
        {/* Welcome section */}
        <section className="welcome-section">
          <h1>Welcome to our blog</h1>
          <p>Discover stories from our community</p>
        </section>

        {/* Display latest posts */}
        <section className="posts-section">
          <h2>Latest Posts</h2>

          <div className="posts-list">
            {posts.map((post) => (
              <article key={post.postId} className="post-card">
                <h3>{post.title}</h3>

                <p className="post-author">By {post.username}</p>

                <p className="post-date">
                  {new Date(post.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}

                  {post.updatedAt && ' · Edited'}
                </p>

                <p className="post-preview">{post.content}</p>

                <button onClick={() => navigate(`/posts/${post.postId}`)}>
                  Read More
                </button>
              </article>
            ))}
          </div>
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