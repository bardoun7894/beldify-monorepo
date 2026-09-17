"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import {
	registerSeller,
	SellerRegisterPayload,
} from "@/services/sellerService";
import StoreTypePicker from "@/components/seller/StoreTypePicker";
import { ArrowRight, CheckCircle, Upload, Eye, EyeOff } from "lucide-react";

const COUNTRIES = [
	{ code: "MA", name: "Morocco" },
	{ code: "SA", name: "Saudi Arabia" },
	{ code: "AE", name: "United Arab Emirates" },
	{ code: "QA", name: "Qatar" },
	{ code: "KW", name: "Kuwait" },
	{ code: "BH", name: "Bahrain" },
	{ code: "OM", name: "Oman" },
	{ code: "FR", name: "France" },
	{ code: "GB", name: "United Kingdom" },
	{ code: "US", name: "United States" },
];

interface FormState {
	full_name_en: string;
	phone: string;
	email: string;
	password: string;
	password_confirmation: string;
	store_name: string;
	business_type: string;
	store_type_id: number | null;
	country: string;
	contact_email: string;
	contact_phone: string;
	description: string;
	logo: File | null;
}

const initialForm: FormState = {
	full_name_en: "",
	phone: "",
	email: "",
	password: "",
	password_confirmation: "",
	store_name: "",
	business_type: "",
	store_type_id: null,
	country: "MA",
	contact_email: "",
	contact_phone: "",
	description: "",
	logo: null,
};

