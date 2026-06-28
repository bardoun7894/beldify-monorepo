"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import {
	getSellerEarnings,
	SellerEarningsData,
	EarningsByDay,
	SellerOrderSummary,
	getSellerOrders,
} from "@/services/sellerDashboardService";
import {
	getOnboardingStatus,
	OnboardingStatusData,
} from "@/services/sellerOnboardingService";
import {
	TrendingUp,
	ShoppingBag,
	DollarSign,
	BarChart2,
	ArrowRight,
	CheckCircle,
	AlertCircle,
	XCircle,
	Clock,
	Plus,
	Package,
	MessageSquare,
	
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
// Table import removed — using inline HTML table for simpler responsive layout
import {
	orderStatusVariant,
	ORDER_STATUS_LABEL,
} from "@/constants/orderStatusColors";

const BCP47_MAP: Record<string, string> = {
	ar: "ar-MA",
	ma: "ar-MA",
	fr: "fr-FR",
};

function fmtMAD(n: number, lang?: string) {
	const locale = BCP47_MAP[lang ?? ""] ?? "fr-MA";
	return n.toLocaleString(locale, { minimumFractionDigits: 0 });
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
	return (
		<Badge variant={orderStatusVariant(status)}>
			{ORDER_STATUS_LABEL[status] ?? status}
		</Badge>
	);
}

// ── Quick action button ───────────────────────────────────────────────────────
function QuickAction({
	label,
	href,
	icon: Icon,
	accent,
}: {
	label: string;
	href: string;
	icon: React.ElementType;
	accent: string;
}) {
	return (
		<Link
			href={href}
			className="inline-flex flex-col items-center gap-2 min-w-[80px] snap-center py-3 px-4 bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm hover:shadow-md transition-all active:scale-95 active:duration-75"
		>
			<div
				className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}
			>
				<Icon className="w-5 h-5" aria-hidden="true" />
			</div>
			<span className="text-[11px] font-medium text-gray-700 text-center leading-tight">
				{label}
			</span>
		</Link>
	);
}

// ── Mobile order card (replaces table rows on small screens) ─────────────────
function OrderCard({ order }: { order: SellerOrderSummary }) {
	return (
		<Link
			href={`/seller/orders/${order.id}`}
			className="block bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-4 hover:shadow-md transition-all active:scale-[0.98] active:duration-75"
		>
			<div className="flex items-start justify-between gap-2 mb-2.5">
				<span className="font-semibold text-indigo-700 text-sm leading-tight">
					{order.order_number}
				</span>
				<StatusBadge status={order.status} />
			</div>
			<div className="flex items-center justify-between gap-2">
				<span className="text-xs text-gray-500 truncate min-w-0">
					{order.customer_name}
				</span>
				<span className="font-semibold text-gray-900 text-sm tabular-nums shrink-0">
					<span className="currency-mad">{fmtMAD(order.total_amount)} DH</span>
				</span>
			</div>
		</Link>
	);
}

// ── Sales trend mini-chart (from by_day data) ─────────────────────────────────
function SalesTrendMini({
	byDay,
}: {
	byDay: EarningsByDay[];
}) {
	const { t } = useTranslation();
	const maxRevenue = Math.max(...byDay.map((d) => d.revenue), 1);
	const recentDays = byDay.slice(-7);

	return (
		<div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-4">
			<div className="flex items-center justify-between mb-3">
				<h3 className="text-xs font-semibold text-gray-900">
					{t(
						"seller.dashboard.sales_trend",
						"Sales trend (last {{n}} days)",
						{ n: recentDays.length },
					)}
				</h3>
				<span className="text-[10px] text-gray-400">
					{fmtMAD(maxRevenue)} DH
				</span>
			</div>
			<div className="flex items-end gap-1.5 h-16">
				{recentDays.map((day, i) => {
					const pct = (day.revenue / maxRevenue) * 100;
					return (
						<div
							key={day.date ?? i}
							className="flex-1 flex flex-col items-center gap-1"
						>
							<div
								className="w-full rounded-md bg-gradient-to-t from-indigo-600/80 to-indigo-400/60 transition-all duration-300"
								style={{ height: `${Math.max(pct, 4)}%` }}
								aria-label={`${day.revenue} DH`}
							/>
						</div>
					);
				})}
			</div>
			<div className="flex items-center justify-between mt-2">
				<span className="text-[10px] text-gray-400">
					{recentDays[0]?.date?.slice(5) ?? ""}
				</span>
				<span className="text-[10px] text-gray-400">
					{recentDays[recentDays.length - 1]?.date?.slice(5) ?? ""}
				</span>
			</div>
		</div>
	);
}

