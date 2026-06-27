"use client";

import {
	Fragment,
	useState,
	useEffect,
	useMemo,
	useRef,
	useCallback,
	useId,
} from "react";
import Link from "next/link";
import { Dialog, Menu, Transition } from "@headlessui/react";
import {
	Search,
	Heart,
	ShoppingBag,
	User,
	Globe,
	Menu as MenuIcon,
	X,
	ChevronDown,
	MessageCircle,
	Package,
	Home,
	Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useDirection } from "@/hooks/useDirection";
import { useLocalizedHref } from "@/utils/navigation";
import CategoryDropdown from "../navigation/CategoryDropdown";
import { toast } from "react-hot-toast";
import { useRouter, usePathname } from "next/navigation";
import { useWishlist } from "@/contexts/WishlistContext";
import { useMessaging } from "@/contexts/MessagingContext";
import logger from "@/utils/consoleLogger";
import NotificationBell from "@/components/notifications/NotificationBell";
import { LOCALES, type Locale } from "@/middleware";
import SearchSuggestions from "@/components/search/SearchSuggestions";

interface FeaturedProduct {
	id: number;
	name_en: string;
	name_ar: string | null;
	image: string;
	price: string;
	discount_price: string | null;
	slug: string;
}

interface SubCategory {
	id: number;
	name_en: string;
	name_ar: string;
	slug: string;
}

interface Category {
	id: number;
	name_en: string;
	name_ar: string;
	image: string;
	slug: string;
	itemCount: number;
	store_id: number;
	subCategories: SubCategory[];
	featuredProducts: FeaturedProduct[];
}

const staticNavLinks = [
	{ labelKey: "nav.jewelry", fallback: "Jewelry", href: "/categories/jewelry" },
	{
		labelKey: "nav.tailoring",
		fallback: "Tailoring",
		href: "/services/tailoring",
	},
];

const languages = LOCALES;

