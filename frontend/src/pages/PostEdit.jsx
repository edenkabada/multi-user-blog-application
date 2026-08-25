import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './PostEdit.css'

function PostEdit() {

    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [error, setError] = useState('')
    const [post, setPost] = useState(null)
    const [isAuthorized, setIsAuthorized] = useState(false)
    const { postId } = useParams()
    const navigate = useNavigate()

    // Get the ID of the currently logged-in user
    const getCurrentUserId = () => {
        const token = localStorage.getItem('access_token')

        if (!token) {
            return null
        }

        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.sub
    }

    const currentUserId = getCurrentUserId()

    // Fetch the existing post data
    useEffect(() => {
        fetch(`http://localhost:3000/posts/${postId}`)
            .then((response) => response.json())
            .then((data) => {
                setPost(data)
                setTitle(data.title)
                setContent(data.content)
            })
            .catch(() => {
                setError('Failed to load post.')
            })
    }, [postId])

    // Check that the logged-in user owns the post
    useEffect(() => {
        if (!post) {
            return
        }

        if (Number(post.userId) !== Number(currentUserId)) {
            navigate(`/posts/${postId}`)
            return
        }

        setIsAuthorized(true)
    }, [post, currentUserId, postId, navigate])

    if (!post || !isAuthorized) {
        return <p>Loading...</p>
    }

    // Handle form submission and update the post
    const handleSubmit = async (event) => {
        event.preventDefault()

        if (!title.trim()) {
            setError('Please enter a title.')
            return
        }

        if (!content.trim()) {
            setError('Please enter content.')
            return
        }

        const token = localStorage.getItem('access_token')

        try {
            const response = await fetch(`http://localhost:3000/posts/${postId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    content,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to update post')
            }

            // Return to the post view after successful update
            navigate(`/posts/${postId}`)

        } catch {
            setError('Failed to update post. Please try again.')
        }
    }

    return (
        <>
            <nav className="navbar">
                <div
                    className="logo"
                    onClick={() => navigate('/')}
                >
                    Multi User Blog
                </div>

                <div className="navbar-actions">
                    <button
                        className="create-post-button"
                        onClick={() => navigate('/posts/new')}
                    >
                        Create Post
                    </button>
                </div>
            </nav>

            <main className="post-edit-page">
                <section className="post-edit-container">
                    <h1>Edit Post</h1>
                    <p>Update your post</p>

                    {error && <p className="form-error">{error}</p>}

                    <form onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="title">Title</label>
                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="content">Content</label>
                            <textarea
                                id="content"
                                value={content}
                                onChange={(event) => setContent(event.target.value)}
                            />
                        </div>

                        <div className="post-edit-actions">
                            <button
                                type="button"
                                onClick={() => navigate(`/posts/${postId}`)}
                            >
                                Cancel
                            </button>

                            <button type="submit">
                                Save Changes
                            </button>
                        </div>
                    </form>
                </section>
            </main>
        </>
    )
}

export default PostEdit