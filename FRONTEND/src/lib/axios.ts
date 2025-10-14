// axios.ts - Fixed version
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/",
  timeout: 10000,
  withCredentials: true, // Important for CSRF and session cookies
});

// Methods that require CSRF protection
const METHODS_REQUIRING_CSRF = ['post', 'put', 'patch', 'delete'];

// Store CSRF token promise to avoid multiple simultaneous requests
let csrfTokenRequest: Promise<void> | null = null;

// Helper: Extract CSRF token from cookies
function getCSRFToken(): string | null {
  const name = "csrftoken";
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${name}=`))
    ?.split('=')[1];
  return cookieValue || null;
}

// Ensure CSRF token is available
export const ensureCSRFToken = async (): Promise<void> => {
  // If we already have a token, return
  if (getCSRFToken()) {
    return;
  }

  // If a request is already in progress, wait for it
  if (csrfTokenRequest) {
    await csrfTokenRequest;
    return;
  }

  // Make new CSRF token request - FIXED ENDPOINT
  csrfTokenRequest = (async () => {
    try {
      await api.get("api/csrf/"); // CHANGED FROM "csrf/" TO "api/csrf/"
      console.log("CSRF token obtained successfully");
    } catch (error) {
      console.error("CSRF token fetch failed:", error);
      throw error;
    } finally {
      csrfTokenRequest = null;
    }
  })();

  await csrfTokenRequest;
};

// Request Interceptor
api.interceptors.request.use(
  async (config) => {
    // For mutating requests (POST, PUT, PATCH, DELETE), ensure CSRF token
    if (METHODS_REQUIRING_CSRF.includes(config.method?.toLowerCase() || '')) {
      try {
        await ensureCSRFToken();
      } catch (error) {
        console.warn('CSRF token unavailable, request may fail');
      }
    }

    // For FormData requests, let browser set Content-Type with boundary
    if (config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers['Content-Type'];
      }
    }

    // Always include CSRF token if available
    const csrfToken = getCSRFToken();
    if (csrfToken && !config.headers['X-CSRFToken']) {
      config.headers['X-CSRFToken'] = csrfToken;
    }

    console.log(`🔄 ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status);
    return response;
  },
  (error) => {
    if (axios.isCancel(error)) {
      console.log('Request cancelled:', error.message);
      return Promise.reject(error);
    }

    const { response } = error;
    const method = error.config?.method?.toUpperCase();
    const url = error.config?.url;

    if (!response) {
      console.error(`🌐 Network error for ${method} ${url}:`, error.message);
      return Promise.reject(new Error('Network error: Unable to connect to server'));
    }

    console.error(`❌ ${method} ${url} failed:`, response.status, response.data);

    // Handle specific status codes
    switch (response.status) {
      case 400:
        console.error('Bad Request:', response.data);
        break;
      case 401:
        console.error('Unauthorized - Please log in');
        break;
      case 403:
        console.error('Forbidden - CSRF token may be invalid');
        // Clear the potentially invalid CSRF token
        document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        break;
      case 404:
        console.error('Resource not found');
        break;
      case 500:
        console.error('Server error');
        break;
      default:
        console.error(`Unexpected error: ${response.status}`);
    }

    return Promise.reject(error);
  }
);

// Initialize CSRF token when the module loads
ensureCSRFToken().catch(console.warn);

export default api;