export default function Navbar() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [searchBarVisible, setSearchBarVisible] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [suggestionsOpen, setSuggestionsOpen] = useState(false);
	const [categories, setCategories] = useState<Category[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Combobox container ref for click-outside detection
	const searchComboboxRef = useRef<HTMLDivElement>(null);
	const searchInputId = useId();

	const { user, logout } = useAuth();
	const { t, i18n } = useTranslation();
	const { isRTL } = useDirection();
	const getLocalizedHref = useLocalizedHref();
	const router = useRouter();
	const pathname = usePathname();
	// CartContext/WishlistContext expose no count shortcuts — destructuring
	// cartItemCount/wishlistCount yielded undefined and the badges never rendered.
	const { state: cartState } = useCart();
	const cartItemCount =
		cartState?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
	const { wishlistItems } = useWishlist();
	const wishlistCount = wishlistItems?.length ?? 0;
	const { unreadCount } = useMessaging();

	// Cart badge bump animation key — increments on cart:refresh event so
	// AnimatePresence remounts the badge and plays the scale pulse.
	const [cartBumpKey, setCartBumpKey] = useState(0);
	// Respect prefers-reduced-motion for the animation
	const prefersReducedMotion =
		typeof window !== "undefined" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	useEffect(() => {
		if (typeof window === "undefined") return;
		const handler = () => setCartBumpKey((k) => k + 1);
		window.addEventListener("cart:refresh", handler);
		return () => window.removeEventListener("cart:refresh", handler);
	}, []);

	// Prefetch category pages on load
	useEffect(() => {
		const controller = new AbortController();
		const signal = controller.signal;

		const fetchCategories = async () => {
			setIsLoading(true);
			try {
				const response = await fetch("/api/categories/header", {
					signal,
					headers: { "Cache-Control": "max-age=3600" },
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();
				if (data.headerCategories) {
					setCategories(data.headerCategories);
					data.headerCategories.forEach((category: Category) => {
						if (category.slug) {
							router.prefetch(`/category/${category.slug}`);
						}
					});
				} else {
					logger.error(
						"Failed to fetch categories:",
						data.message || "Unknown error",
					);
				}
			} catch (error) {
				if (error instanceof Error && error.name !== "AbortError") {
					logger.error("Error fetching categories:", error);
				}
			} finally {
				setIsLoading(false);
			}
		};

		fetchCategories();
		return () => controller.abort();
	}, [router]);

	// Click-outside: close suggestions dropdown when clicking outside the combobox
	useEffect(() => {
		const handlePointerDown = (e: PointerEvent) => {
			if (
				searchComboboxRef.current &&
				!searchComboboxRef.current.contains(e.target as Node)
			) {
				setSuggestionsOpen(false);
			}
		};
		document.addEventListener("pointerdown", handlePointerDown);
		return () => document.removeEventListener("pointerdown", handlePointerDown);
	}, []);

	const handleSearchQueryChange = useCallback((q: string) => {
		setSearchQuery(q);
		setSuggestionsOpen(q.length >= 2);
	}, []);

	const handleSuggestionSubmit = useCallback(
		(q: string) => {
			setSuggestionsOpen(false);
			setSearchBarVisible(false);
			setMobileMenuOpen(false);
			const searchUrl = `/products?q=${encodeURIComponent(q.trim())}`;
			router.push(searchUrl);
		},
		[router],
	);

	const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			setSearchBarVisible(false);
			setMobileMenuOpen(false);
			const searchUrl = `/products?q=${encodeURIComponent(searchQuery.trim())}`;
			router.prefetch(searchUrl);
			router.push(searchUrl);
		}
	};

	const handleLogout = async () => {
		try {
			await logout();
			toast.success(t("auth.logout_success"));
		} catch {
			toast.error(t("auth.logout_error"));
		}
	};

	const handleLanguageChange = (lang: Locale) => {
		i18n.changeLanguage(lang);
		const url = new URL(window.location.href);
		url.searchParams.set("locale", lang);
		router.push(url.pathname + url.search);
	};

	const currentLangLabel = i18n.language?.toUpperCase().slice(0, 2) || "EN";

	// Derive once; used for marquee Arabic font-rendering fix and category labels
	const isArabicLocale = ["ar", "ma"].includes(i18n.language);

	const promoMessages = [
		{
			key: "home.marquee.free_delivery",
			fallback: "Free delivery on orders over 500 MAD",
		},
		{ key: "home.marquee.returns", fallback: "14-day free returns" },
		{ key: "home.marquee.cod", fallback: "Cash on delivery available" },
		{
			key: "home.marquee.support",
			fallback: "Support in Arabic, French & English",
		},
	] as const;

	return (
		<>
			{/* ── Promo announcements — Atlas indigo-950 surface, 4-message CSS crossfade ── */}
			{/* Accessibility split:                                                           */}
			{/*   • sr-only <ul> lists ALL 4 messages — this is the AT surface                */}
			{/*   • The animated container is aria-hidden="true" as a whole; AT ignores it    */}
			{/* Pure-CSS opacity crossfade: each message is absolutely positioned and          */}
			{/* cycles in/out via staggered @keyframes. Zero JS, zero new deps.               */}
			{/* prefers-reduced-motion: global rule in globals.css collapses animation         */}
			{/* durations to 0.01ms — showing only the first (non-animated) message.          */}
			<div className="bg-indigo-950 text-amber-100 py-2 text-center text-xs font-medium tracking-wide overflow-hidden">
				{/* Visually-hidden static list — the real AT surface for all 4 messages */}
				<ul
					className="sr-only"
					aria-label={t("nav.announcement", "Promotional announcements")}
				>
					{promoMessages.map((msg) => (
						<li key={msg.key}>{t(msg.key, msg.fallback)}</li>
					))}
				</ul>

				{/* Animated container — purely visual, hidden from assistive technology */}
				<div
					aria-hidden="true"
					className="relative h-[1.25rem] mx-auto max-w-7xl px-6"
				>
					{promoMessages.map((msg, idx) => (
						<span
							key={msg.key}
							className={`absolute inset-0 flex items-center justify-center opacity-0 motion-reduce:opacity-0 ${idx === 0 ? "marquee-item-0" : idx === 1 ? "marquee-item-1" : idx === 2 ? "marquee-item-2" : "marquee-item-3"}`}
						>
							<span
								className={`opacity-90${isArabicLocale ? " font-arabic" : ""}`}
							>
								{t(msg.key, msg.fallback)}
							</span>
						</span>
					))}
				</div>
			</div>

			{/* ── Sticky main bar — parchment surface ──────────────────────── */}
			<header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-atlas-sm">
				<div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between gap-6">
					{/* ── Wordmark ─────────────────────────────────────────────── */}
					<Link
						href="/"
						prefetch
						aria-label={t("chrome.navbar.brandHome", "Beldify home")}
						className="flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 rounded"
					>
						<span
							className="text-2xl font-bold text-indigo-800 tracking-tight"
							style={{
								fontFamily: '"Playfair Display", ui-serif, Georgia, serif',
							}}
						>
							{t("brand.name", "Beldify")}
						</span>
					</Link>

					{/* ── Center: nav links + pill search (desktop) ────────────── */}
					<div className="hidden md:flex items-center flex-1 gap-1 min-w-0">
						{/* Static editorial nav links */}
						{staticNavLinks.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								prefetch
								className="text-sm text-gray-700 hover:text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
							>
								{t(link.labelKey, link.fallback)}
							</Link>
						))}

						{/* Pill search — combobox wrapper for typeahead suggestions */}
						<div
							ref={searchComboboxRef}
							className="relative flex-1 max-w-md mx-4 min-w-0"
						>
							<form onSubmit={handleSearchSubmit}>
								<span className="absolute start-4 inset-y-0 flex items-center pointer-events-none text-gray-400 z-10">
									<Search className="h-4 w-4" aria-hidden="true" />
								</span>
								<input
									id={searchInputId}
									type="search"
									role="combobox"
									aria-haspopup="listbox"
									aria-expanded={suggestionsOpen}
									aria-autocomplete="list"
									aria-controls={`${searchInputId}-listbox`}
									value={searchQuery}
									onChange={(e) => {
										const val = e.target.value;
										setSearchQuery(val);
										setSuggestionsOpen(val.length >= 2);
									}}
									onFocus={() => {
										if (searchQuery.length >= 2) setSuggestionsOpen(true);
									}}
									placeholder={t(
										"nav.search_placeholder",
										"Search caftans, djellabas, tailors…",
									)}
									aria-label={t(
										"nav.search_placeholder",
										"Search caftans, djellabas, tailors…",
									)}
									autoComplete="off"
									className="w-full bg-white border border-gray-200 rounded-full py-2 ps-11 pe-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 transition-colors duration-200"
								/>
							</form>

							{/* Typeahead suggestions dropdown */}
							{suggestionsOpen && (
								<SearchSuggestions
									query={searchQuery}
									onQueryChange={handleSearchQueryChange}
									onSubmit={handleSuggestionSubmit}
									onClose={() => setSuggestionsOpen(false)}
									listboxId={`${searchInputId}-listbox`}
									className="absolute top-full start-0 end-0 mt-1 z-50"
								/>
							)}
						</div>
					</div>

					{/* ── Right: icon cluster (desktop) ────────────────────────── */}
					<div className="hidden md:flex items-center gap-3 flex-shrink-0">
						{/* Language switcher */}
						<Menu as="div" className="relative">
							{({ open }) => (
								<>
									<Menu.Button
										aria-label={t(
											"chrome.navbar.changeLanguage",
											"Change language",
										)}
										className="flex items-center gap-1.5 py-1.5 px-3 text-gray-600 hover:text-indigo-700 border border-gray-200 bg-white rounded-full text-sm font-medium transition hover:border-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
										aria-expanded={open}
										aria-haspopup="true"
									>
										<Globe className="h-4 w-4" aria-hidden="true" />
										<span>{currentLangLabel}</span>
										<ChevronDown
											className={cn(
												"h-3 w-3 transition-transform",
												open && "rotate-180",
											)}
											aria-hidden="true"
										/>
									</Menu.Button>
									<Transition
										as={Fragment}
										enter="transition ease-out duration-100"
										enterFrom="transform opacity-0 scale-95"
										enterTo="transform opacity-100 scale-100"
										leave="transition ease-in duration-75"
										leaveFrom="transform opacity-100 scale-100"
										leaveTo="transform opacity-0 scale-95"
									>
										<Menu.Items className="absolute end-0 z-20 mt-2 w-48 origin-top-end bg-white shadow-xl ring-1 ring-gray-200 rounded-2xl py-2 focus:outline-none">
											{languages.map((lang) => (
												<Menu.Item key={lang}>
													{({ active }) => (
														<button
															onClick={() => handleLanguageChange(lang)}
															className={cn(
																"block w-full text-left px-4 py-2 text-sm transition",
																active
																	? "bg-indigo-50 text-indigo-700"
																	: "text-gray-700",
																i18n.language === lang
																	? "font-semibold text-indigo-700"
																	: "",
															)}
														>
															{t(
																`navigation.languages.${lang}`,
																lang.toUpperCase(),
															)}
														</button>
													)}
												</Menu.Item>
											))}
										</Menu.Items>
									</Transition>
								</>
							)}
						</Menu>

						{/* Account-only icons — Messages, Notifications, Orders, Wishlist */}
						{user && (
							<>
								{/* Messages */}
								<Link
									href="/community/messages"
									prefetch
									aria-label={`Messages${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
									className="relative flex items-center justify-center w-9 h-9 text-gray-600 hover:text-indigo-700 rounded-full hover:bg-gray-100 transition"
								>
									<MessageCircle className="h-5 w-5" aria-hidden="true" />
									{unreadCount > 0 && (
										<span className="absolute -top-1 -end-1 bg-amber-500 text-amber-950 text-[10px] font-bold rounded-full h-4 min-w-[1rem] px-1 flex items-center justify-center leading-none">
											{unreadCount}
										</span>
									)}
								</Link>

								{/* Notifications */}
								<NotificationBell />

								{/* Orders */}
								<Link
									href="/orders"
									prefetch
									aria-label={t("navigation.orders", "Orders")}
									className="relative flex items-center justify-center w-9 h-9 text-gray-600 hover:text-indigo-700 rounded-full hover:bg-gray-100 transition"
								>
									<Package className="h-5 w-5" aria-hidden="true" />
								</Link>

								{/* Wishlist */}
								<Link
									href="/wishlist"
									prefetch
									aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} items` : ""}`}
									className="relative flex items-center justify-center w-9 h-9 text-gray-600 hover:text-indigo-700 rounded-full hover:bg-gray-100 transition"
								>
									<Heart className="h-5 w-5" aria-hidden="true" />
									{wishlistCount > 0 && (
										<span className="absolute -top-1 -end-1 bg-amber-500 text-amber-950 text-[10px] font-bold rounded-full h-4 min-w-[1rem] px-1 flex items-center justify-center leading-none">
											{wishlistCount}
										</span>
									)}
								</Link>
							</>
						)}

						{/* Cart */}
						<Link
							href="/cart"
							prefetch
							aria-label={`Cart${cartItemCount > 0 ? `, ${cartItemCount} items` : ""}`}
							className="relative flex items-center justify-center w-9 h-9 text-gray-600 hover:text-indigo-700 rounded-full hover:bg-gray-100 transition"
						>
							<ShoppingBag className="h-5 w-5" aria-hidden="true" />
							{cartItemCount > 0 && (
								<span
									key={`cart-badge-${cartBumpKey}`}
									className="absolute -top-1 -end-1 bg-indigo-700 text-white text-[10px] font-bold rounded-full h-4 min-w-[1rem] px-1 flex items-center justify-center leading-none cart-badge-bump"
									aria-live="polite"
									aria-atomic="true"
								>
									{cartItemCount}
								</span>
							)}
						</Link>

						{/* User menu */}
						{user ? (
							<Menu as="div" className="relative">
								{({ open }) => (
									<>
										<Menu.Button
											aria-label={t("chrome.navbar.userMenu", "User menu")}
											aria-expanded={open}
											aria-haspopup="true"
											className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
										>
											{user.full_name_en ? (
												user.full_name_en.charAt(0).toUpperCase()
											) : (
												<User className="h-4 w-4" aria-hidden="true" />
											)}
										</Menu.Button>
										<Transition
											as={Fragment}
											enter="transition ease-out duration-100"
											enterFrom="transform opacity-0 scale-95"
											enterTo="transform opacity-100 scale-100"
											leave="transition ease-in duration-75"
											leaveFrom="transform opacity-100 scale-100"
											leaveTo="transform opacity-0 scale-95"
										>
											<Menu.Items className="absolute end-0 z-20 mt-2 w-56 origin-top-end bg-white shadow-xl ring-1 ring-gray-200 rounded-2xl py-2 focus:outline-none">
												<div className="px-4 py-2 border-b border-gray-100 mb-1">
													<p className="text-sm font-semibold text-gray-900 truncate">
														{user.full_name_en ||
															t("common.welcome", "Welcome")}
													</p>
													<p className="text-xs text-gray-500 truncate">
														{user.email}
													</p>
												</div>
												<Menu.Item>
													{({ active }) => (
														<Link
															href="/profile"
															className={cn(
																"flex items-center gap-2 px-4 py-2 text-sm transition",
																active
																	? "bg-indigo-50 text-indigo-700"
																	: "text-gray-700",
															)}
														>
															<User className="h-4 w-4" aria-hidden="true" />
															{t("navigation.profile", "Profile")}
														</Link>
													)}
												</Menu.Item>
												<Menu.Item>
													{({ active }) => (
														<Link
															href="/orders"
															className={cn(
																"flex items-center gap-2 px-4 py-2 text-sm transition",
																active
																	? "bg-indigo-50 text-indigo-700"
																	: "text-gray-700",
															)}
														>
															<Package className="h-4 w-4" aria-hidden="true" />
															{t("navigation.orders", "Orders")}
														</Link>
													)}
												</Menu.Item>
												<Menu.Item>
													{({ active }) => (
														<Link
															href="/wishlist"
															className={cn(
																"flex items-center gap-2 px-4 py-2 text-sm transition relative",
																active
																	? "bg-indigo-50 text-indigo-700"
																	: "text-gray-700",
															)}
														>
															<Heart className="h-4 w-4" aria-hidden="true" />
															{t("navigation.wishlist", "Wishlist")}
															{wishlistCount > 0 && (
																<span className="ms-auto bg-amber-500 text-amber-950 text-[10px] font-bold rounded-full h-4 min-w-[1rem] px-1 flex items-center justify-center">
																	{wishlistCount}
																</span>
															)}
														</Link>
													)}
												</Menu.Item>
												{user?.is_seller && (
													<Menu.Item>
														{({ active }) => (
															<Link
																href="/seller"
																className={cn(
																	"flex items-center gap-2 px-4 py-2 text-sm transition",
																	active
																		? "bg-indigo-50 text-indigo-700"
																		: "text-gray-700",
																)}
															>
																<Store className="h-4 w-4" aria-hidden="true" />
																{t(
																	"navigation.seller_dashboard",
																	"Seller Dashboard",
																)}
															</Link>
														)}
													</Menu.Item>
												)}
												<div className="my-1 border-t border-gray-100" />
												<Menu.Item>
													{({ active }) => (
														<button
															onClick={handleLogout}
															className={cn(
																"flex items-center gap-2 w-full px-4 py-2 text-sm transition",
																active
																	? "bg-indigo-50 text-indigo-700"
																	: "text-gray-700",
															)}
														>
															{t("navigation.logout", "Sign out")}
														</button>
													)}
												</Menu.Item>
											</Menu.Items>
										</Transition>
									</>
								)}
							</Menu>
						) : (
							<Link
								href="/login"
								prefetch
								className="flex items-center gap-1.5 py-1.5 px-3 text-gray-600 hover:text-indigo-700 border border-gray-200 bg-white rounded-full text-sm font-medium transition hover:border-indigo-300"
							>
								<User className="h-4 w-4" aria-hidden="true" />
								<span className="hidden lg:inline">
									{t("navigation.login", "Sign in")}
								</span>
							</Link>
						)}
					</div>

					{/* ── Mobile icon cluster ───────────────────────────────────── */}
					<div className="flex md:hidden items-center gap-2 flex-shrink-0">
						{/* Mobile search icon */}
						<button
							type="button"
							onClick={() => setSearchBarVisible(true)}
							aria-label={t("nav.search_placeholder", "Search")}
							className="flex items-center justify-center w-9 h-9 text-gray-600 hover:text-indigo-700 rounded-full hover:bg-gray-100 transition"
						>
							<Search className="h-5 w-5" aria-hidden="true" />
						</button>

						{/* Cart (mobile) */}
						<Link
							href="/cart"
							prefetch
							aria-label={`Cart${cartItemCount > 0 ? `, ${cartItemCount} items` : ""}`}
							className="relative flex items-center justify-center w-9 h-9 text-gray-600 hover:text-indigo-700 rounded-full hover:bg-gray-100 transition"
						>
							<ShoppingBag className="h-5 w-5" aria-hidden="true" />
							{cartItemCount > 0 && (
								<span
									key={`cart-badge-${cartBumpKey}`}
									className="absolute -top-1 -end-1 bg-indigo-700 text-white text-[10px] font-bold rounded-full h-4 min-w-[1rem] px-1 flex items-center justify-center leading-none cart-badge-bump"
									aria-live="polite"
									aria-atomic="true"
								>
									{cartItemCount}
								</span>
							)}
						</Link>

						{/* Hamburger */}
						<button
							type="button"
							onClick={() => setMobileMenuOpen(true)}
							aria-expanded={mobileMenuOpen}
							aria-haspopup="dialog"
							aria-label={t("chrome.navbar.openMenu", "Open main menu")}
							className="flex items-center justify-center w-9 h-9 text-gray-600 hover:text-indigo-700 rounded-full hover:bg-gray-100 transition"
						>
							<MenuIcon className="h-5 w-5" aria-hidden="true" />
						</button>
					</div>
				</div>
			</header>

			{/* ── Mobile search overlay ─────────────────────────────────────── */}
			{searchBarVisible && (
				<div
					className="fixed inset-0 bg-white z-50 flex items-start pt-20 px-4 md:hidden"
					role="dialog"
					aria-modal="true"
					aria-label={t("nav.search_placeholder", "Search")}
					onKeyDown={(e) => {
						if (e.key === "Escape") setSearchBarVisible(false);
						if (e.key === "Tab") {
							const focusable =
								e.currentTarget.querySelectorAll<HTMLElement>("input, button");
							const first = focusable[0];
							const last = focusable[focusable.length - 1];
							if (e.shiftKey && document.activeElement === first) {
								e.preventDefault();
								last?.focus();
							} else if (!e.shiftKey && document.activeElement === last) {
								e.preventDefault();
								first?.focus();
							}
						}
					}}
				>
					<form
						onSubmit={handleSearchSubmit}
						className="w-full max-w-lg mx-auto"
					>
						<div className="relative">
							<span className="absolute start-4 inset-y-0 flex items-center pointer-events-none text-indigo-500">
								<Search className="h-5 w-5" aria-hidden="true" />
							</span>
							<input
								type="search"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder={t(
									"nav.search_placeholder",
									"Search caftans, djellabas, tailors…",
								)}
								aria-label={t(
									"nav.search_placeholder",
									"Search caftans, djellabas, tailors…",
								)}
								autoFocus
								className="w-full bg-white border border-gray-200 rounded-full py-3 ps-12 pe-12 text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
							/>
							<button
								type="button"
								onClick={() => setSearchBarVisible(false)}
								aria-label={t("common.close", "Close search")}
								className="absolute end-4 inset-y-0 flex items-center text-gray-400 hover:text-indigo-700 transition"
							>
								<X className="h-5 w-5" aria-hidden="true" />
							</button>
						</div>
					</form>
				</div>
			)}

			{/* ── Mobile slide-over (from right) ───────────────────────────── */}
			<Transition.Root show={mobileMenuOpen} as={Fragment}>
				<Dialog
					as="div"
					className="relative z-50 md:hidden"
					onClose={setMobileMenuOpen}
					aria-label={t("chrome.navbar.mainMenu", "Main menu")}
				>
					{/* Backdrop */}
					<Transition.Child
						as={Fragment}
						enter="transition-opacity ease-linear duration-300"
						enterFrom="opacity-0"
						enterTo="opacity-100"
						leave="transition-opacity ease-linear duration-300"
						leaveFrom="opacity-100"
						leaveTo="opacity-0"
					>
						<div className="fixed inset-0 bg-black/30" aria-hidden="true" />
					</Transition.Child>

					{/* Panel — slides from right in LTR, from left in RTL */}
					<div
						className={`fixed inset-0 flex ${isRTL ? "justify-start" : "justify-end"}`}
					>
						<Transition.Child
							as={Fragment}
							enter="transition ease-in-out duration-300 transform"
							enterFrom={isRTL ? "-translate-x-full" : "translate-x-full"}
							enterTo="translate-x-0"
							leave="transition ease-in-out duration-300 transform"
							leaveFrom="translate-x-0"
							leaveTo={isRTL ? "-translate-x-full" : "translate-x-full"}
						>
							<Dialog.Panel className="relative flex w-full max-w-xs flex-col overflow-y-auto bg-white pb-16 shadow-atlas-xl">
								{/* Panel header */}
								<div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-200 bg-white">
									<Link
										href="/"
										onClick={() => setMobileMenuOpen(false)}
										aria-label={t("chrome.navbar.brandHome", "Beldify home")}
										className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 rounded"
									>
										<span
											className="text-xl font-bold text-indigo-800 tracking-tight"
											style={{
												fontFamily:
													'"Playfair Display", ui-serif, Georgia, serif',
											}}
										>
											{t("brand.name", "Beldify")}
										</span>
									</Link>
									<div className="flex items-center gap-1">
										{/* Notifications (mobile) — account only */}
										{user && <NotificationBell />}
										<button
											type="button"
											onClick={() => setMobileMenuOpen(false)}
											aria-label={t("chrome.navbar.closeMenu", "Close menu")}
											className="flex items-center justify-center w-9 h-9 text-gray-500 hover:text-indigo-700 rounded-full hover:bg-gray-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
										>
											<X className="h-5 w-5" aria-hidden="true" />
										</button>
									</div>
								</div>

								{/* User section */}
								<div className="px-5 py-4 border-b border-gray-200">
									{user ? (
										<div>
											<div className="flex items-center gap-3 mb-3">
												<div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
													{user.full_name_en ? (
														user.full_name_en.charAt(0).toUpperCase()
													) : (
														<User className="h-4 w-4" />
													)}
												</div>
												<div className="min-w-0">
													<p className="text-sm font-semibold text-gray-900 truncate">
														{user.full_name_en ||
															t("common.welcome", "Welcome")}
													</p>
													<p className="text-xs text-gray-500 truncate">
														{user.email}
													</p>
												</div>
											</div>
											{user.is_seller && (
												<Link
													href="/seller"
													onClick={() => setMobileMenuOpen(false)}
													className="mb-2 flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-50 rounded-xl text-sm font-semibold text-amber-800 hover:bg-amber-100 border border-amber-200 transition"
												>
													<Store className="h-4 w-4" aria-hidden="true" />
													{t("navigation.seller_dashboard", "Seller Dashboard")}
												</Link>
											)}
											<div className="grid grid-cols-2 gap-2">
												<Link
													href="/profile"
													onClick={() => setMobileMenuOpen(false)}
													className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white rounded-xl text-sm text-gray-700 hover:text-indigo-700 border border-gray-200 transition"
												>
													<User className="h-4 w-4" aria-hidden="true" />
													{t("navigation.profile", "Profile")}
												</Link>
												<button
													onClick={() => {
														handleLogout();
														setMobileMenuOpen(false);
													}}
													className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white rounded-xl text-sm text-gray-700 hover:text-indigo-700 border border-gray-200 transition"
												>
													{t("navigation.logout", "Sign out")}
												</button>
											</div>
										</div>
									) : (
										<div className="grid grid-cols-2 gap-2">
											<Link
												href="/login"
												onClick={() => setMobileMenuOpen(false)}
												className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-indigo-700 rounded-xl text-sm text-white hover:bg-indigo-800 transition font-medium"
											>
												{t("navigation.login", "Sign in")}
											</Link>
											<Link
												href="/register"
												onClick={() => setMobileMenuOpen(false)}
												className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white rounded-xl text-sm text-gray-700 hover:text-indigo-700 border border-gray-200 transition"
											>
												{t("navigation.register", "Register")}
											</Link>
										</div>
									)}
								</div>

								{/* Quick links */}
								<div
									className={cn(
										"grid gap-2 px-5 py-4 border-b border-gray-200",
										user ? "grid-cols-3" : "grid-cols-1",
									)}
								>
									<Link
										href="/cart"
										onClick={() => setMobileMenuOpen(false)}
										className="flex flex-col items-center gap-1 py-3 bg-white rounded-xl text-gray-700 hover:text-indigo-700 border border-gray-200 transition relative"
										aria-label={`Cart${cartItemCount > 0 ? `, ${cartItemCount} items` : ""}`}
									>
										<ShoppingBag className="h-5 w-5" aria-hidden="true" />
										<span className="text-xs">
											{t("navigation.cart", "Cart")}
										</span>
										{cartItemCount > 0 && (
											<span className="absolute top-1.5 end-1.5 bg-indigo-700 text-white text-[9px] font-bold rounded-full h-4 min-w-[1rem] px-0.5 flex items-center justify-center">
												{cartItemCount}
											</span>
										)}
									</Link>
									{user && (
										<>
											<Link
												href="/wishlist"
												onClick={() => setMobileMenuOpen(false)}
												className="flex flex-col items-center gap-1 py-3 bg-white rounded-xl text-gray-700 hover:text-indigo-700 border border-gray-200 transition relative"
												aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} items` : ""}`}
											>
												<Heart className="h-5 w-5" aria-hidden="true" />
												<span className="text-xs">
													{t("navigation.wishlist", "Wishlist")}
												</span>
												{wishlistCount > 0 && (
													<span className="absolute top-1.5 end-1.5 bg-amber-500 text-amber-950 text-[9px] font-bold rounded-full h-4 min-w-[1rem] px-0.5 flex items-center justify-center">
														{wishlistCount}
													</span>
												)}
											</Link>
											<Link
												href="/community/messages"
												onClick={() => setMobileMenuOpen(false)}
												className="flex flex-col items-center gap-1 py-3 bg-white rounded-xl text-gray-700 hover:text-indigo-700 border border-gray-200 transition relative"
												aria-label={`Messages${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
											>
												<MessageCircle className="h-5 w-5" aria-hidden="true" />
												<span className="text-xs">
													{t("navigation.messages", "Messages")}
												</span>
												{unreadCount > 0 && (
													<span className="absolute top-1.5 end-1.5 bg-amber-500 text-amber-950 text-[9px] font-bold rounded-full h-4 min-w-[1rem] px-0.5 flex items-center justify-center">
														{unreadCount}
													</span>
												)}
											</Link>
										</>
									)}
								</div>

								{/* Nav links */}
								<div className="px-5 py-4 border-b border-gray-200">
									<p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-3">
										{t("nav.browse", "Browse")}
									</p>
									<nav className="space-y-1">
										{staticNavLinks.map((link) => (
											<Link
												key={link.href}
												href={link.href}
												onClick={() => setMobileMenuOpen(false)}
												className="block py-2 px-3 text-sm text-gray-700 hover:text-indigo-700 hover:bg-gray-100 rounded-lg transition"
											>
												{t(link.labelKey, link.fallback)}
											</Link>
										))}
									</nav>
								</div>

								{/* Categories from API */}
								{!isLoading && categories.length > 0 && (
									<div className="px-5 py-4 border-b border-gray-200">
										<p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-3">
											{t("navigation.categories", "Categories")}
										</p>
										<div className="space-y-1">
											{categories.map((category) => (
												<Link
													key={category.id}
													href={getLocalizedHref(
														`/categories/${category.slug}`,
													)}
													onClick={() => setMobileMenuOpen(false)}
													className="flex items-center justify-between py-2 px-3 text-sm text-gray-700 hover:text-indigo-700 hover:bg-gray-100 rounded-lg transition"
												>
													<span>
														{i18n.language === "ar" || i18n.language === "ma"
															? category.name_ar
															: category.name_en}
													</span>
													{category.itemCount > 0 && (
														<span className="text-xs text-gray-400">
															({category.itemCount})
														</span>
													)}
												</Link>
											))}
										</div>
									</div>
								)}

								{/* Language switcher */}
								<div className="px-5 py-4">
									<p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-3">
										{t("navigation.language", "Language")}
									</p>
									<div className="grid grid-cols-2 gap-2">
										{languages.map((lang) => (
											<button
												key={lang}
												onClick={() => {
													handleLanguageChange(lang);
													setMobileMenuOpen(false);
												}}
												className={cn(
													"px-3 py-2 text-sm rounded-xl transition",
													i18n.language === lang
														? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200"
														: "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200",
												)}
											>
												{t(`navigation.languages.${lang}`, lang.toUpperCase())}
											</button>
										))}
									</div>
								</div>
							</Dialog.Panel>
						</Transition.Child>
					</div>
				</Dialog>
			</Transition.Root>
		</>
	);
}
