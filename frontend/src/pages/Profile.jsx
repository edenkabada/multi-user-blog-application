import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authFetch } from '../utils/authFetch'
import './Profile.css'

function Profile() {

  const { id } = useParams()
  const { user } = useAuth()

  // True when the logged-in user is viewing their own profile
  const isOwnProfile = !!user && String(user.userId) === id

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [posts, setPosts] = useState([])
  const [comments, setComments] = useState([])
  const [activeTab, setActiveTab] = useState('posts')

  const [isEditing, setIsEditing] = useState(false)
  const [editUsername, setEditUsername] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editError, setEditError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Load the profile: /users/me for your own profile (includes email),
  // /users/:id for anyone else's (public fields only). Uses an inline
  // .then() chain directly in the effect, matching Home.jsx's existing
  // fetch pattern in this codebase.
  useEffect(() => {
    const url = isOwnProfile
      ? 'http://localhost:3000/users/me'
      : `http://localhost:3000/users/${id}`

    authFetch(url).then((response) => {
      if (response.status === 404) {
        setNotFound(true)
        setLoading(false)
        return
      }

      if (response.ok) {
        response.json().then((data) => {
          setProfile(data)
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })
  }, [id, isOwnProfile])

  // Load this user's posts and comments for the tabs below (SCRUM-39 and
  // SCRUM-40). Both endpoints already return results newest-first, so no
  // client-side sorting is needed here.
  useEffect(() => {
    authFetch(`http://localhost:3000/users/${id}/posts`).then((response) => {
      if (response.ok) {
        response.json().then((data) => setPosts(data))
      }
    })

    authFetch(`http://localhost:3000/users/${id}/comments`).then((response) => {
      if (response.ok) {
        response.json().then((data) => setComments(data))
      }
    })
  }, [id])

  const handleEditClick = () => {
    setEditUsername(profile.username)
    setEditEmail(profile.email ?? '')
    setEditError('')
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditError('')
  }

  // Save changes via the existing PATCH /users/me endpoint (SCRUM-43),
  // and update the displayed profile directly from its response — no
  // refetch or page reload needed.
  const handleSave = async (e) => {
    e.preventDefault()
    setEditError('')
    setIsSaving(true)

    const response = await authFetch('http://localhost:3000/users/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: editUsername,
        email: editEmail,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      // The ValidationPipe can return an array of messages when multiple
      // fields fail validation at once
      setEditError(
        Array.isArray(data.message) ? data.message.join(', ') : data.message
      )
      setIsSaving(false)
      return
    }

    setProfile(data)
    setIsEditing(false)
    setIsSaving(false)
  }

  if (loading) {
    return (
      <div className="profile-page">
        <p>Loading profile…</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="profile-page">
        <p>User not found.</p>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const joinDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="profile-page">
      <div className="profile-container">

        {!isEditing && (
          <>
            <h1>{profile.username}</h1>
            <p className="profile-joined">Joined {joinDate}</p>

            {isOwnProfile && (
              <p className="profile-email">{profile.email}</p>
            )}

            {isOwnProfile && (
              <button
                className="edit-profile-button"
                onClick={handleEditClick}
              >
                Edit Profile
              </button>
            )}
          </>
        )}

        {!isEditing && (
          <div className="profile-tabs-section">
            <div className="profile-tabs">
              <button
                className={activeTab === 'posts' ? 'active' : ''}
                onClick={() => setActiveTab('posts')}
              >
                Posts
              </button>
              <button
                className={activeTab === 'comments' ? 'active' : ''}
                onClick={() => setActiveTab('comments')}
              >
                Comments
              </button>
            </div>

            {activeTab === 'posts' && (
              <div className="profile-tab-content">
                {posts.length === 0 && (
                  <p className="profile-empty-state">No posts yet.</p>
                )}

                {posts.map((post) => (
                  <article key={post.postId} className="profile-item-card">
                    <h3>{post.title}</h3>
                    <p className="profile-item-date">
                      {new Date(post.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="profile-item-preview">{post.content}</p>
                  </article>
                ))}
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="profile-tab-content">
                {comments.length === 0 && (
                  <p className="profile-empty-state">No comments yet.</p>
                )}

                {comments.map((comment) => (
                  <article
                    key={comment.commentId}
                    className="profile-item-card"
                  >
                    <p className="profile-item-preview">{comment.content}</p>
                    <p className="profile-item-date">
                      {new Date(comment.createdAt).toLocaleDateString(
                        'en-US',
                        { month: 'long', day: 'numeric', year: 'numeric' }
                      )}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {isOwnProfile && isEditing && (
          <form className="profile-edit-form" onSubmit={handleSave}>
            <h1>Edit Profile</h1>

            {editError && <p className="error-message">{editError}</p>}

            <label htmlFor="edit-username">Username</label>
            <input
              id="edit-username"
              type="text"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
            />

            <label htmlFor="edit-email">Email</label>
            <input
              id="edit-email"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
            />

            <div className="profile-edit-actions">
              <button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save'}
              </button>

              <button
                type="button"
                className="cancel-button"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}

export default Profile
