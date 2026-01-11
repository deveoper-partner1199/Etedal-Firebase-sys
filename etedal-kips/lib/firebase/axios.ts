import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Helper to get token from cookies (via API)
// Note: Since token is in HTTP-only cookie, we can't access it directly from client
// This will be handled server-side in API routes
async function getToken(): Promise<string | null> {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const response = await fetch('/api/auth/user', {
            method: 'GET',
            credentials: 'include',
        });

        if (response.ok) {
            const data = await response.json();
            return data.encryptedToken || null;
        }
    } catch (error) {
        console.error('Error getting token:', error);
    }

    return null;
}

// --- Public axios instance (no auth) ---
export const publicAxios: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '', // e.g. "https://api.etedal.com/"
    headers: {
        'Content-Type': 'application/json',
    },
});

// No auth interceptors needed for public

// --- Private axios instance (browser, attaches token from localStorage) ---
export const privateAxios: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add Authorization header
// Note: For HTTP-only cookies, the token is automatically sent with requests
// This interceptor is kept for compatibility but may not be needed if using cookies
privateAxios.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        // Token is in HTTP-only cookie, so it's automatically included in requests
        // If you need to add it as a header, you can fetch it here
        // For now, we'll rely on cookies being sent automatically
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

// Optional: response interceptor to catch 401 errors
privateAxios.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        if (error.response && error.response.status === 401) {
            // Optionally clear localStorage, redirect to login, etc.
        }
        return Promise.reject(error);
    }
);

// --- Internal axios instance (for /api directory, server-side) ---
export const internalAxios: AxiosInstance = axios.create({
    // No baseURL, since /api routes generally use absolute or relative URLs on the server
    headers: {
        'Content-Type': 'application/json',
    },
});

// In /api routes, you can manually attach tokens from cookies/session if needed, e.g.:
// req.headers.authorization = `Bearer ${token}`
// You may write separate interceptors in the API handler files if necessary.
