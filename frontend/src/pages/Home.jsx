function Home({ isLoggedIn, onLogin }) {
  return (
    <>
      {/* Navigation bar */}
      <nav className="navbar">
        <div className="logo">
          Multi User Blog
        </div>

        {!isLoggedIn && (
          <button
            className="login-button"
            onClick={onLogin}
          >
            Login
          </button>
        )}
      </nav>

      {/* Welcome section */}
      <main>
        <section className="welcome-section">
          <h1>Welcome to our blog</h1>
          <p>Discover stories from our community</p>
        </section>
      </main>
    </>
  )
}

export default Home