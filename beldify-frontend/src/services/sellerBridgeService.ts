import api from "@/lib/api";
import logger from "@/utils/consoleLogger";
import toast from "@/utils/toast";

interface HandoffResponse {
	ticket: string;
	enter_url: string;
}

/**
 * Hand the authenticated seller off to the Laravel Blade seller dashboard.
 *
 * The buyer frontend authenticates with a Bearer token in localStorage, which
 * a top-level browser navigation cannot carry. So the handoff is two steps:
 *   1. POST /api/seller/handoff (Bearer) -> { enter_url } carrying a 60s
 *      single-use ticket.
 *   2. Full-page navigate to enter_url; Laravel redeems the ticket, opens a
 *      stateful web session, and lands the seller on their dashboard.
 *
 * See SellerSsoBridgeController (backend) for the matching endpoints.
 */
export async function enterSellerDashboard(): Promise<void> {
	try {
		const { data } = await api.post<HandoffResponse>("/api/seller/handoff");
		if (data?.enter_url) {
			window.location.href = data.enter_url;
			return;
		}
		throw new Error("handoff response missing enter_url");
	} catch (err) {
		logger.error("[sellerBridge] dashboard handoff failed", err);
		toast.error("Could not open the seller dashboard. Please try again.");
	}
}
