import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function PostCreate() {

    // Manage the post form fields and error message
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [error, setError] = useState('')

    const navigate = useNavigate()

    // Validate the form and create the post
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

        // Get the authentication token from local storage
        const token = localStorage.getItem('access_token')

        try {

            // Send the new post to the backend
            const response = await fetch('http://localhost:3000/posts', {
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

            // Return to the home page after successful creation
            navigate('/')

        } catch {
            setError('Failed to create post. Please try again.')
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
            </nav>

            <main className="post-create-page">
                <section className="post-create-container">
                    <h1>Create New Post</h1>
                    <p>Share your story with the community</p>

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


                        <div className="post-create-actions">
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                            >
                                Cancel
                            </button>

                            <button type="submit">
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