"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "@/lib/axios";
import toast from "@/utils/toast";
import logger from "@/utils/consoleLogger";
import { Upload, Loader2, Store as StoreIcon } from "lucide-react";

interface StoreProfileData {
	store: {
		id: number;
		name: string;
		email: string;
		phone: string | null;
		address: string | null;
		status: string;
	};
	profile: {
		description: string | null;
		contact_email: string | null;
		contact_phone: string | null;
		store_logo: string | null;
		store_logo_url: string | null;
		store_banner: string | null;
		store_banner_url: string | null;
		business_hours: string | null;
		shipping_policy: string | null;
		return_policy: string | null;
		profile_completion_percentage: number;
	} | null;
}

interface StoreOption {
	id: number;
	name: string;
}

export default function SellerStoreProfilePage() {
	const { t, i18n } = useTranslation(["seller", "common"]);
	const isRTL = i18n.language === "ar" || i18n.language === "ma";

	const [stores, setStores] = useState<StoreOption[]>([]);
	const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const [form, setForm] = useState({
		name: "",
		description: "",
		email: "",
		phone: "",
		address: "",
		business_hours: "",
		shipping_policy: "",
		return_policy: "",
	});
	const [logoFile, setLogoFile] = useState<File | null>(null);
	const [bannerFile, setBannerFile] = useState<File | null>(null);
	const [logoPreview, setLogoPreview] = useState<string | null>(null);
	const [bannerPreview, setBannerPreview] = useState<string | null>(null);

	// Load the seller's stores (multi-shop selector) via
	// GET /api/seller/stores (SellerStoreProfileController::mine).
	// Falls back gracefully to the single-store flow if the endpoint 404s.
	useEffect(() => {
		const loadStores = async () => {
			try {
				const response = await axios.get("/api/seller/stores");
				const list: StoreOption[] = response.data?.data ?? response.data ?? [];
				if (Array.isArray(list) && list.length > 0) {
					setStores(list);
					setSelectedStoreId(list[0].id);
				}
			} catch (error) {
				// No multi-shop endpoint yet / seller has a single shop — non-fatal.
				logger.error("Failed to load seller stores list:", error);
			}
		};
		loadStores();
	}, []);

	useEffect(() => {
		const loadProfile = async () => {
			setLoading(true);
			try {
				const params = selectedStoreId ? { store: selectedStoreId } : undefined;
				const response = await axios.get("/api/seller/store-profile", { params });
				const data: StoreProfileData = response.data?.data;

				if (data?.store) {
					setForm({
						name: data.store.name ?? "",
						description: data.profile?.description ?? "",
						email: data.store.email ?? "",
						phone: data.store.phone ?? "",
						address: data.store.address ?? "",
						business_hours: data.profile?.business_hours ?? "",
						shipping_policy: data.profile?.shipping_policy ?? "",
						return_policy: data.profile?.return_policy ?? "",
					});
					setLogoPreview(data.profile?.store_logo_url ?? null);
					setBannerPreview(data.profile?.store_banner_url ?? null);
				}
			} catch (error) {
				logger.error("Failed to load store profile:", error);
				toast.error(t("store_profile.load_failed", "Failed to load store profile"));
			} finally {
				setLoading(false);
			}
		};
		loadProfile();
	}, [selectedStoreId, t]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setLogoFile(file);
		setLogoPreview(URL.createObjectURL(file));
	};

	const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setBannerFile(file);
		setBannerPreview(URL.createObjectURL(file));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			const formData = new FormData();
			formData.append("name", form.name);
			formData.append("description", form.description ?? "");
			formData.append("email", form.email);
			formData.append("phone", form.phone ?? "");
			formData.append("address", form.address ?? "");
			formData.append("business_hours", form.business_hours ?? "");
			formData.append("shipping_policy", form.shipping_policy ?? "");
			formData.append("return_policy", form.return_policy ?? "");
			if (logoFile) formData.append("logo", logoFile);
			if (bannerFile) formData.append("banner", bannerFile);
			if (selectedStoreId) formData.append("store", String(selectedStoreId));

			await axios.put("/api/seller/store-profile", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			toast.success(t("store_profile.save_success", "Store profile updated"));
		} catch (error: any) {
			logger.error("Store profile save failed:", error);
			toast.error(
				error.response?.data?.message || t("store_profile.save_failed", "Failed to save store profile")
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className={`min-h-screen bg-canvas ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
			<div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
				<div className="mb-6 flex items-center gap-2">
					<StoreIcon className="h-5 w-5 text-amber-500" aria-hidden="true" />
					<h1 className="text-2xl font-bold text-indigo-950">
						{t("store_profile.title", "Store Profile")}
					</h1>
				</div>

				{stores.length > 1 && (
					<div className="mb-6">
						<label htmlFor="store-select" className="mb-1.5 block text-sm font-medium text-indigo-900/80">
							{t("store_profile.select_store", "Select shop")}
						</label>
						<select
							id="store-select"
							value={selectedStoreId ?? ""}
							onChange={(e) => setSelectedStoreId(Number(e.target.value))}
							className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
						>
							{stores.map((store) => (
								<option key={store.id} value={store.id}>
									{store.name}
								</option>
							))}
						</select>
					</div>
				)}

				{loading ? (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="h-6 w-6 animate-spin text-indigo-700" aria-hidden="true" />
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label htmlFor="name" className="mb-1.5 block text-sm font-medium text-indigo-900/80">
									{t("store_profile.name", "Store name")}
								</label>
								<input
									id="name"
									name="name"
									value={form.name}
									onChange={handleChange}
									required
									className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
								/>
							</div>
							<div>
								<label htmlFor="email" className="mb-1.5 block text-sm font-medium text-indigo-900/80">
									{t("store_profile.email", "Contact email")}
								</label>
								<input
									id="email"
									name="email"
									type="email"
									value={form.email}
									onChange={handleChange}
									required
									className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
								/>
							</div>
							<div>
								<label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-indigo-900/80">
									{t("store_profile.phone", "Phone")}
								</label>
								<input
									id="phone"
									name="phone"
									value={form.phone}
									onChange={handleChange}
									className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
								/>
							</div>
							<div>
								<label htmlFor="address" className="mb-1.5 block text-sm font-medium text-indigo-900/80">
									{t("store_profile.address", "Address")}
								</label>
								<input
									id="address"
									name="address"
									value={form.address}
									onChange={handleChange}
									className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
								/>
							</div>
						</div>

						<div>
							<label htmlFor="description" className="mb-1.5 block text-sm font-medium text-indigo-900/80">
								{t("store_profile.description", "Description")}
							</label>
							<textarea
								id="description"
								name="description"
								value={form.description}
								onChange={handleChange}
								rows={4}
								className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
							/>
						</div>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label className="mb-1.5 block text-sm font-medium text-indigo-900/80">
									{t("store_profile.logo", "Logo")}
								</label>
								<div className="flex items-center gap-3">
									{logoPreview && (
										// eslint-disable-next-line @next/next/no-img-element
										<img src={logoPreview} alt="" className="h-12 w-12 rounded-lg object-cover" />
									)}
									<label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-2.5 text-sm text-indigo-700 hover:bg-amber-50">
										<Upload className="h-4 w-4" aria-hidden="true" />
										{t("store_profile.upload_logo", "Upload logo")}
										<input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
									</label>
								</div>
							</div>
							<div>
								<label className="mb-1.5 block text-sm font-medium text-indigo-900/80">
									{t("store_profile.banner", "Banner")}
								</label>
								<div className="flex items-center gap-3">
									{bannerPreview && (
										// eslint-disable-next-line @next/next/no-img-element
										<img src={bannerPreview} alt="" className="h-12 w-20 rounded-lg object-cover" />
									)}
									<label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-2.5 text-sm text-indigo-700 hover:bg-amber-50">
										<Upload className="h-4 w-4" aria-hidden="true" />
										{t("store_profile.upload_banner", "Upload banner")}
										<input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
									</label>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label htmlFor="business_hours" className="mb-1.5 block text-sm font-medium text-indigo-900/80">
									{t("store_profile.business_hours", "Business hours")}
								</label>
								<textarea
									id="business_hours"
									name="business_hours"
									value={form.business_hours}
									onChange={handleChange}
									rows={2}
									className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
								/>
							</div>
							<div>
								<label htmlFor="shipping_policy" className="mb-1.5 block text-sm font-medium text-indigo-900/80">
									{t("store_profile.shipping_policy", "Shipping policy")}
								</label>
								<textarea
									id="shipping_policy"
									name="shipping_policy"
									value={form.shipping_policy}
									onChange={handleChange}
									rows={2}
									className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
								/>
							</div>
						</div>

						<div>
							<label htmlFor="return_policy" className="mb-1.5 block text-sm font-medium text-indigo-900/80">
								{t("store_profile.return_policy", "Return policy")}
							</label>
							<textarea
								id="return_policy"
								name="return_policy"
								value={form.return_policy}
								onChange={handleChange}
								rows={2}
								className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
							/>
						</div>

						<div className="flex justify-end pt-2">
							<button
								type="submit"
								disabled={saving}
								className="inline-flex items-center gap-2 rounded-xl bg-indigo-950 px-5 py-2.5 text-sm font-semibold text-white shadow-atlas-sm transition hover:bg-indigo-900 disabled:opacity-60"
							>
								{saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
								{saving ? t("common:loading") : t("common:actions.save_changes", "Save changes")}
							</button>
						</div>
					</form>
				)}
			</div>
		</div>
	);
}
