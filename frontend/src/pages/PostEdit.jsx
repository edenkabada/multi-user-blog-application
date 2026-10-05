import { useState, useEffect } from 'react'
import { FileText, Save, Type } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import { API_BASE_URL } from '../config'
import './PostEdit.css'

function PostEdit() {

    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [titleError, setTitleError] = useState('')
    const [contentError, setContentError] = useState('')
    const [error, setError] = useState('')
    const [post, setPost] = useState(null)
    const { postId } = useParams()
    const navigate = useNavigate()

    const { logout } = useAuth()

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
        fetch(`${API_BASE_URL}/posts/${postId}`)
            .then((response) => response.json())
            .then((data) => {
                setPost(data)

                const savedTitle = localStorage.getItem(`post_edit_title_${postId}`)
                const savedContent = localStorage.getItem(`post_edit_content_${postId}`)

                setTitle(savedTitle ?? data.title)
                setContent(savedContent ?? data.content)
            })
            .catch(() => {
                setError('Failed to load post.')
            })
    }, [postId])

    // The logged-in user is authorized only if they own the post
    const isAuthorized = post != null && Number(post.userId) === Number(currentUserId)

    // Redirect away if the logged-in user doesn't own this post
    useEffect(() => {
        if (post && !isAuthorized) {
            navigate(`/posts/${postId}`)
        }
    }, [post, isAuthorized, postId, navigate])

    if (!post || !isAuthorized) {
        return <p>Loading...</p>
    }

    // Handle form submission and update the post
    const handleSubmit = async (event) => {
        event.preventDefault()

        setTitleError('')
        setContentError('')
        setError('')

        if (!title.trim()) {
            setTitleError('Please enter a title.')
            return
        }

        if (title.length > 100) {
            setTitleError('Title is too long. Please keep it under 100 characters.')
            return
        }

        if (!content.trim()) {
            setContentError('Please enter content.')
            return
        }

        if (content.length > 10000) {
            setContentError('Content is too long. Please keep it under 10,000 characters.')
            return
        }

        const token = localStorage.getItem('access_token')

        try {
            const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
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

            localStorage.removeItem(`post_edit_title_${postId}`)
            localStorage.removeItem(`post_edit_content_${postId}`)

            navigate(`/posts/${postId}`)

        } catch {
            setError('Failed to update post. Please try again.')
        }
    }

    return (
        <>
            <nav className="navbar post-create-navbar">
                <div
                    className="logo"
                    onClick={() => navigate('/')}
                >
                    <span className="logo-accent">MU</span>Blog
                </div>

                <div className="navbar-actions">
                    <button
                        className="create-post-button"
                        onClick={() => navigate('/posts/new')}
                    >
                        Create Post
                    </button>

                    <button
                        className="login-button"
                        onClick={() => {
                            logout()
                            navigate('/')
                        }}
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <main className="post-edit-page">
                <div className="post-edit-header">
                    <div className="post-edit-header-text">
                        <h1>Edit Post</h1>
                        <p>Update your post</p>
                    </div>

                    <img
                        src="/create-post-illustration.png"
                        alt=""
                        className="post-edit-illustration"
                    />
                </div>

                <section className="post-edit-container">

                    {error && <p className="form-error">{error}</p>}

                    <form onSubmit={handleSubmit}>
                        <div className="title-field">
                            <label htmlFor="title">
                                <Type size={18} className="form-icon" />
                                Title
                            </label>

                            <input
                                id="title"
                                dir="auto"
                                type="text"
                                value={title}
                                onChange={(event) => {
                                    setTitle(event.target.value)
                                    localStorage.setItem(`post_edit_title_${postId}`, event.target.value)
                                    setTitleError('')
                                    setError('')
                                }}
                            />

                            <div className="title-validation">
                                {titleError && <p className="field-error">{titleError}</p>}

                                <p className={`character-count ${title.length > 100 ? 'character-count-error' : ''}`}>
                                    {title.length} / 100
                                </p>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="content">
                                <FileText size={18} className="form-icon" />
                                Content
                            </label>

                            <textarea
                                id="content"
                                dir="auto"
                                value={content}
                                onChange={(event) => {
                                    setContent(event.target.value)
                                    localStorage.setItem(`post_edit_content_${postId}`, event.target.value)
                                    setContentError('')
                                    setError('')
                                }}
                                placeholder="Write your story, thoughts, or ideas..."
                            />

                            <div className="content-validation">
                                {contentError && <p className="field-error">{contentError}</p>}

                                <p className={`character-count ${content.length > 10000 ? 'character-count-error' : ''}`}>
                                    {content.length.toLocaleString()} / 10,000
                                </p>
                            </div>
                        </div>

                        <div className="post-edit-actions">
                            <button
                                type="button"
                                onClick={() => {
                                    localStorage.removeItem(`post_edit_title_${postId}`)
                                    localStorage.removeItem(`post_edit_content_${postId}`)
                                    navigate(`/posts/${postId}`)
                                }}
                            >
                                Cancel
                            </button>

                            <button type="submit">
                                <Save size={16} />
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