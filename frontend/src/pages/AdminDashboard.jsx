import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminDashboard.css'

function AdminDashboard() {

    const [users, setUsers] = useState([])
    const [posts, setPosts] = useState([])
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    const navigate = useNavigate()

    // Load the users and posts lists together on mount
    useEffect(() => {
        const token = localStorage.getItem('access_token')
        const headers = { Authorization: `Bearer ${token}` }

        const loadDashboard = async () => {
            try {
                const [usersResponse, postsResponse] = await Promise.all([
                    fetch('http://localhost:3000/admin/users', { headers }),
                    fetch('http://localhost:3000/admin/posts', { headers }),
                ])

                if (!usersResponse.ok || !postsResponse.ok) {
                    throw new Error('Failed to load dashboard data')
                }

                setUsers(await usersResponse.json())
                setPosts(await postsResponse.json())
            } catch {
                setError('Failed to load dashboard data. Please try again.')
            } finally {
                setIsLoading(false)
            }
        }

        loadDashboard()
    }, [])

    // Block or unblock a user
    const handleToggleBlock = async (targetUser) => {
        const action = targetUser.isBlocked ? 'unblock' : 'block'
        const token = localStorage.getItem('access_token')

        try {
            const response = await fetch(
                `http://localhost:3000/admin/users/${targetUser.userId}/${action}`,
                {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}` },
                }
            )

            if (!response.ok) {
                throw new Error('Failed to update user')
            }

            const updatedUser = await response.json()
            setUsers((prev) =>
                prev.map((u) => (u.userId === updatedUser.userId ? updatedUser : u))
            )
        } catch {
            setError('Failed to update user. Please try again.')
        }
    }

    // Delete any post, after confirming
    const handleDeletePost = async (post) => {
        if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) {
            return
        }

        const token = localStorage.getItem('access_token')

        try {
            const response = await fetch(
                `http://localhost:3000/admin/posts/${post.postId}`,
                {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                }
            )

            if (!response.ok) {
                throw new Error('Failed to delete post')
            }

            setPosts((prev) => prev.filter((p) => p.postId !== post.postId))
        } catch {
            setError('Failed to delete post. Please try again.')
        }
    }

    if (isLoading) {
        return <p>Loading...</p>
    }

    return (
        <>
            <nav className="navbar">
                <div className="logo" onClick={() => navigate('/')}>
                    Multi User Blog
                </div>

                <div className="navbar-actions">
                    <span className="admin-badge">Admin</span>
                </div>
            </nav>

            <main className="admin-dashboard-page">
                <h1>Admin Dashboard</h1>

                {error && <p className="admin-dashboard-error">{error}</p>}

                <section className="admin-dashboard-section">
                    <h2>Users ({users.length})</h2>

                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((targetUser) => (
                                    <tr key={targetUser.userId}>
                                        <td>{targetUser.username}</td>
                                        <td>{targetUser.email}</td>
                                        <td>{targetUser.role}</td>
                                        <td>
                                            <span
                                                className={
                                                    targetUser.isBlocked
                                                        ? 'admin-status blocked'
                                                        : 'admin-status active'
                                                }
                                            >
                                                {targetUser.isBlocked ? 'Blocked' : 'Active'}
                                            </span>
                                        </td>
                                        <td>
                                            <button onClick={() => handleToggleBlock(targetUser)}>
                                                {targetUser.isBlocked ? 'Unblock' : 'Block'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="admin-dashboard-section">
                    <h2>Posts ({posts.length})</h2>

                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Author</th>
                                    <th>Created</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.map((post) => (
                                    <tr key={post.postId}>
                                        <td>{post.title}</td>
                                        <td>{post.username}</td>
                                        <td>
                                            {new Date(post.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td>
                                            <button
                                                className="admin-delete-button"
                                                onClick={() => handleDeletePost(post)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </>
    )
}

export default AdminDashboard
