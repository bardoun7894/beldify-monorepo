import { useTranslation } from "react-i18next";

export function useLocalizedHref() {
	const { i18n } = useTranslation();

	return (href: string) => {
		const [path, existingQuery] = href.split("?");
		const params = new URLSearchParams(existingQuery || "");

		// Always include locale in query parameters
		params.set("locale", i18n.language);

		return `${path}?${params.toString()}`;
	};
}

/**
 * Validate a redirect target and return a safe internal path, or `fallback`.
 *
 * Protects against open-redirect attacks where an attacker sends a user to
 * `/login?redirect=https://evil.com`. After login, naive code would navigate
 * to the attacker-controlled URL.
 *
 * Rules (any of these fail → fallback):
 *   - must be a string
 *   - must start with `/`
 *   - must NOT start with `//` (protocol-relative URL → escapes the origin)
 *   - must NOT contain `\` (Windows-style paths → some browsers normalise)
 *   - must NOT contain control characters (newline, tab, etc.)
 *
 * Use this anywhere a `?redirect=` query param or post-login target is consumed.
 */
export function safeRedirect(
	input: string | null | undefined,
	fallback: string = "/",
): string {
	if (!input || typeof input !== "string") return fallback;
	if (!input.startsWith("/")) return fallback;
	if (input.startsWith("//")) return fallback;
	if (input.includes("\\")) return fallback;
	if (/[\x00-\x1f]/.test(input)) return fallback;
	return input;
}
