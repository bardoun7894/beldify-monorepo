import api from "@/lib/api";
import logger from "@/utils/consoleLogger";

export interface StoreRequestPayload {
	store_name?: string;
	store_type_id: number;
	business_type: string;
	country: string;
	contact_email?: string;
	contact_phone?: string;
	description?: string;
	address?: string;
	city?: string;
	state?: string;
	logo?: File;
}

export interface SellerRegisterPayload extends StoreRequestPayload {
	full_name_en: string;
	phone: string;
	email?: string;
	password: string;
	password_confirmation: string;
}

export interface StoreRequestResponse {
	success: boolean;
	message?: string;
	data?: {
		id?: number;
		status?: string;
		store_name?: string;
	};
}

export interface SellerRegisterResponse {
	success: boolean;
	message?: string;
	data?: {
		user?: {
			id: number;
			name?: string;
			email?: string;
			phone?: string;
			avatar_url?: string | null;
			role?: string;
			is_seller?: boolean;
		};
		store?: {
			id: number;
			name: string;
			status: string;
		};
		token?: string;
	};
}

/**
 * Submit a seller / store-request onboarding application.
 *
 * The backend route is POST /api/seller/register (Sanctum-protected).
 * It validates: store_type_id, business_type, country (required);
 * description, address, city, state, contact_email, contact_phone (optional).
 *
 * NOTE: The existing Blade web route (POST /store-request/store) requires a
 * browser session (web guard + CSRF). This service targets the API variant
 * which the backend team is exposing for the Next.js frontend.
 */
export async function submitStoreRequest(
	payload: StoreRequestPayload,
): Promise<StoreRequestResponse> {
	try {
		logger.log("Submitting store request:", {
			business_type: payload.business_type,
			country: payload.country,
		});

		// Use FormData to support optional logo upload
		const formData = new FormData();
		if (payload.store_name) formData.append("store_name", payload.store_name);
		formData.append("store_type_id", String(payload.store_type_id));
		formData.append("business_type", payload.business_type);
		formData.append("country", payload.country);

		if (payload.contact_email)
			formData.append("contact_email", payload.contact_email);
		if (payload.contact_phone)
			formData.append("contact_phone", payload.contact_phone);
		if (payload.description)
			formData.append("description", payload.description);
		if (payload.address) formData.append("address", payload.address);
		if (payload.city) formData.append("city", payload.city);
		if (payload.state) formData.append("state", payload.state);
		if (payload.logo) formData.append("logo", payload.logo);

		const response = await api.post("/api/seller/register", formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});

		const isSuccess =
			response.data?.success === true ||
			response.data?.status === "success" ||
			response.status === 200 ||
			response.status === 201;

		return {
			success: isSuccess,
			message: response.data?.message,
			data: response.data?.data || response.data,
		};
	} catch (error: any) {
		logger.error("Store request submission error:", {
			status: error.response?.status,
			data: error.response?.data,
			message: error.message,
		});

		if (error.response?.status === 422) {
			const firstError = Object.values(error.response.data?.errors || {})?.[0];
			const msg = Array.isArray(firstError)
				? firstError[0]
				: error.response.data?.message;
			return { success: false, message: msg || "Validation failed" };
		}

		return {
			success: false,
			message:
				error.response?.data?.message ||
				error.message ||
				"Failed to submit store request",
		};
	}
}

/**
 * Public seller registration.
 *
 * Creates a new user account and a pending store request in one call.
 * Backend route: POST /api/auth/register-seller
 */
export async function registerSeller(
	payload: SellerRegisterPayload,
): Promise<SellerRegisterResponse> {
	try {
		logger.log("Submitting public seller registration:", {
			store_name: payload.store_name,
			business_type: payload.business_type,
			country: payload.country,
		});

		const formData = new FormData();
		formData.append("full_name_en", payload.full_name_en);
		formData.append("phone", payload.phone);
		if (payload.email) formData.append("email", payload.email);
		formData.append("password", payload.password);
		formData.append("password_confirmation", payload.password_confirmation);

		if (payload.store_name) formData.append("store_name", payload.store_name);
		formData.append("store_type_id", String(payload.store_type_id));
		formData.append("business_type", payload.business_type);
		formData.append("country", payload.country);

		if (payload.contact_email)
			formData.append("contact_email", payload.contact_email);
		if (payload.contact_phone)
			formData.append("contact_phone", payload.contact_phone);
		if (payload.description)
			formData.append("description", payload.description);
		if (payload.address) formData.append("address", payload.address);
		if (payload.city) formData.append("city", payload.city);
		if (payload.state) formData.append("state", payload.state);
		if (payload.logo) formData.append("logo", payload.logo);

		const response = await api.post("/api/auth/register-seller", formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});

		const isSuccess =
			response.data?.success === true ||
			response.data?.status === "success" ||
			response.status === 200 ||
			response.status === 201;

		const authPayload = response.data?.data ?? response.data;
		const token = authPayload?.token;
		const user = authPayload?.user;

		if (token && typeof window !== "undefined") {
			localStorage.setItem("token", token);
			localStorage.setItem("token_timestamp", new Date().getTime().toString());
			api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
		}

		return {
			success: isSuccess,
			message: response.data?.message,
			data: { user, store: authPayload?.store, token },
		};
	} catch (error: any) {
		logger.error("Public seller registration error:", {
			status: error.response?.status,
			data: error.response?.data,
			message: error.message,
		});

		if (error.response?.status === 422) {
			const firstError = Object.values(error.response.data?.errors || {})?.[0];
			const msg = Array.isArray(firstError)
				? firstError[0]
				: error.response.data?.message;
			return { success: false, message: msg || "Validation failed" };
		}

		return {
			success: false,
			message:
				error.response?.data?.message ||
				error.message ||
				"Seller registration failed",
		};
	}
}
