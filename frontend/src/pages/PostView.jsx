import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './PostView.css'

function PostView() {

    // State
    const [post, setPost] = useState(null)
    const [isLoggedIn, setIsLoggedIn] = useState(
        !!localStorage.getItem('access_token')
    )
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [error, setError] = useState('')

    const [commentContent, setCommentContent] = useState('')
    const [commentError, setCommentError] = useState('')

    // Route parameters and navigation
    const { postId } = useParams()
    const navigate = useNavigate()

    // Authentication and post ownership
    const getCurrentUserId = () => {
        const token = localStorage.getItem('access_token')

        if (!token) {
            return null
        }

        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.sub
    }

    const currentUserId = getCurrentUserId()

    const isPostOwner =
        isLoggedIn && Number(post?.userId) === Number(currentUserId)

    // Navigation
    const handleCreatePostClick = () => {
        if (isLoggedIn) {
            navigate('/posts/new')
        } else {
            navigate('/login')
        }
    }

    const handleBackHomeClick = () => {
        navigate('/')
    }

    // Fetch post
    useEffect(() => {
        fetch(`http://localhost:3000/posts/${postId}`)
            .then((response) => response.json())
            .then((data) => setPost(data))
    }, [postId])

    // Edit post
    const handleEditPost = () => {
        navigate(`/posts/${post.postId}/edit`)
    }

    // Delete post
    const handleDeletePost = () => {
        setError('')
        setShowDeleteModal(true)
    }

    const handleConfirmDelete = async () => {
        const token = localStorage.getItem('access_token')

        try {
            const response = await fetch(
                `http://localhost:3000/posts/${postId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            if (!response.ok) {
                throw new Error('Failed to delete post')
            }

            navigate('/')
        } catch {
            setError('Failed to delete post. Please try again.')
        }
    }

    const handleCloseDeleteModal = () => {
        setShowDeleteModal(false)
        setError('')
    }

    // Add comment
    const handleAddComment = async (event) => {
        event.preventDefault()
        setCommentError('')

        if (!commentContent.trim()) {
            setCommentError('Comment cannot be empty.')
            return
        }

        const token = localStorage.getItem('access_token')

        try {
            const response = await fetch(
                `http://localhost:3000/comments/${postId}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        content: commentContent,
                    }),
                }
            )

            if (!response.ok) {
                throw new Error('Failed to add comment')
            }

            setCommentContent('')
        } catch {
            setCommentError('Failed to add comment. Please try again.')
        }
    }

    // Loading state
    if (!post) {
        return <p>Loading...</p>
    }


    return (
        <>
            {/* Navigation bar */}
            <nav className="navbar">
                <div
                    className="logo"
                    onClick={handleBackHomeClick}
                >
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
                </div>
            </nav>

            {/* Post details */}
            <main className="post-view-page">
                <article className="post-view-container">
                    <h1>{post.title}</h1>

                    <p className="post-author">
                        By {post.username}
                    </p>

                    <p className="post-date">
                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                        })}{' '}
                        at{' '}
                        {new Date(post.createdAt).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}

                        {post.updatedAt && ' · Edited'}
                    </p>

                    <div className="post-content">
                        {post.content}
                    </div>

                    {/* Post actions */}
                    <div className="post-view-actions">
                        <button
                            className="back-home-button"
                            onClick={handleBackHomeClick}
                        >
                            ← Back to Home
                        </button>

                        {isPostOwner && (
                            <div className="post-owner-actions">

                                {/* Edit post */}
                                <button
                                    className="edit-post-button"
                                    onClick={handleEditPost}
                                >
                                    Edit
                                </button>

                                {/* Delete post */}
                                <button
                                    className="delete-post-button"
                                    onClick={handleDeletePost}
                                >
                                    Delete
                                </button>

                            </div>
                        )}
                    </div>
                </article>
                {/* Comment creation */}
                {isLoggedIn && (
                    <section className="comment-create-section">
                        <form onSubmit={handleAddComment}>
                            <textarea
                                placeholder="Write a comment..."
                                value={commentContent}
                                onChange={(event) =>
                                    setCommentContent(event.target.value)
                                }
                            />
                            {/* Validation and API error message */}
                            {commentError && (
                                <p className="comment-error">
                                    {commentError}
                                </p>
                            )}
                            
                            {/* Submit comment */}
                            <div className="comment-create-actions">
                                <button type="submit">
                                    Post Comment
                                </button>
                            </div>
                        </form>
                    </section>
                )}
            </main>

            {/* Delete confirmation modal */}
            {showDeleteModal && (
                <div className="delete-modal-overlay">
                    <div className="delete-modal">

                        <div className="delete-modal-header">
                            <h2>Delete Post</h2>

                            <button
                                className="delete-modal-close"
                                onClick={handleCloseDeleteModal}
                            >
                                ×
                            </button>
                        </div>

                        <p>
                            Are you sure you want to delete this post?<br />
                            This action cannot be undone.
                        </p>

                        {error && (
                            <p className="delete-modal-error">
                                {error}
                            </p>
                        )}

                        <div className="delete-modal-actions">
                            <button
                                type="button"
                                onClick={handleCloseDeleteModal}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                            >
                                Delete
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    )
}

export default PostView