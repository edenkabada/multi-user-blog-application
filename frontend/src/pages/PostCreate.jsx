import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { FileText, Send, Type } from 'lucide-react'
import { API_BASE_URL } from '../config'
import './PostCreate.css'

function PostCreate() {

    // Manage the post form fields and error message
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [titleError, setTitleError] = useState('')
    const [contentError, setContentError] = useState('')
    const [error, setError] = useState('')

    const navigate = useNavigate()

    const { logout } = useAuth()

    useEffect(() => {
        const savedTitle = localStorage.getItem('post_draft_title')
        const savedContent = localStorage.getItem('post_draft_content')

        if (savedTitle) {
            setTitle(savedTitle)
        }

        if (savedContent) {
            setContent(savedContent)
        }
    }, [])

    // Validate the form and create the post
    const handleSubmit = async (event) => {

        event.preventDefault()

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

        // Get the authentication token from local storage
        const token = localStorage.getItem('access_token')

        try {

            // Send the new post to the backend
            const response = await fetch(`${API_BASE_URL}/posts`, {
                method: 'POST',
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
                throw new Error('Failed to create post')
            }

            // Remove the saved draft after successful creation
            localStorage.removeItem('post_draft_title')
            localStorage.removeItem('post_draft_content')

            // Return to the home page after successful creation
            navigate('/')

        } catch {
            setError('Failed to create post. Please try again.')
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

            <main className="post-create-page">
                <div className="post-create-header">
                    <div className="post-create-header-text">
                        <h1>Create New Post</h1>
                        <p>Share your story with the community</p>
                    </div>

                    <img
                        src="/create-post-illustration.png"
                        alt=""
                        className="post-create-illustration"
                    />
                </div>

                <section className="post-create-container">

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
                                    localStorage.setItem('post_draft_title', event.target.value)
                                    setTitleError('')
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
                                    localStorage.setItem('post_draft_content', event.target.value)
                                    setContentError('')
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


                        <div className="post-create-actions">
                            <button
                                type="button"
                                onClick={() => {
                                    localStorage.removeItem('post_draft_title')
                                    localStorage.removeItem('post_draft_content')
                                    navigate(-1)
                                }}
                            >
                                Cancel
                            </button>

                            <button type="submit">
                                <Send size={16} />
                                Publish Post
                            </button>
                        </div>
                    </form>
                </section>
            </main>
        </>
    )
}

export default PostCreate