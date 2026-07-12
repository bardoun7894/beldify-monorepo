import { useTranslation } from "react-i18next";
import { useSearchParams } from "next/navigation";

export function useLanguage() {
	// Note: useTranslation is kept for future use; i18n is read indirectly
	// via the live URL `?locale=` param below.
	useTranslation();
	const searchParams = useSearchParams();
	const locale = searchParams?.get("locale") || "en";

	const dir = locale === "ar" || locale === "ma" ? "rtl" : "ltr";
	const language = locale;

	return {
		dir,
		language,
		locale,
		isRTL: dir === "rtl",
		currentLanguage: locale, // Added for compatibility with traditional wear components
	};
}
