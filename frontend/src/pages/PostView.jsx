import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './PostView.css'

function PostView() {

    const [post, setPost] = useState(null)
    const [isLoggedIn, setIsLoggedIn] = useState(
        !!localStorage.getItem('access_token')
    )
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

    // Check if the logged-in user owns the post
    const currentUserId = getCurrentUserId()
    
    const isPostOwner =
        isLoggedIn && Number(post?.userId) === Number(currentUserId)

    const handleCreatePostClick = () => {
        if (isLoggedIn) {
            navigate('/posts/new')
        } else {
            navigate('/login')
        }
    }

    useEffect(() => {
        fetch(`http://localhost:3000/posts/${postId}`)
            .then((response) => response.json())
            .then((data) => setPost(data))
    }, [postId])

    if (!post) {
        return <p>Loading...</p>
    }

    return (
        <>
            {/* Navigation bar */}
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

                    <div className="post-view-actions">
                        <button
                            className="back-home-button"
                            onClick={() => navigate('/')}
                        >
                            ← Back to Home
                        </button>

                        {isPostOwner && (
                            <button
                                className="edit-post-button"
                                onClick={() => navigate(`/posts/${post.postId}/edit`)}
                            >
                                Edit
                            </button>
                        )}
                    </div>
                </article>
            </main>
        </>

    )
}

export default PostView