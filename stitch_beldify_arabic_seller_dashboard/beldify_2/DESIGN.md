---
name: Beldify
colors:
  surface: '#fbf9f4'
  surface-dim: '#dbdad5'
  surface-bright: '#fbf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ee'
  surface-container: '#f0eee9'
  surface-container-high: '#eae8e3'
  surface-container-highest: '#e4e2dd'
  on-surface: '#1b1c19'
  on-surface-variant: '#47464f'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f1ec'
  outline: '#777680'
  outline-variant: '#c8c5d0'
  surface-tint: '#59598d'
  primary: '#252555'
  on-primary: '#ffffff'
  primary-container: '#3b3b6d'
  on-primary-container: '#a8a7e1'
  inverse-primary: '#c2c1fc'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#491e00'
  on-tertiary: '#ffffff'
  tertiary-container: '#6b2f00'
  on-tertiary-container: '#f1965e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c2c1fc'
  on-primary-fixed: '#151546'
  on-primary-fixed-variant: '#414174'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#ffdbc9'
  tertiary-fixed-dim: '#ffb68c'
  on-tertiary-fixed: '#321200'
  on-tertiary-fixed-variant: '#753401'
  background: '#fbf9f4'
  on-background: '#1b1c19'
  surface-variant: '#e4e2dd'
typography:
  display-lg:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 60px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  price-display:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style
The design system for Beldify is built upon an **Editorial Moroccan** aesthetic, blending traditional craftsmanship with contemporary digital commerce. The brand personality is sophisticated, cultural, and premium, aiming to evoke the feeling of browsing a high-end physical boutique in Marrakech through a modern lens.

The design style is **Corporate / Modern** with a strong emphasis on editorial layout. It utilizes generous whitespace, crisp typography, and high-quality photography to elevate products from simple listings to curated stories. The interface remains functional and structured, avoiding unnecessary ornamentation while maintaining a warm, welcoming atmosphere.

## Colors
The palette is rooted in the landscape and architecture of Morocco. 

- **Atlas Indigo (#3B3B6D):** The primary anchor. Used for navigation bars, header text, and primary action buttons to convey reliability and depth.
- **Saffron Amber (#F59E0B):** The vibrant accent. Reserved for high-priority CTAs, promotional badges, and signifying positive movement or value.
- **Warm Parchment (#FAF8F3):** The base canvas. This off-white background reduces eye strain and provides a more organic, premium feel than pure white.
- **Pure White (#FFFFFF):** Exclusively for cards and surface containers to create a "lifted" appearance against the parchment background.

## Typography
The system uses a clean, authoritative Arabic sans-serif (modeled after IBM Plex Arabic) to ensure maximum legibility and a modern editorial feel. 

- **RTL-First Design:** All typographic scales and alignments are optimized for Right-to-Left reading patterns.
- **Hierarchy:** High contrast in weight and size differentiates editorial storytelling from transactional data.
- **Currency Formatting:** Prices should be rendered with the Moroccan Dirham symbol (درهم) or MAD code, using the `price-display` token to highlight value without overwhelming the product description.

## Layout & Spacing
The layout follows a **Fluid Grid** model with strict RTL orientation. 

- **Desktop:** 12-column grid with 24px gutters. Use wide margins (64px+) to create the editorial "magazine" feel.
- **Mobile:** 4-column grid with 16px margins.
- **Spacing Rhythm:** Based on a 4px baseline. Use `lg` (24px) for spacing between unrelated sections and `md` (16px) for internal card padding and related elements.
- **Editorial Alignment:** Hero sections should utilize asymmetrical layouts, often bleeding images to one edge while centering text on the opposing side to create visual interest.

## Elevation & Depth
Depth in this design system is achieved through **Tonal Layers** and **Ambient Shadows**.

- **Surfaces:** The primary background is the Parchment (#FAF8F3). Content modules sit on Pure White (#FFFFFF) cards.
- **Shadows:** Use extremely soft, low-opacity shadows (Indigo-tinted) to avoid a "muddy" look. Shadows should have a large blur radius (20px+) and low vertical offset (4px-8px) to mimic soft, natural Moroccan sunlight.
- **Depth Levels:**
  - *Level 0:* Parchment Background.
  - *Level 1:* White Cards / Input Fields (rest).
  - *Level 2:* Hovered Cards / Navigation Bars.
  - *Level 3:* Modals / Dropdowns / Priority Popovers.

## Shapes
The shape language is modern and approachable. 

- **Corner Radius:** A standard 12px-16px radius is applied to all cards, buttons, and input fields. This softens the grid and aligns with the "handcrafted" nature of the products.
- **Consistency:** Use 12px for smaller interactive elements (buttons, inputs) and 16px for larger containers (cards, hero banners).
- **Images:** Product photography should always feature the same rounded corners as the containers they occupy to maintain a cohesive silhouette.

## Components
- **Buttons:** Primary buttons are Indigo with White text. Secondary buttons use an Indigo outline. Saffron Amber is reserved for "Buy Now" or critical conversion points.
- **Cards:** Pure White background with a 16px corner radius and a Level 1 shadow. In RTL, price badges and "New" tags should be pinned to the top-right corner.
- **Chips / Badges:** Used for product categories or status. Saffron Amber backgrounds for "Limited Edition" or "Trending"; light Indigo tints for neutral categories.
- **Input Fields:** 12px rounded corners with a subtle 1px Indigo-tinted border. On focus, the border thickens or intensifies in color.
- **Lists:** Clean dividers using 10% opacity Indigo. Icons should be placed on the right side of the text in RTL.
- **Product Gallery:** A featured component using large, high-resolution imagery with subtle navigation dots or arrows in the primary Indigo color.