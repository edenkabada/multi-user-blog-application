import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config'
import './Home.css'


function Home() {

  // Control the login message modal
  const [showLoginMessage, setShowLoginMessage] = useState(false)
  const [posts, setPosts] = useState([])
  const { isLoggedIn, logout, user } = useAuth()

  // Fetch posts from the backend
  useEffect(() => {
    const token = localStorage.getItem('access_token')

    fetch(`${API_BASE_URL}/posts`, {
      headers: token
        ? {
          Authorization: `Bearer ${token}`,
        }
        : {},
    })
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
    <div className="home-page">
      {/* Navigation bar */}
      <nav className="navbar">
        <div className="logo">
          <span className="logo-accent">MU</span>Blog
        </div>

        <div className="navbar-actions">
          <button
            className="create-post-button"
            onClick={handleCreatePostClick}
          >
            Create Post
          </button>

          {isLoggedIn && (
            <button
              className="login-button"
              onClick={() => navigate(`/profile/${user.userId}`)}
            >
              My Profile
            </button>
          )}

          {isLoggedIn && user?.role === 'admin' && (
            <button
              className="login-button"
              onClick={() => navigate('/admin/dashboard')}
            >
              Admin Dashboard
            </button>
          )}

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
              onClick={() => {
                logout()
                navigate('/')
              }}
            >
              Logout
            </button>
          )}
        </div>
      </nav>

      <main>
        {/* Welcome section */}
        <section className="welcome-section">
          <div className="welcome-content">
            <span className="welcome-tagline">SHARE &middot; LEARN &middot; GROW</span>
            <h1>Welcome to our blog</h1>
            <p>Discover stories from our community</p>
          </div>

          <div className="welcome-illustration">
            <img
              src="/welcome-illustration.svg"
              alt="Blog illustration"
            />
          </div>
        </section>

        {/* Display latest posts */}
        <section className="posts-section">
          <h2>Latest Posts</h2>

          <div className="posts-list">
            {posts.length === 0 ? (
              <div className="empty-posts">
                <h3>No posts yet</h3>
                <p>Be the first to share something with the community.</p>
              </div>
            ) : (
              posts.map((post) => (
                <article key={post.postId} className="post-card">
                  <div className="post-card-header">
                    <h3>{post.title}</h3>

                    <div className="post-meta">
                      <span>
                        By{' '}
                        <span
                          className="post-meta-username"
                          role="link"
                          tabIndex={0}
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/profile/${post.userId}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') navigate(`/profile/${post.userId}`)
                          }}
                        >
                          {post.username}
                        </span>
                      </span>
                      <span>·</span>
                      <span>
                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>

                      {post.updatedAt && (
                        <>
                          <span>·</span>
                          <span className="post-meta-edited">Edited</span>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="post-preview">{post.content}</p>

                  <div className="post-card-actions">
                    <div className="post-engagement">
                      <span className="post-likes">
                        <span className={post.likedByCurrentUser ? 'liked-heart' : ''}>
                          {post.likedByCurrentUser ? '♥' : '♡'}
                        </span>{' '}
                        {post.likesCount}
                      </span>

                      <span className="post-comments">
                        💬 {post.commentsCount}
                      </span>
                    </div>

                    <button onClick={() => navigate(`/posts/${post.postId}`)}>
                      Read More →
                    </button>
                  </div>
                </article>
              ))
            )}
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

            <p>Please log in to create a post.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home