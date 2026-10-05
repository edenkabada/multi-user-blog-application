import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config'
import './PostView.css'

function PostView() {

    // Component state

    // Stores the current post
    const [post, setPost] = useState(null)

    // Stores whether the user is logged in
    const { isLoggedIn, logout } = useAuth()

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

    // Shared auth state, used only for the nav bar's Profile/Admin links
    // below -- the ownership/like logic above already reads the token
    // directly and is left untouched.
    const { user } = useAuth()

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
        const token = localStorage.getItem('access_token')

        fetch(`${API_BASE_URL}/posts/${postId}`, {
            headers: token
                ? {
                    Authorization: `Bearer ${token}`,
                }
                : {},
        })
            .then((response) => response.json())
            .then((data) => setPost(data))
    }, [postId])

    // Fetch comments for the current post
    useEffect(() => {
        setCommentsError('')

        const token = localStorage.getItem('access_token')

        fetch(`${API_BASE_URL}/comments/${postId}`, {
            headers: token
                ? {
                    Authorization: `Bearer ${token}`,
                }
                : {},
        })
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

    // Like or unlike a comment
    const handleCommentLike = async (comment) => {
        const token = localStorage.getItem('access_token')

        const endpoint = comment.likedByCurrentUser
            ? `${API_BASE_URL}/comments/${comment.commentId}/unlike`
            : `${API_BASE_URL}/comments/${comment.commentId}/like`

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error('Failed to update comment like')
            }

            // Update the comment immediately in the UI
            setComments((currentComments) =>
                currentComments.map((currentComment) =>
                    currentComment.commentId === comment.commentId
                        ? {
                            ...currentComment,
                            likedByCurrentUser:
                                !currentComment.likedByCurrentUser,
                            likesCount:
                                currentComment.likesCount +
                                (currentComment.likedByCurrentUser ? -1 : 1),
                        }
                        : currentComment
                )
            )
        } catch {
            // Keep the current UI state if the request fails
        }
    }

    const handlePostLike = async () => {
        const token = localStorage.getItem('access_token')

        const endpoint = post.likedByCurrentUser
            ? `${API_BASE_URL}/posts/${post.postId}/unlike`
            : `${API_BASE_URL}/posts/${post.postId}/like`

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error('Failed to update post like')
            }

            setPost((currentPost) => ({
                ...currentPost,
                likedByCurrentUser: !currentPost.likedByCurrentUser,
                likesCount:
                    currentPost.likesCount +
                    (currentPost.likedByCurrentUser ? -1 : 1),
            }))
        } catch {
            // Keep the current UI state if the request fails
        }
    }

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
                `${API_BASE_URL}/posts/${postId}`,
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
                `${API_BASE_URL}/comments/${postId}`,
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
                const data = await response.json().catch(() => null)

                const message = Array.isArray(data?.message)
                    ? data.message[0]
                    : data?.message

                if (message?.includes('content must be shorter than or equal to 3000 characters')) {
                    setCommentError('Comment must be 3000 characters or less.')
                } else {
                    setCommentError('Failed to add comment. Please try again.')
                }

                return
            }

            setCommentContent('')
        } catch {
            setCommentError('Failed to add comment. Please try again.')
            return
        }

        try {
            const commentsResponse = await fetch(
                `${API_BASE_URL}/comments/${postId}`
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
            <nav className="navbar post-view-navbar">
                <div
                    className="logo"
                    onClick={handleBackHomeClick}
                >
                    <span className="logo-accent">MU</span>Blog
                </div>

                <div className="navbar-actions">
                    <button
                        className="create-post-button"
                        onClick={handleCreatePostClick}
                    >
                        Create Post
                    </button>

                    {isLoggedIn && user && (
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

            {/* Post details */}
            <main className="post-view-page">
                <article className="post-view-container">
                    <h1>{post.title}</h1>

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
                            })}{' '}
                            at{' '}
                            {new Date(post.createdAt).toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </span>

                        {post.updatedAt && (
                            <>
                                <span>·</span>
                                <span className="post-meta-edited">Edited</span>
                            </>
                        )}
                    </div>

                    <div className="post-content">
                        {post.content}
                    </div>

                    {/* Post actions */}
                    <div className="post-view-actions">
                        <div className="post-engagement">
                            <div className="post-like">
                                <button
                                    onClick={handlePostLike}
                                    disabled={!isLoggedIn}
                                    aria-label={
                                        post.likedByCurrentUser
                                            ? 'Unlike post'
                                            : 'Like post'
                                    }
                                >
                                    <span className={post.likedByCurrentUser ? 'liked-heart' : ''}>
                                        {post.likedByCurrentUser ? '♥' : '♡'}
                                    </span>{' '}
                                    {post.likesCount}
                                </button>
                            </div>

                            <span className="post-comments">
                                💬 {comments.length}
                            </span>
                        </div>

                        {isPostOwner && (
                            <div className="post-owner-actions">
                                <button
                                    className="edit-post-button"
                                    onClick={handleEditPost}
                                >
                                    ✎ Edit
                                </button>

                                <button
                                    className="delete-post-button"
                                    onClick={handleDeletePost}
                                >
                                    🗑 Delete
                                </button>
                            </div>
                        )}
                    </div>
                </article>

                {/* Comments */}
                <section className="comments-card">
                    <h2>Comments</h2>

                    {/* Comment creation form */}
                    {isLoggedIn && (
                        <section className="comment-create-section">
                            <form onSubmit={handleAddComment}>
                                <textarea
                                    placeholder="Write a comment..."
                                    dir="auto"
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
                                            {comment.userId ? (
                                                <span
                                                    role="link"
                                                    tabIndex={0}
                                                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                                    onClick={() => navigate(`/profile/${comment.userId}`)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') navigate(`/profile/${comment.userId}`)
                                                    }}
                                                >
                                                    {comment.username}
                                                </span>
                                            ) : (
                                                comment.username
                                            )}
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

                                        <p className="comment-content">
                                            {comment.content}
                                        </p>

                                        <div className="comment-like">
                                            <button
                                                onClick={() => handleCommentLike(comment)}
                                                disabled={!isLoggedIn}
                                                aria-label={
                                                    comment.likedByCurrentUser
                                                        ? 'Unlike comment'
                                                        : 'Like comment'
                                                }
                                            >
                                                <span className={comment.likedByCurrentUser ? 'liked-heart' : ''}>
                                                    {comment.likedByCurrentUser ? '♥' : '♡'}
                                                </span>{' '}
                                                {comment.likesCount}
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
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