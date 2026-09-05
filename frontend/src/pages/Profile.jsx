import { useParams } from 'react-router-dom'

// Placeholder for the profile page — the full UI (details, posts,
// comments, activity, follow/unfollow) is built in later tickets. This
// establishes the /profile/:id route as part of the routing foundation.
function Profile() {
  const { id } = useParams()

  return (
    <div className="profile-page">
      <p>Profile page for user #{id} — coming soon.</p>
    </div>
  )
}

export default Profile
