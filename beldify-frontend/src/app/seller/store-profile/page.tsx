/**
 * /seller/store-profile — superseded by the Blade seller dashboard, which
 * owns store-profile editing since the 2026-06-29 seller-dashboard
 * consolidation. Editing the profile in two places risked divergent data.
 * /seller/register bridges an authenticated seller into the dashboard via
 * the /seller/enter SSO handoff.
 */
import { permanentRedirect } from 'next/navigation';

export default function SellerStoreProfileRedirect() {
  permanentRedirect('/seller/register');
}
