import axios, { AxiosError } from "axios";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Create axios instance
const instance = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json",
		"X-Requested-With": "XMLHttpRequest",
	},
	withCredentials: true,
});

// Add a request interceptor
instance.interceptors.request.use(
	async (config) => {
		// Get token from localStorage (browser only — this instance is sometimes
		// imported by Next server route handlers where localStorage is undefined).
		if (typeof window !== "undefined") {
			const token = localStorage.getItem("token");
			if (token) {
				config.headers.Authorization = `Bearer ${token}`;
			}
		}

		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

// Add a response interceptor
instance.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		// Handle 401 Unauthorized errors
		if (error.response?.status === 401) {
			// Only redirect a genuinely-expired session; never bounce guests (no token)
			// who hit 401 on auth-only endpoints from public pages.
			const hadToken =
				typeof window !== "undefined" && !!localStorage.getItem("token");
			localStorage.removeItem("token");
			if (
				hadToken &&
				typeof window !== "undefined" &&
				window.location.pathname !== "/login"
			) {
				window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
			}
		}
		return Promise.reject(error);
	},
);

export default instance;
