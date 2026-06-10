'use client';

/**
 * BrandHeroSlide — legacy shim.
 *
 * The original photo hero (dark atelier photograph + Darija statement) has been
 * replaced by CampaignArtSlides. This file is kept so that any residual imports
 * of BrandHeroSlide compile without error. It re-exports ArtSlide slide=1 as a
 * sensible fallback in campaign mode (for direct slot 0 use by HeroSection).
 *
 * Do NOT restore the photo hero here. For design changes, edit CampaignArtSlides.
 */
export { ArtSlide as default } from './CampaignArtSlides';
