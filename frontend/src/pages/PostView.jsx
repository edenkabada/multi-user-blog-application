import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './PostView.css'

function PostView() {

    // Component state

    // Stores the current post
    const [post, setPost] = useState(null)

    // Stores whether the user is logged in
    const isLoggedIn = !!localStorage.getItem('access_token')

    // Controls the delete confirmation modal
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    // Stores the post deletion error
    const [deleteError, setDeleteError] = useState('')

    // Stores the comment being written
    const [commentContent, setCommentContent] = useState('')
    // Stores the comment creation error
    const [commentError, setCommentError] = useState('')

    // Stores the comments for the current post
    const [comments, setComments] = useState([])
    // Stores the comments loading error
    const [commentsError, setCommentsError] = useState('')

    // Route parameters and navigation
    const { postId } = useParams()
    const navigate = useNavigate()

    // Authentication and post ownership

    // Get the current user's ID from the JWT token
    const getCurrentUserId = () => {
        const token = localStorage.getItem('access_token')

        if (!token) {
            return null
        }

        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.sub
    }

    const currentUserId = getCurrentUserId()

    // Check whether the current user owns the post
    const isPostOwner =
        isLoggedIn && Number(post?.userId) === Number(currentUserId)

    // Data fetching

    // Fetch the post details
    useEffect(() => {
        fetch(`http://localhost:3000/posts/${postId}`)
            .then((response) => response.json())
            .then((data) => setPost(data))
    }, [postId])

    // Fetch comments for the current post
    useEffect(() => {
        setCommentsError('')

        fetch(`http://localhost:3000/comments/${postId}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch comments')
                }

                return response.json()
            })
            .then((data) => setComments(data))
            .catch(() => {
                setCommentsError('Failed to load comments. Please try again.')
            })
    }, [postId])

    // Event handlers

    // Navigation handlers
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

    // Navigate to the post edit page
    const handleEditPost = () => {
        navigate(`/posts/${post.postId}/edit`)
    }

    // Open the delete confirmation modal
    const handleDeletePost = () => {
        setDeleteError('')
        setShowDeleteModal(true)
    }

    // Delete the post after confirmation
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
            setDeleteError('Failed to delete post. Please try again.')
        }
    }

    // Close the delete confirmation modal
    const handleCloseDeleteModal = () => {
        setShowDeleteModal(false)
        setDeleteError('')
    }

    // Create a new comment
    const handleAddComment = async (event) => {
        event.preventDefault()
        setCommentError('')

        if (!commentContent.trim()) {
            setCommentError('Comment cannot be empty.')
            return
        }

        const token = localStorage.getItem('access_token')

        try {
            // Send the new comment to the API
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
            return
        }

        try {
            const commentsResponse = await fetch(
                `http://localhost:3000/comments/${postId}`
            )

            if (!commentsResponse.ok) {
                throw new Error('Failed to fetch comments')
            }

            const updatedComments = await commentsResponse.json()
            setComments(updatedComments)
        } catch {
            setCommentsError('Failed to load comments. Please try again.')
        }
    }

    // Render loading state
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
                                <button
                                    className="edit-post-button"
                                    onClick={handleEditPost}
                                >
                                    Edit
                                </button>

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

                {comments.length > 0 && (
                    <h2 className="comments-count">
                        {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
                    </h2>
                )}

                {/* Comment creation form */}
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
                            {/* Display comment validation or API errors */}
                            {commentError && (
                                <p className="comment-error">
                                    {commentError}
                                </p>
                            )}

                            <div className="comment-create-actions">
                                <button type="submit">
                                    Post Comment
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                {/* Comments */}
                <section className="comments-section">
                    {commentsError && (
                        <p className="comments-error">
                            {commentsError}
                        </p>
                    )}

                    {!commentsError && comments.length === 0 && (
                        <p className="no-comments">
                            No comments yet.
                        </p>
                    )}

                    {!commentsError && comments.length > 0 && (
                        <div className="comments-list">
                            {comments.map((comment) => (
                                <article
                                    className="comment"
                                    key={comment.commentId}
                                >
                                    <p className="comment-author">
                                        {comment.username}
                                    </p>

                                    <p className="comment-content">
                                        {comment.content}
                                    </p>

                                    <p className="comment-date">
                                        {new Date(comment.createdAt).toLocaleDateString(
                                            'en-US',
                                            {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric',
                                            }
                                        )}{' '}
                                        at{' '}
                                        {new Date(comment.createdAt).toLocaleTimeString(
                                            'en-GB',
                                            {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            }
                                        )}
                                    </p>

                                </article>
                            ))}
                        </div>
                    )}
                </section>
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

                        {deleteError && (
                            <p className="delete-modal-error">
                                {deleteError}
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