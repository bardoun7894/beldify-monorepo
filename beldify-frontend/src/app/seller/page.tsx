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

// ── Animated counter ──────────────────────────────────────────────────────────
// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
	return (
		<Badge variant={orderStatusVariant(status)}>
			{ORDER_STATUS_LABEL[status] ?? status}
		</Badge>
	);
}

// ── Status accent colour map ──────────────────────────────────────────────────
const STATUS_ACCENT: Record<string, string> = {
	pending: "border-l-amber-400",
	processing: "border-l-indigo-400",
	shipped: "border-l-sky-400",
	delivered: "border-l-emerald-400",
	cancelled: "border-l-rose-400",
	refunded: "border-l-gray-400",
};

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
			className="inline-flex flex-col items-center gap-2 min-w-[88px] snap-center py-3 px-4 bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-95 active:duration-75"
		>
			<div
				className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent} ring-1 ring-white/20`}
			>
				<Icon className="w-5 h-5" aria-hidden="true" />
			</div>
			<span className="text-[11px] font-medium text-gray-700 text-center leading-tight">
				{label}
			</span>
		</Link>
	);
}

// ── Mobile order card — status-accented left border ───────────────────────────
function OrderCard({ order }: { order: SellerOrderSummary }) {
	const accentClass = STATUS_ACCENT[order.status] ?? "border-l-gray-200";
	return (
		<Link
			href={`/seller/orders/${order.id}`}
			className={`block bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-4 border-l-[3px] ${accentClass} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] active:duration-75`}
		>
			<div className="flex items-start justify-between gap-2 mb-2.5">
				<span className="font-semibold text-indigo-700 text-sm leading-tight">
					{order.order_number}
				</span>
				<StatusBadge status={order.status} />
			</div>
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 min-w-0">
					<div className="w-6 h-6 rounded-full bg-gray-100 ring-1 ring-gray-200 flex items-center justify-center shrink-0">
						<span className="text-[9px] font-semibold text-gray-500 uppercase">
							{order.customer_name?.charAt(0) ?? "?"}
						</span>
					</div>
					<span className="text-xs text-gray-500 truncate">
						{order.customer_name}
					</span>
				</div>
				<span className="font-semibold text-gray-900 text-sm tabular-nums shrink-0">
					<span className="currency-mad">{fmtMAD(order.total_amount)} DH</span>
				</span>
			</div>
		</Link>
	);
}

// ── Desktop table row — same accent pattern via left border ───────────────────
function DesktopRow({ order }: { order: SellerOrderSummary }) {
	const accentClass = STATUS_ACCENT[order.status] ?? "border-l-gray-200";
	return (
		<tr className="hover:bg-gray-50 transition-colors">
			<td className={`px-5 py-3.5 text-start border-l-[3px] ${accentClass} transition-colors`}>
				<Link
					href={`/seller/orders/${order.id}`}
					className="font-medium text-indigo-700 hover:underline"
				>
					{order.order_number}
				</Link>
			</td>
			<td className="px-5 py-3.5 text-start text-gray-700">
				<div className="flex items-center gap-2">
					<div className="w-6 h-6 rounded-full bg-gray-100 ring-1 ring-gray-200 flex items-center justify-center shrink-0">
						<span className="text-[9px] font-semibold text-gray-500 uppercase">
							{order.customer_name?.charAt(0) ?? "?"}
						</span>
					</div>
					<span>{order.customer_name}</span>
				</div>
			</td>
			<td className="px-5 py-3.5 text-start">
				<StatusBadge status={order.status} />
			</td>
			<td className="px-5 py-3.5 text-end tabular-nums font-medium text-gray-900">
				<span className="currency-mad">{fmtMAD(order.total_amount)} DH</span>
			</td>
		</tr>
	);
}

// ── Sales trend mini-chart ────────────────────────────────────────────────────
function SalesTrendMini({ byDay }: { byDay: EarningsByDay[] }) {
	const { t } = useTranslation();
	const maxRevenue = Math.max(...byDay.map((d) => d.revenue), 1);
	const recentDays = byDay.slice(-7);
	return (
		<div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-5">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-xs font-semibold text-gray-900 flex items-center gap-2">
					<span className="w-2 h-2 rounded-full bg-indigo-500" />
					{t("seller.dashboard.sales_trend", "Sales trend (last {{n}} days)", {
						n: recentDays.length,
					})}
				</h3>
				<span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full ring-1 ring-gray-200">
					{fmtMAD(maxRevenue)} DH max
				</span>
			</div>
			<div className="flex items-end gap-2 h-20">
				{recentDays.map((day, i) => {
					const pct = (day.revenue / maxRevenue) * 100;
					return (
						<div
							key={day.date ?? i}
							className="flex-1 flex flex-col items-center gap-1.5 group"
							style={{ animationDelay: `${i * 60}ms` }}
						>
							<div
								className="w-full rounded-lg bg-gradient-to-t from-indigo-600 via-indigo-500 to-indigo-400 transition-all duration-500 ease-out group-hover:from-indigo-700 group-hover:via-indigo-600 group-hover:to-indigo-500"
								style={{
									height: `${Math.max(pct, 6)}%`,
									animation: "barGrow 400ms ease-out both",
									animationDelay: `${i * 60}ms`,
								}}
								aria-label={`${day.revenue} DH`}
							/>
							<span className="text-[8px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
								{fmtMAD(day.revenue)}
							</span>
						</div>
					);
				})}
			</div>
			<div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
				<span className="text-[10px] text-gray-400 font-medium">
					{recentDays[0]?.date?.slice(5) ?? ""}
				</span>
				<div className="w-1 h-1 rounded-full bg-gray-300" />
				<span className="text-[10px] text-gray-400 font-medium">
					{recentDays[recentDays.length - 1]?.date?.slice(5) ?? ""}
				</span>
			</div>
		</div>
	);
}

// ── Today's snapshot ──────────────────────────────────────────────────────────
function TodaySnapshot({ earnings }: { earnings: SellerEarningsData }) {
	const { t } = useTranslation();
	const today = earnings.by_day?.length
		? earnings.by_day[earnings.by_day.length - 1]
		: null;

	if (!today || today.revenue <= 0) return null;

	return (
		<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-900 px-5 py-4 shadow-lg">
			<div
				className="absolute inset-0 opacity-[0.08] pointer-events-none"
				style={{
					backgroundImage:
						"radial-gradient(circle at 20% 30%, #f59e0b 0%, transparent 40%), radial-gradient(circle at 80% 70%, #818cf8 0%, transparent 40%)",
				}}
			/>
			<div className="relative flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-xl bg-white/15 ring-1 ring-white/20 flex items-center justify-center backdrop-blur-sm">
						<TrendingUp className="w-5 h-5 text-amber-300" aria-hidden="true" />
					</div>
					<div>
						<p className="text-[11px] text-indigo-200 font-medium tracking-wide uppercase">
							{t("seller.dashboard.today", "Today's Revenue")}
						</p>
						<p className="text-xl font-bold text-white tabular-nums mt-0.5">
							{fmtMAD(today.revenue)}
							<span className="text-indigo-200 text-sm font-normal ms-1">
								DH
							</span>
						</p>
					</div>
				</div>
				<div className="text-right">
					<span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-400/15 rounded-full px-2 py-0.5 ring-1 ring-emerald-400/20">
						<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
						Live
					</span>
				</div>
			</div>
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

	const fullActive =
		status.store_status === "active" &&
		(status.overall_percentage ?? 100) >= 100;

	if (fullActive) {
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
		<div className="rounded-xl bg-gradient-to-r from-amber-50 via-amber-50/80 to-amber-50 ring-1 ring-amber-200 overflow-hidden">
			<div className="flex items-start gap-3 p-4 text-sm">
				<AlertCircle
					className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
					aria-hidden="true"
				/>
				<div className="flex-1 min-w-0">
					<p className="text-amber-800 font-medium">
						{isPending
							? t(
									"seller.onboarding_banner.pending",
									"Application under review",
								)
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
						? t(
								"seller.onboarding_banner.track_progress",
								"Track progress",
							)
						: t(
								"seller.onboarding_banner.complete_setup",
								"Complete setup",
							)}
				</Link>
			</div>
			{!isPending && (
				<div className="h-1 bg-amber-200/50">
					<div
						className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-r-full transition-all duration-700 ease-out"
						style={{ width: `${Math.min(pct, 100)}%` }}
					/>
				</div>
			)}
		</div>
	);
}

// ── KPI card ──────────────────────────────────────────────────────────────────
const KPI_VARIANTS: Record<
	string,
	{ gradient: string; iconBg: string; iconColor: string }
> = {
	gross: {
		gradient: "from-amber-50 via-amber-50/50 to-white",
		iconBg: "bg-amber-100",
		iconColor: "text-amber-700",
	},
	net: {
		gradient: "from-emerald-50 via-emerald-50/50 to-white",
		iconBg: "bg-emerald-100",
		iconColor: "text-emerald-700",
	},
	orders: {
		gradient: "from-indigo-50 via-indigo-50/50 to-white",
		iconBg: "bg-indigo-100",
		iconColor: "text-indigo-700",
	},
	commission: {
		gradient: "from-rose-50 via-rose-50/50 to-white",
		iconBg: "bg-rose-100",
		iconColor: "text-rose-700",
	},
};

function KpiCard({
	label,
	value,
	sub,
	icon: Icon,
	variant = "gross",
}: {
	label: string;
	value: string | number;
	sub?: string;
	icon: React.ElementType;
	variant?: string;
}) {
	const v = KPI_VARIANTS[variant] ?? KPI_VARIANTS.gross;
	return (
		<div
			className={`bg-gradient-to-br ${v.gradient} rounded-2xl ring-1 ring-gray-200 shadow-sm p-4 flex flex-col gap-2.5 active:scale-[0.97] active:duration-75 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
		>
			<div
				className={`w-8 h-8 rounded-xl flex items-center justify-center ${v.iconBg} ring-1 ring-white/50`}
			>
				<Icon className={`w-4 h-4 ${v.iconColor}`} aria-hidden="true" />
			</div>
			<div>
				<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
					{label}
				</p>
				<p className="text-xl font-bold text-gray-900 mt-[1px]">{value}</p>
				{sub && <p className="text-[10px] text-gray-400 mt-[1px]">{sub}</p>}
			</div>
		</div>
	);
}

