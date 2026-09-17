"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { User } from "@/types/auth";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Pencil, Mail, Calendar, BadgeCheck, Loader2 } from "lucide-react";
import axios from "@/lib/axios";
import toast from "@/utils/toast";
import logger from "@/utils/consoleLogger";

interface ProfileHeaderProps {
	user: User;
	onAvatarUpdated?: (imageUrl: string) => void;
}

export default function ProfileHeader({ user, onAvatarUpdated }: ProfileHeaderProps) {
	const { t } = useTranslation(["profile", "common"]);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

	const getInitial = (name: string | undefined | null) => {
		if (!name) return "U";
		return name.charAt(0).toUpperCase();
	};

	const joinYear = user?.created_at
		? new Date(user.created_at).getFullYear()
		: null;

	const handleAvatarClick = () => {
		if (isUploading) return;
		fileInputRef.current?.click();
	};

	const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setAvatarPreview(URL.createObjectURL(file));
		setIsUploading(true);

		try {
			const formData = new FormData();
			formData.append("avatar", file);

			const response = await axios.post("/api/auth/profile/avatar", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			const newImageUrl = response.data?.data?.image_url || response.data?.image_url;
			if (newImageUrl) {
				onAvatarUpdated?.(newImageUrl);
			}
			toast.success(t("profile.avatar_updated", "Avatar updated"));
		} catch (error: any) {
			logger.error("Avatar upload failed:", error);
			toast.error(
				error.response?.data?.message || t("profile.avatar_update_failed", "Failed to update avatar")
			);
			setAvatarPreview(null);
		} finally {
			setIsUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	return (
		<div className="relative overflow-hidden rounded-2xl bg-indigo-950">
			{/* Subtle Moroccan-geometry overlay — colour driven by the amber-500 token via
          currentColor (text-amber-500), so it tracks the palette instead of a literal hex */}
			<div
				className="absolute inset-0 text-amber-500 opacity-[0.04]"
				style={{
					backgroundImage:
						"repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)",
					backgroundSize: "24px 24px",
				}}
				aria-hidden="true"
			/>

			{/* Ambient glow — amber top-start, indigo bottom-end */}
			<div
				className="pointer-events-none absolute -top-16 -start-16 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl"
				aria-hidden="true"
			/>
			<div
				className="pointer-events-none absolute -bottom-16 -end-16 h-48 w-48 rounded-full bg-indigo-400/10 blur-3xl"
				aria-hidden="true"
			/>

			<div className="relative z-10 px-6 py-8 sm:px-8">
				<div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end sm:gap-7">
					{/* Avatar */}
					<motion.div
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ duration: 0.45, type: "spring" }}
						className="relative shrink-0"
					>
						{/* Amber ring halo */}
						<div
							className="absolute -inset-1 rounded-full bg-amber-500/40 blur-sm"
							aria-hidden="true"
						/>
						<div className="relative h-24 w-24 rounded-full overflow-hidden ring-2 ring-amber-400 shadow-atlas-lg">
							{avatarPreview || user?.image ? (
								<Image
									src={avatarPreview || user.image}
									alt={user.full_name_en || t("default_user_name")}
									fill
									className="object-cover"
									sizes="96px"
									priority
									unoptimized={!!avatarPreview}
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center bg-indigo-800 text-white text-3xl font-bold">
									{getInitial(user?.full_name_en)}
								</div>
							)}
							{isUploading && (
								<div className="absolute inset-0 flex items-center justify-center bg-indigo-950/50">
									<Loader2 className="h-6 w-6 animate-spin text-white" aria-hidden="true" />
								</div>
							)}
						</div>

						{/* Hidden file input — driven by the edit button */}
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							className="hidden"
							onChange={handleAvatarChange}
							aria-hidden="true"
							tabIndex={-1}
						/>

						{/* Edit button — end-0 so RTL-safe */}
						<button
							type="button"
							onClick={handleAvatarClick}
							disabled={isUploading}
							className="absolute -bottom-1 end-0 flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-white text-indigo-700 shadow-atlas-sm hover:-translate-y-0.5 hover:bg-amber-50 hover:shadow-atlas-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 disabled:opacity-60 disabled:pointer-events-none"
							aria-label={t("profile.edit_avatar", "Edit avatar")}
						>
							{isUploading ? (
								<Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
							) : (
								<Pencil className="h-3.5 w-3.5" aria-hidden="true" />
							)}
						</button>
					</motion.div>

					{/* User info */}
					<motion.div
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1, duration: 0.4 }}
						className="flex-1 text-center sm:text-start"
					>
						<h1
							className="text-2xl font-bold text-white tracking-tight sm:text-3xl"
							style={{
								fontFamily: '"Playfair Display", ui-serif, Georgia, serif',
							}}
						>
							{user?.full_name_en || t("default_user_name")}
						</h1>

						<div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:justify-start">
							<span className="flex items-center gap-1.5 text-sm text-indigo-200">
								<Mail
									className="h-3.5 w-3.5 text-amber-400"
									aria-hidden="true"
								/>
								{user?.email || t("no_email")}
							</span>
							{joinYear && (
								<span className="flex items-center gap-1.5 text-sm text-indigo-200">
									<Calendar
										className="h-3.5 w-3.5 text-amber-400"
										aria-hidden="true"
									/>
									{t("member_since")} {joinYear}
								</span>
							)}
						</div>
					</motion.div>

					{/* VIP badge — legacy sellers (user_type_id=2) or dual-role sellers (is_seller) */}
					{(user?.user_type_id === 2 || user?.is_seller === true) && (
						<motion.span
							initial={{ scale: 0.85, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ delay: 0.25 }}
							className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-200 ring-1 ring-amber-400/30"
						>
							<BadgeCheck
								className="h-3.5 w-3.5 text-amber-400"
								aria-hidden="true"
							/>
							{t("roles.vip")}
						</motion.span>
					)}
				</div>
			</div>
		</div>
	);
}
