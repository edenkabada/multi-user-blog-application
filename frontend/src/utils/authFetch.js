// Wraps the native fetch, automatically attaching the stored JWT as an
// Authorization header when one exists. Safe to use for both protected
// and public endpoints — if there's no token, this behaves like a plain
// fetch.
export function authFetch(url, options = {}) {
  const token = localStorage.getItem('access_token')

  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  return fetch(url, { ...options, headers })
}