// ── Skeleton shimmer ──────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
	return (
		<div
			className={`relative overflow-hidden rounded-xl bg-gray-100 ${className ?? ""}`}
		>
			<div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
		</div>
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

	const hasByDayData = earnings?.by_day && earnings.by_day.length > 1;

	return (
		<div className="space-y-5 sm:space-y-6">
			{/* Page title */}
			<div className="flex items-center justify-between">
				<div>
					<p className="text-xs uppercase tracking-[0.18em] text-amber-600 font-medium mb-1">
						{t("seller.dashboard.eyebrow", "Seller Hub")}
					</p>
					<h1 className="text-xl font-bold text-gray-900 font-heading">
						{t("seller.dashboard.title", "Dashboard")}
					</h1>
				</div>
				{onboarding?.store_status === "active" &&
					(onboarding.overall_percentage ?? 100) >= 100 && (
						<div className="hidden sm:flex items-center gap-1.5 text-[10px] text-emerald-600 bg-emerald-50 rounded-full px-2.5 py-1 ring-1 ring-emerald-200">
							<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
							{t("seller.dashboard.live_badge", "Live")}
						</div>
					)}
			</div>

			{/* Quick actions */}
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
						variant="gross"
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
						variant="net"
					/>
					<KpiCard
						label={t("seller.dashboard.kpi_orders", "Orders")}
						value={earnings.orders_count}
						sub={t("seller.dashboard.kpi_orders_sub", "Avg {{avg}} DH", {
							avg: fmtMAD(earnings.average_order_value),
						})}
						icon={ShoppingBag}
						variant="orders"
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
						variant="commission"
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
			{hasByDayData && earnings && <SalesTrendMini byDay={earnings.by_day} />}

			{/* Recent orders */}
			<div className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm overflow-hidden">
				<div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
					<h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
						<ShoppingBag className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
						{t("seller.dashboard.recent_orders", "Recent Orders")}
					</h2>
					<Link
						href="/seller/orders"
						className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 hover:text-indigo-900 transition-colors"
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
							<Skeleton key={i} className="h-12" />
						))}
					</div>
				) : orders.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-14 text-center px-6 gap-4">
						<div className="w-14 h-14 rounded-full bg-amber-50 ring-1 ring-amber-200 flex items-center justify-center">
							<Clock className="w-6 h-6 text-amber-400" aria-hidden="true" />
						</div>
						<div>
							<p className="text-sm font-medium text-gray-700 mb-1">
								{t(
									"seller.dashboard.no_orders",
									"No orders yet — share your store to get started!",
								)}
							</p>
							<p className="text-xs text-gray-400">
								{t(
									"seller.dashboard.no_orders_hint",
									"Once customers place orders, they&apos;ll appear here.",
								)}
							</p>
						</div>
						<Link
							href="/seller/products/new"
							className="inline-flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-full px-6 py-2.5 text-xs font-semibold transition-colors mt-1 shadow-sm active:scale-95 active:duration-75"
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
									<tr className="border-b border-gray-100 bg-gray-50/80">
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
										<DesktopRow key={order.id} order={order} />
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