// ── Today's snapshot ──────────────────────────────────────────────────────────
function TodaySnapshot({
	earnings,
}: {
	earnings: SellerEarningsData;
}) {
	const { t } = useTranslation();
	// Derive today's revenue from by_day if available
	const today = earnings.by_day?.length
		? earnings.by_day[earnings.by_day.length - 1]
		: null;

	if (!today || today.revenue <= 0) return null;

	return (
		<div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-indigo-100/50 rounded-2xl px-4 py-3 ring-1 ring-indigo-200">
			<div className="flex items-center gap-3">
				<div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
					<TrendingUp className="w-4 h-4 text-indigo-700" aria-hidden="true" />
				</div>
				<div>
					<p className="text-[11px] text-indigo-600 font-medium">
						{t("seller.dashboard.today", "Today")}
					</p>
					<p className="text-sm font-bold text-indigo-900 tabular-nums">
						{fmtMAD(today.revenue)} DH
					</p>
				</div>
			</div>
			<span className="text-[10px] text-indigo-500">
				{t("seller.dashboard.today_label", "Revenue")}
			</span>
		</div>
	);
}

// ── Onboarding banner ─────────────────────────────────────────────────────────
function OnboardingBanner({ status }: { status: OnboardingStatusData }) {
	const { t } = useTranslation();

	if (status.store_status === "suspended") {
		return (
			<div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-sm">
				<XCircle
					className="w-4 h-4 text-rose-600 shrink-0"
					aria-hidden="true"
				/>
				<span className="text-rose-800 font-medium">
					{t(
						"seller.onboarding_banner.suspended",
						"Store suspended — contact support",
					)}
				</span>
			</div>
		);
	}

	if (
		status.store_status === "active" &&
		(status.overall_percentage ?? 100) >= 100
	) {
		return (
			<div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 ring-1 ring-emerald-200 text-sm">
				<CheckCircle
					className="w-4 h-4 text-emerald-600 shrink-0"
					aria-hidden="true"
				/>
				<span className="text-emerald-800 font-medium">
					{t("seller.onboarding_banner.active", "Store active and live")}
				</span>
				<Link
					href="/seller/onboarding"
					className="ms-auto text-xs text-emerald-600 hover:underline shrink-0"
				>
					{t("seller.onboarding_banner.view_journey", "View journey")}
				</Link>
			</div>
		);
	}

	const pct = status.overall_percentage ?? 0;
	const isPending = status.store_status === "pending";

	return (
		<div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 ring-1 ring-amber-200 text-sm">
			<AlertCircle
				className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
				aria-hidden="true"
			/>
			<div className="flex-1 min-w-0">
				<p className="text-amber-800 font-medium">
					{isPending
						? t("seller.onboarding_banner.pending", "Application under review")
						: t(
								"seller.onboarding_banner.progress",
								"Complete your store setup — {{pct}}% done",
								{ pct },
							)}
				</p>
				{!isPending && (
					<p className="text-amber-700 text-xs mt-0.5">
						{t(
							"seller.onboarding_banner.finish_hint",
							"Finish your profile to unlock all features and start selling.",
						)}
					</p>
				)}
			</div>
			<Link
				href="/seller/onboarding"
				className="shrink-0 text-xs font-medium text-amber-700 hover:text-amber-900 hover:underline"
			>
				{isPending
					? t("seller.onboarding_banner.track_progress", "Track progress")
					: t("seller.onboarding_banner.complete_setup", "Complete setup")}
			</Link>
		</div>
	);
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({
	label,
	value,
	sub,
	icon: Icon,
	accent,
}: {
	label: string;
	value: string | number;
	sub?: string;
	icon: React.ElementType;
	accent: string;
}) {
	return (
		<div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-4 flex flex-col gap-2.5 active:scale-[0.97] active:duration-75 transition-all">
			<div
				className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent}`}
			>
				<Icon className="w-4 h-4" aria-hidden="true" />
			</div>
			<div>
				<p className="text-[10px] text-gray-400 uppercase tracking-wide">
					{label}
				</p>
				<p className="text-xl font-bold text-gray-900 mt-[1px]">{value}</p>
				{sub && <p className="text-[10px] text-gray-400 mt-[1px]">{sub}</p>}
			</div>
		</div>
	);
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
	return (
		<div
			className={`animate-pulse bg-gray-100 rounded-xl ${className ?? ""}`}
		/>
	);
}

export default function SellerDashboardPage() {
	const { t } = useTranslation();
	const { isAuthenticated } = useAuth();

	const [earnings, setEarnings] = useState<SellerEarningsData | null>(null);
	const [earningsLoading, setEarningsLoading] = useState(true);

	const [orders, setOrders] = useState<SellerOrderSummary[]>([]);
	const [ordersLoading, setOrdersLoading] = useState(true);

	const [onboarding, setOnboarding] = useState<OnboardingStatusData | null>(
		null,
	);

	useEffect(() => {
		if (!isAuthenticated) return;

		getSellerEarnings(30)
			.then((res) => setEarnings(res.data))
			.catch(() => {})
			.finally(() => setEarningsLoading(false));

		getSellerOrders({ page: 1 })
			.then((res) => setOrders(res.data.slice(0, 5)))
			.catch(() => {})
			.finally(() => setOrdersLoading(false));

		getOnboardingStatus()
			.then((res) => setOnboarding(res.data))
			.catch(() => {});
	}, [isAuthenticated]);

	const hasByDayData =
		earnings?.by_day && earnings.by_day.length > 1;

	return (
		<div className="space-y-5 sm:space-y-6">
			{/* Page title */}
			<div>
				<p className="text-xs uppercase tracking-[0.18em] text-amber-600 font-medium mb-1">
					{t("seller.dashboard.eyebrow", "Seller Hub")}
				</p>
				<h1 className="text-xl font-bold text-gray-900 font-heading">
					{t("seller.dashboard.title", "Dashboard")}
				</h1>
			</div>

			{/* Quick actions — horizontal scroll on mobile, grid on desktop */}
			<div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-none md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
				<QuickAction
					label={t("seller.dashboard.quick_add_product", "Add Product")}
					href="/seller/products/new"
					icon={Plus}
					accent="bg-indigo-100 text-indigo-700"
				/>
				<QuickAction
					label={t("seller.dashboard.quick_orders", "Orders")}
					href="/seller/orders"
					icon={ShoppingBag}
					accent="bg-amber-100 text-amber-700"
				/>
				<QuickAction
					label={t("seller.dashboard.quick_messages", "Messages")}
					href="/seller/messages"
					icon={MessageSquare}
					accent="bg-emerald-100 text-emerald-700"
				/>
				<QuickAction
					label={t("seller.dashboard.quick_products", "Products")}
					href="/seller/products"
					icon={Package}
					accent="bg-rose-100 text-rose-700"
				/>
			</div>

			{/* Onboarding banner */}
			{onboarding && <OnboardingBanner status={onboarding} />}

			{/* Today's snapshot */}
			{earnings && !earningsLoading && <TodaySnapshot earnings={earnings} />}

			{/* KPI grid */}
			{earningsLoading ? (
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} className="h-24" />
					))}
				</div>
			) : earnings ? (
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					<KpiCard
						label={t("seller.dashboard.kpi_gross", "Gross Revenue")}
						value={`${fmtMAD(earnings.gross_revenue)} DH`}
						sub={t("seller.dashboard.kpi_gross_sub", "Last {{period}} days", {
							period: earnings.period,
						})}
						icon={TrendingUp}
						accent="bg-amber-100 text-amber-700"
					/>
					<KpiCard
						label={t("seller.dashboard.kpi_net", "Net Revenue")}
						value={`${fmtMAD(earnings.net_revenue)} DH`}
						sub={t(
							"seller.dashboard.kpi_net_sub",
							"After {{commission}} DH commission",
							{ commission: earnings.total_commission },
						)}
						icon={DollarSign}
						accent="bg-emerald-100 text-emerald-700"
					/>
					<KpiCard
						label={t("seller.dashboard.kpi_orders", "Orders")}
						value={earnings.orders_count}
						sub={t("seller.dashboard.kpi_orders_sub", "Avg {{avg}} DH", {
							avg: fmtMAD(earnings.average_order_value),
						})}
						icon={ShoppingBag}
						accent="bg-indigo-100 text-indigo-700"
					/>
					<KpiCard
						label={t("seller.dashboard.kpi_commission", "Commission")}
						value={`${fmtMAD(earnings.total_commission)} DH`}
						sub={t("seller.dashboard.kpi_commission_sub", "{{rate}}% rate", {
							rate: Math.round(
								(earnings.total_commission / (earnings.gross_revenue || 1)) *
									100,
							),
						})}
						icon={BarChart2}
						accent="bg-rose-100 text-rose-700"
					/>
				</div>
			) : (
				<div className="p-4 rounded-xl bg-amber-50 ring-1 ring-amber-200 text-sm text-amber-700">
					{t(
						"seller.dashboard.earnings_error",
						"Could not load earnings data.",
					)}
				</div>
			)}

			{/* Sales trend mini-chart */}
			{hasByDayData && earnings && (
				<SalesTrendMini byDay={earnings.by_day} />
			)}

			{/* Recent orders */}
			<div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm">
				<div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
					<h2 className="text-sm font-semibold text-gray-900">
						{t("seller.dashboard.recent_orders", "Recent Orders")}
					</h2>
					<Link
						href="/seller/orders"
						className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 hover:text-indigo-900"
					>
						{t("seller.dashboard.view_all_orders", "View all orders")}
						<ArrowRight className="w-3 h-3" aria-hidden="true" />
					</Link>
				</div>

				{ordersLoading ? (
					<div
						className="p-4 space-y-3"
						role="status"
						aria-live="polite"
						aria-label={t(
							"seller.dashboard.loading_orders",
							"Loading recent orders",
						)}
					>
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-10" />
						))}
					</div>
				) : orders.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-center px-6 gap-3">
						<Clock className="w-8 h-8 text-amber-300" aria-hidden="true" />
						<p className="text-sm text-gray-500">
							{t(
								"seller.dashboard.no_orders",
								"No orders yet — share your store to get started!",
							)}
						</p>
						<Link
							href="/seller/products/new"
							className="inline-flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-full px-5 py-2 text-xs font-semibold transition-colors mt-1"
						>
							<Plus className="w-3.5 h-3.5" aria-hidden="true" />
							{t(
								"seller.dashboard.add_first_product_cta",
								"Add your first product",
							)}
						</Link>
					</div>
				) : (
					<div>
						<div className="block md:hidden p-4 space-y-3">
							{orders.map((order) => (
								<OrderCard key={order.id} order={order} />
							))}
						</div>
						<div className="hidden md:block overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-gray-100 bg-gray-50">
										<th className="px-5 py-3 font-medium text-xs uppercase tracking-wide text-gray-400 text-start">
											{t("seller.orders.col_number", "Order")}
										</th>
										<th className="px-5 py-3 font-medium text-xs uppercase tracking-wide text-gray-400 text-start">
											{t("seller.orders.col_customer", "Customer")}
										</th>
										<th className="px-5 py-3 font-medium text-xs uppercase tracking-wide text-gray-400 text-start">
											{t("seller.orders.col_status", "Status")}
										</th>
										<th className="px-5 py-3 font-medium text-xs uppercase tracking-wide text-gray-400 text-end tabular-nums">
											{t("seller.orders.col_total", "Total")}
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-100">
									{orders.map((order) => (
										<tr key={order.id} className="hover:bg-gray-50 transition-colors">
											<td className="px-5 py-3 text-start">
												<Link
													href={`/seller/orders/${order.id}`}
													className="font-medium text-indigo-700 hover:underline"
												>
													{order.order_number}
												</Link>
											</td>
											<td className="px-5 py-3 text-start text-gray-700">
												{order.customer_name}
											</td>
											<td className="px-5 py-3 text-start">
												<StatusBadge status={order.status} />
											</td>
											<td className="px-5 py-3 text-end tabular-nums font-medium text-gray-900">
												<span className="currency-mad">
													{fmtMAD(order.total_amount)} DH
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
