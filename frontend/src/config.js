// Backend API base URL. Set VITE_API_BASE_URL in a .env file (local dev)
// or as a Cloudflare Pages build environment variable (production) to
// point at the deployed backend without hardcoding it anywhere else in
// the app. Falls back to localhost so existing local dev setups keep
// working unchanged if the variable isn't set.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