export default function SellerSignupPage() {
	const { t, i18n } = useTranslation();
	const router = useRouter();
	const { isAuthenticated } = useAuth();
	const isRTL = i18n.language === "ar" || i18n.language === "ma";

	const [form, setForm] = useState<FormState>(initialForm);
	const [showPassword, setShowPassword] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const inputClass =
		"block w-full rounded-2xl bg-amber-50 ring-1 ring-amber-200 focus:ring-2 focus:ring-indigo-700/40 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all duration-150";

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
		if (errorMsg) setErrorMsg(null);
	};

	const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0] ?? null;
		setForm((prev) => ({ ...prev, logo: file }));
	};

	const handleStoreTypeChange = (storeTypeId: number) => {
		setForm((prev) => ({ ...prev, store_type_id: storeTypeId }));
		if (errorMsg) setErrorMsg(null);
	};

	const validate = (): boolean => {
		if (!form.full_name_en.trim()) {
			setErrorMsg(t("auth.full_name_required", "Full name is required"));
			return true;
		}
		if (!form.phone.trim()) {
			setErrorMsg(t("auth.phone_required", "Phone number is required"));
			return true;
		}
		if (form.password.length < 8) {
			setErrorMsg(t("auth.password_too_short", "Use at least 8 characters"));
			return true;
		}
		if (form.password !== form.password_confirmation) {
			setErrorMsg(t("auth.passwords_do_not_match", "Passwords do not match"));
			return true;
		}
		if (!form.store_name.trim()) {
			setErrorMsg(
				t("seller.register.store_name_required", "Store name is required"),
			);
			return true;
		}
		if (!form.business_type) {
			setErrorMsg(
				t(
					"seller.register.validation_business_type",
					"Please select a business type",
				),
			);
			return true;
		}
		if (!form.store_type_id) {
			setErrorMsg(
				t(
					"seller.register.validation_store_type",
					"Please select what you sell",
				),
			);
			return true;
		}
		if (!form.country) {
			setErrorMsg(
				t("seller.register.validation_country", "Please select a country"),
			);
			return true;
		}
		return false;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (validate()) return;

		setIsSubmitting(true);
		setErrorMsg(null);

		try {
			const payload: SellerRegisterPayload = {
				full_name_en: form.full_name_en.trim(),
				phone: form.phone.trim(),
				email: form.email.trim() || undefined,
				password: form.password,
				password_confirmation: form.password_confirmation,
				store_name: form.store_name.trim(),
				store_type_id: form.store_type_id as number,
				business_type: form.business_type,
				country: form.country,
				contact_email: form.contact_email.trim() || undefined,
				contact_phone: form.contact_phone.trim() || undefined,
				description: form.description.trim() || undefined,
				...(form.logo ? { logo: form.logo } : {}),
			};

			const result = await registerSeller(payload);

			if (result.success) {
				setSubmitted(true);
			} else {
				setErrorMsg(
					result.message ||
						t(
							"seller.register.error_generic",
							"Something went wrong. Please try again.",
						),
				);
			}
		} catch (err: any) {
			setErrorMsg(
				err.message ||
					t(
						"seller.register.error_generic",
						"Something went wrong. Please try again.",
					),
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isAuthenticated) {
		router.push("/seller/register");
		return null;
	}

	if (submitted) {
		return (
			<div
				className={`min-h-screen bg-canvas ${isRTL ? "rtl" : "ltr"}`}
				dir={isRTL ? "rtl" : "ltr"}
			>
				<div className="max-w-7xl mx-auto px-6 py-24 flex flex-col items-center text-center">
					<div className="w-20 h-20 rounded-full bg-indigo-50 ring-4 ring-indigo-100 flex items-center justify-center mb-8">
						<CheckCircle
							className="w-10 h-10 text-indigo-700"
							strokeWidth={1.5}
							aria-hidden="true"
						/>
					</div>

					<h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-balance font-heading">
						{t("seller.signup.success_title", "Seller account created!")}
					</h1>
					<p className="text-gray-500 mb-8 max-w-md text-sm leading-relaxed">
						{t(
							"seller.signup.success_body",
							"Your account and store application are pending review. You can start setting up your seller profile now.",
						)}
					</p>

					<div className="flex flex-col sm:flex-row gap-3 justify-center">
						<Link
							href="/seller/onboarding"
							className="inline-flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-full py-3 px-8 text-sm font-semibold transition-all duration-200 hover-lift focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700/50"
						>
							{t("seller.signup.onboarding_cta", "Start seller onboarding")}
							<ArrowRight
								className="w-4 h-4 rtl:rotate-180"
								aria-hidden="true"
							/>
						</Link>
						<Link
							href="/"
							className="inline-flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-gray-800 ring-1 ring-amber-200 rounded-full py-3 px-8 text-sm font-semibold transition-all duration-200 hover-lift focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400/50"
						>
							{t("seller.register.pending_cta", "Back to home")}
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`min-h-screen bg-canvas ${isRTL ? "rtl" : "ltr"}`}
			dir={isRTL ? "rtl" : "ltr"}
		>
			<div className="bg-indigo-950 py-12 relative overflow-hidden">
				<div
					className="absolute inset-0 opacity-20 pointer-events-none"
					aria-hidden="true"
					style={{
						background:
							"radial-gradient(circle at 20% 20%, hsl(var(--amber-500)) 0, transparent 45%), radial-gradient(circle at 80% 60%, hsl(var(--indigo-500)) 0, transparent 50%)",
					}}
				/>
				<div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
					<p className="text-xs uppercase tracking-[0.18em] text-amber-400 font-medium mb-4">
						{t("seller.signup.eyebrow", "SELL ON BELDIFY")}
					</p>
					<h1 className="text-3xl sm:text-4xl font-bold text-white text-balance font-heading">
						{t("seller.signup.title", "Create your seller account")}
					</h1>
					<p className="mt-3 text-indigo-200 text-sm max-w-xl mx-auto">
						{t(
							"seller.signup.subtitle",
							"One form. Your account + store application, reviewed within 3–5 business days.",
						)}
					</p>
				</div>
			</div>

			<main className="max-w-2xl mx-auto px-6 py-12">
				<div className="bg-white rounded-2xl ring-1 ring-gray-200 p-8 shadow-atlas-sm">
					{errorMsg && (
						<div
							className="mb-5 p-4 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-sm text-rose-700"
							role="alert"
						>
							{errorMsg}
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-5" noValidate>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
							<div>
								<label
									htmlFor="full_name_en"
									className="block text-sm font-medium text-gray-700 mb-1.5"
								>
									{t("auth.full_name", "Full name")}
									<span className="text-rose-500 ms-1" aria-hidden="true">
										*
									</span>
								</label>
								<input
									type="text"
									id="full_name_en"
									name="full_name_en"
									value={form.full_name_en}
									onChange={handleChange}
									placeholder={t(
										"auth.full_name_placeholder",
										"e.g. Amina Tazi",
									)}
									className={inputClass}
									autoComplete="name"
									required
								/>
							</div>

							<div>
								<label
									htmlFor="phone"
									className="block text-sm font-medium text-gray-700 mb-1.5"
								>
									{t("auth.phone", "Phone number")}
									<span className="text-rose-500 ms-1" aria-hidden="true">
										*
									</span>
								</label>
								<input
									type="tel"
									id="phone"
									name="phone"
									value={form.phone}
									onChange={handleChange}
									placeholder="+212 6 12 34 56 78"
									className={inputClass}
									autoComplete="tel"
									required
									dir="ltr"
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-gray-700 mb-1.5"
							>
								{t("auth.email", "Email address")}
								<span className="text-gray-400 font-normal text-xs ms-1">
									({t("common.optional", "optional")})
								</span>
							</label>
							<input
								type="email"
								id="email"
								name="email"
								value={form.email}
								onChange={handleChange}
								placeholder={t("auth.email_placeholder", "example@mail.com")}
								className={inputClass}
								autoComplete="email"
								dir="ltr"
							/>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
							<div className="relative">
								<label
									htmlFor="password"
									className="block text-sm font-medium text-gray-700 mb-1.5"
								>
									{t("auth.password", "Password")}
									<span className="text-rose-500 ms-1" aria-hidden="true">
										*
									</span>
								</label>
								<input
									type={showPassword ? "text" : "password"}
									id="password"
									name="password"
									value={form.password}
									onChange={handleChange}
									placeholder="••••••••"
									className={`${inputClass} pe-10`}
									autoComplete="new-password"
									required
									dir="ltr"
								/>
								<button
									type="button"
									onClick={() => setShowPassword((v) => !v)}
									className="absolute end-3 top-[2.1rem] text-gray-400 hover:text-indigo-700"
									aria-label={
										showPassword
											? t("auth.hide_password", "Hide password")
											: t("auth.show_password", "Show password")
									}
								>
									{showPassword ? (
										<EyeOff className="w-4 h-4" />
									) : (
										<Eye className="w-4 h-4" />
									)}
								</button>
							</div>

							<div>
								<label
									htmlFor="password_confirmation"
									className="block text-sm font-medium text-gray-700 mb-1.5"
								>
									{t("auth.confirm_password", "Confirm password")}
									<span className="text-rose-500 ms-1" aria-hidden="true">
										*
									</span>
								</label>
								<input
									type={showPassword ? "text" : "password"}
									id="password_confirmation"
									name="password_confirmation"
									value={form.password_confirmation}
									onChange={handleChange}
									placeholder="••••••••"
									className={inputClass}
									autoComplete="new-password"
									required
									dir="ltr"
								/>
							</div>
						</div>

						<hr className="border-gray-100" />

						<div>
							<label
								htmlFor="store_name"
								className="block text-sm font-medium text-gray-700 mb-1.5"
							>
								{t("seller.register.store_name_label", "Store name")}
								<span className="text-rose-500 ms-1" aria-hidden="true">
									*
								</span>
							</label>
							<input
								type="text"
								id="store_name"
								name="store_name"
								value={form.store_name}
								onChange={handleChange}
								placeholder={t(
									"seller.register.store_name_placeholder",
									"Your atelier or business name",
								)}
								className={inputClass}
							/>
						</div>

						<div>
							<label
								htmlFor="business_type"
								className="block text-sm font-medium text-gray-700 mb-1.5"
							>
								{t("seller.register.business_type_label", "Business type")}
								<span className="text-rose-500 ms-1" aria-hidden="true">
									*
								</span>
							</label>
							<select
								id="business_type"
								name="business_type"
								value={form.business_type}
								onChange={handleChange}
								required
								className={`${inputClass} appearance-none`}
							>
								<option value="">
									{t("common.select_option", "Select an option")}
								</option>
								<option value="individual">
									{t(
										"seller.register.business_type_individual",
										"Individual / Freelancer",
									)}
								</option>
								<option value="company">
									{t(
										"seller.register.business_type_company",
										"Registered company",
									)}
								</option>
								<option value="cooperative">
									{t(
										"seller.register.business_type_cooperative",
										"Cooperative",
									)}
								</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1.5">
								{t("seller.register.store_type_label", "What do you sell?")}
								<span className="text-rose-500 ms-1" aria-hidden="true">
									*
								</span>
							</label>
							<StoreTypePicker
								value={form.store_type_id}
								onChange={handleStoreTypeChange}
							/>
						</div>

						<div>
							<label
								htmlFor="country"
								className="block text-sm font-medium text-gray-700 mb-1.5"
							>
								{t("seller.register.country_label", "Country")}
								<span className="text-rose-500 ms-1" aria-hidden="true">
									*
								</span>
							</label>
							<select
								id="country"
								name="country"
								value={form.country}
								onChange={handleChange}
								required
								className={`${inputClass} appearance-none`}
							>
								<option value="">
									{t("common.select_option", "Select an option")}
								</option>
								{COUNTRIES.map((c) => (
									<option key={c.code} value={c.code}>
										{c.name}
									</option>
								))}
							</select>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
							<div>
								<label
									htmlFor="contact_email"
									className="block text-sm font-medium text-gray-700 mb-1.5"
								>
									{t("seller.register.contact_email_label", "Contact email")}
								</label>
								<input
									type="email"
									id="contact_email"
									name="contact_email"
									value={form.contact_email}
									onChange={handleChange}
									placeholder={t(
										"seller.register.contact_email_placeholder",
										"contact@yourbusiness.com",
									)}
									className={inputClass}
									autoComplete="email"
									dir="ltr"
								/>
							</div>

							<div>
								<label
									htmlFor="contact_phone"
									className="block text-sm font-medium text-gray-700 mb-1.5"
								>
									{t("seller.register.contact_phone_label", "Contact phone")}
								</label>
								<input
									type="tel"
									id="contact_phone"
									name="contact_phone"
									value={form.contact_phone}
									onChange={handleChange}
									placeholder="+212 6 00 00 00 00"
									className={inputClass}
									autoComplete="tel"
									dir="ltr"
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor="description"
								className="block text-sm font-medium text-gray-700 mb-1.5"
							>
								{t("seller.register.description_label", "About your store")}
								<span className="text-gray-400 font-normal text-xs ms-1">
									({t("common.optional", "optional")})
								</span>
							</label>
							<textarea
								id="description"
								name="description"
								rows={4}
								value={form.description}
								onChange={handleChange}
								placeholder={t(
									"seller.register.description_placeholder",
									"Describe your products, craftsmanship, and what makes your store unique...",
								)}
								className={`${inputClass} resize-none`}
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1.5">
								{t("seller.register.logo_label", "Store logo")}
								<span className="text-gray-400 font-normal text-xs ms-1">
									({t("common.optional", "optional")})
								</span>
							</label>
							<label
								htmlFor="logo"
								className="flex items-center gap-3 p-4 rounded-2xl ring-1 ring-dashed ring-amber-300 bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors duration-150"
							>
								<Upload
									className="w-5 h-5 text-amber-600 flex-shrink-0"
									aria-hidden="true"
								/>
								<span className="text-sm text-gray-600">
									{form.logo
										? form.logo.name
										: t("seller.register.logo_hint", "JPG or PNG, max 2 MB")}
								</span>
								<input
									type="file"
									id="logo"
									name="logo"
									accept="image/jpeg,image/png"
									className="sr-only"
									onChange={handleLogoChange}
								/>
							</label>
						</div>

						<button
							type="submit"
							disabled={isSubmitting}
							className="w-full inline-flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-full py-3 text-sm font-semibold transition-all duration-200 hover-lift disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700/50"
						>
							{isSubmitting ? (
								<>
									<svg
										className="animate-spin h-4 w-4 text-white"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
									{t("seller.register.submitting", "Submitting...")}
								</>
							) : (
								<>
									{t("seller.signup.submit_cta", "Create seller account")}
									<ArrowRight
										className="w-4 h-4 rtl:rotate-180"
										aria-hidden="true"
									/>
								</>
							)}
						</button>
					</form>

					<p className="mt-6 text-center text-sm text-gray-500">
						{t("seller.signup.have_account", "Already have an account?")}{" "}
						<Link
							href="/login?redirect=/seller/register"
							className="text-indigo-700 hover:text-indigo-900 font-medium"
						>
							{t("seller.signup.login_link", "Sign in and apply")}
						</Link>
					</p>
				</div>
			</main>
		</div>
	);
}
