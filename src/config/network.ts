// Rider App – API Configuration

const LOCAL_BACKEND_HOST = '10.0.0.206';
const LOCAL_BACKEND_PORT = 8080;

// Backend API domain
const BACKEND_URL =
	process.env.EXPO_PUBLIC_BACKEND_URL ||
	(__DEV__
		? `http://${LOCAL_BACKEND_HOST}:${LOCAL_BACKEND_PORT}`
		: 'https://api.rydinex.com');

// Optional: Admin panel domain (for future use)
export const ADMIN_PANEL_URL = 'https://admin.rydinex.com';

// Export main backend URL
export { BACKEND_URL };

// API base URL for all REST endpoints
export const API_BASE_URL = `${BACKEND_URL}/api`;

// Socket server URL (same as backend)
export const SOCKET_URL = BACKEND_URL;