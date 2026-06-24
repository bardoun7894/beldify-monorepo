# i18n Additions — FE-5 Packet

All new string keys introduced by FE-5 use `t('key', { defaultValue: '...' })` / `t('key', 'fallback')` inline pattern.
No changes were made to `src/i18n/locales/*.json` files.
This file serves as the authoritative catalog for the keys that need to be added to locale files before translation.

## New keys (English fallbacks)

| Key | Default value (EN) | Usage |
|---|---|---|
| `auth.confirm_your_email` | `Confirm your email.` | Brand panel heading on /verify-email |
| `auth.confirm_your_email_sub` | `One click and you're all set. Your account is almost ready.` | Brand panel subtext on /verify-email |
| `auth.verifying_email` | `Verifying your email` | aria-label on spinner |
| `auth.verifying_email_title` | `Verifying your email` | H2 during verification |
| `auth.verifying_email_desc` | `Please wait a moment…` | Body during verification |
| `auth.email_verified` | `Email verified` | H2 on success state |
| `auth.email_verified_desc` | `Your email address has been confirmed. You can now access all features.` | Body on success |
| `auth.already_verified` | `Already verified` | H2 on already-verified state |
| `auth.already_verified_desc` | `Your email address is already confirmed. You are good to go.` | Body on already-verified |
| `auth.go_to_home` | `Go to homepage` | CTA on success / already-verified |
| `auth.verify_link_invalid` | `Invalid verification link` | H2 when params missing |
| `auth.verify_link_invalid_desc` | `This verification link is missing required information. Please use the link from your email.` | Body on missing-params |
| `auth.check_your_inbox` | `Check your inbox` | H2 after resend succeeds |
| `auth.link_expired_resent_desc` | `A new verification link has been sent to your inbox.` | Body after resend succeeds |
| `auth.link_expired` | `Link expired` | H2 on invalid/expired state (reused from reset-password) |
| `auth.link_expired_desc` | `This verification link is no longer valid or has expired. Request a new one below.` | Body on invalid/expired |
| `auth.resend_verification` | `Resend verification email` | CTA button when authenticated |
| `auth.sign_in_to_resend` | `Sign in to resend` | CTA link when unauthenticated |
| `auth.resending` | `Sending…` | Button loading state |
| `auth.resent` | `Resent!` | Button success state |
| `auth.verify_email_resent` | `Verification email sent! Check your inbox.` | Toast on resend success |
| `auth.rate_limit` | `Too many requests. Please wait a moment.` | Toast on 429 |
| `auth.resend_failed` | `Failed to send. Please try again.` | Toast on resend error |
| `auth.verify_email_banner` | `Please verify your email address to unlock all features.` | Profile page banner |
| `auth.resend_link` | `Resend link` | Banner resend button |
| `common.dismiss` | `Dismiss` | Banner dismiss button aria-label |
