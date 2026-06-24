# Hardcoded (untranslated) strings — i18n audit

Found **143** user-facing strings hardcoded in JSX across **17** files (bypass `t()`). 
These are the *second* class of translation bug (the first — missing keys — is now fixed).
Each needs: add key to all 5 locales + replace literal with `t(key)`.

> Note: several homepage strings are hardcoded **in French** (e.g. "Vendeurs vérifiés", "Élégance Traditionnelle") — they show French regardless of selected language.

## `app/checkout/page.tsx` (10)
| line | text | suggested key |
|---|---|---|
| 381 | Item Unavailable: This item is currently out of stock or the requested quantity … | `checkout.errors.item_unavailable` |
| 386 | Only ${stockAvailable.available_quantity} item(s) available for ${item.product.n… | `checkout.errors.insufficient_stock` |
| 430 | First name is required and must be at least 2 characters | `checkout.validation.first_name_required` |
| 434 | Last name is required and must be at least 2 characters | `checkout.validation.last_name_required` |
| 441 | Please enter a valid phone number with at least 10 digits | `checkout.validation.phone_min_digits` |
| 448 | Please select a valid payment method | `checkout.validation.payment_method_invalid` |
| 544 | Order placed. Redirecting to your orders... | `checkout.success.redirecting_orders` |
| 553 | One or more items in your cart are no longer available in the requested quantity… | `checkout.errors.cart_items_unavailable` |
| 556 | Order creation failed | `checkout.errors.order_creation_failed` |
| 1184 | Product image | `checkout.summary.product_image_alt` |

## `app/community/posts/[id]/page.tsx` (4)
| line | text | suggested key |
|---|---|---|
| 84 | Failed to fetch post | `community.error_failed_to_fetch_post` |
| 113 | Invalid post data format | `community.error_invalid_post_data` |
| 375 | - Image (suffix in alt attribute template literal) | `community.post_image_alt_suffix` |
| 396 | - Thumbnail (suffix in alt attribute template literal) | `community.post_thumbnail_alt_suffix` |

## `app/community/posts/create/page.tsx` (3)
| line | text | suggested key |
|---|---|---|
| 115 | Custom ${productName} - Similar Design Requested | `community.prefill_title` |
| 116 | I'm looking for a custom product similar to the ${productName} (Product ID: ${pr… | `community.prefill_description` |
| 537 | Preview (prefix in alt attribute template literal: `Preview ${index + 1}`) | `community.image_preview_alt` |

## `app/contact/page.tsx` (1)
| line | text | suggested key |
|---|---|---|
| 183 | +212 (0) 7 XX XX XX XX | `contact.form.phonePlaceholder` |

## `app/login/page.tsx` (5)
| line | text | suggested key |
|---|---|---|
| 98 | Failed to complete action. Please try again. | `auth.action_failed` |
| 203 | Google Sign-In is currently unavailable | `auth.google_unavailable` |
| 265 | Failed to initialize Google Sign-In | `auth.google_init_failed` |
| 280 | Google login successful! | `auth.google_login_success` |
| 301 | Login with Google failed | `auth.google_login_failed` |

## `app/orders/[orderNumber]/page.tsx` (2)
| line | text | suggested key |
|---|---|---|
| 490 | Unknown Product | `orders.items.unknown_product` |
| 503 | Unknown Product | `orders.items.unknown_product` |

## `app/orders/page.tsx` (6)
| line | text | suggested key |
|---|---|---|
| 386 | Product | `product.fallback_name` |
| 399 | Unknown Product | `product.unknown` |
| 403 | Qty | `orders.items.qty` |
| 414 | more items | `orders.items.more` |
| 428 | Shipping to | `orders.list.shipping_to` |
| 876 | Adding to cart... | `cart.adding` |

## `app/page.tsx` (40)
| line | text | suggested key |
|---|---|---|
| 125 | Authentic Moroccan craftsmanship | `home.hero.eyebrow` |
| 141 | Worn for centuries. Made for today. | `home.hero.subtitle` |
| 163 | beldi (بلدي) — local, artisan, of the country | `home.hero.etymology` |
| 167 | Caftans, djellabas, and bespoke tailoring from Morocco's finest ateliers — deliv… | `home.hero.description` |
| 177 | Shop the marketplace | `home.hero.cta_shop` |
| 185 | Meet the tailors | `home.hero.cta_tailors` |
| 193 | AI styled for you | `home.hero.ai_chip` |
| 207 | Vendeurs vérifiés | `home.trust.verified_sellers` |
| 208 | Paiements sécurisés | `home.trust.secure_payments` |
| 209 | Retours 14 jours | `home.trust.returns` |
| 210 | Support AR / FR / EN | `home.trust.support` |
| 235 | Browse the souk | `home.categories.subtitle` |
| 248 | Categories will appear here once the catalogue is live. | `home.categories.empty` |
| 342 | Élégance Traditionnelle | `home.offers.editorial_title` |
| 345 | Nos plus belles créations de prêt-à-porter marocain — caftans et djellabas de sa… | `home.offers.editorial_description` |
| 352 | Shop the collection | `home.offers.cta_shop_collection` |
| 385 | Explore now | `home.offers.cta_explore` |
| 427 | Want it tailored to you? | `home.tailoring.headline` |
| 430 | Match with a Moroccan tailor, send your measurements, and receive a fitted piece… | `home.tailoring.description` |
| 437 | Start a tailoring order | `home.tailoring.cta` |
| 445 | Pick your tailor | `home.tailoring.step1_title` |
| 445 | Browse verified ateliers across Tetouan, Fez, Casablanca. | `home.tailoring.step1_detail` |
| 446 | Send measurements | `home.tailoring.step2_title` |
| 446 | Use our guided form or upload an existing pattern. | `home.tailoring.step2_detail` |
| 447 | Receive your piece | `home.tailoring.step3_title` |
| 447 | Hand-finished and shipped to your door in 2–4 weeks. | `home.tailoring.step3_detail` |
| 476 | Curated ateliers | `home.ateliers.subtitle` |
| 483 | All ateliers | `home.ateliers.view_all` |
| 506 | Verified | `shop.verified` |
| 544 | Stories from the atelier | `home.journal.subtitle` |
| 550 | All stories | `home.journal.view_all` |
| 584 | read | `home.journal.read_time_suffix` |
| 618 | Sell your craft. | `home.seller.headline_line1` |
| 619 | Reach Morocco and beyond. | `home.seller.headline_line2` |
| 622 | Beldify gives Tetouani ateliers and independent artisans a professional storefro… | `home.seller.description` |
| 630 | Open your boutique | `home.seller.cta` |
| 635 | AI-assisted listings | `home.seller.ai_chip` |
| 646 | Typical listing range | `home.seller.stat_range_label` |
| 660 | Active sellers | `home.seller.stat_sellers_label` |
| 661 | Buyer protection | `home.seller.stat_protection_label` |

## `app/products/[id]/page.tsx` (3)
| line | text | suggested key |
|---|---|---|
| 1013 | Failed to load product | `errors.product_load_failed` |
| 1449 | Atelier Fassi | `shop.default_name` |
| 1455 | artisan made | `pdp.artisanMade` |

## `app/register/page.tsx` (8)
| line | text | suggested key |
|---|---|---|
| 127 | Registration successful! | `auth.registration_successful` |
| 132 | Registration failed | `auth.registration_failed` |
| 183 | Google Sign-In is currently unavailable | `auth.google_signin_unavailable` |
| 246 | Failed to initialize Google Sign-Up | `auth.google_signup_init_failed` |
| 265 | Registration failed | `auth.registration_failed` |
| 266 | Registration with Google failed | `auth.google_registration_failed` |
| 270 | Registration with Google failed | `auth.google_registration_failed` |
| 495 | example@mail.com | `auth.email_placeholder` |

## `app/seller/register/page.tsx` (10)
| line | text | suggested key |
|---|---|---|
| 29 | Morocco | `countries.MA` |
| 30 | Saudi Arabia | `countries.SA` |
| 31 | United Arab Emirates | `countries.AE` |
| 32 | Qatar | `countries.QA` |
| 33 | Kuwait | `countries.KW` |
| 34 | Bahrain | `countries.BH` |
| 35 | Oman | `countries.OM` |
| 36 | France | `countries.FR` |
| 37 | United Kingdom | `countries.GB` |
| 38 | United States | `countries.US` |

## `app/services/tailoring/[id]/page.tsx` (9)
| line | text | suggested key |
|---|---|---|
| 52 | Failed to load tailor data | `tailoring.profile.load_error` |
| 65 | Failed to load time slots | `tailoring.booking.slots_load_error` |
| 144 | 2-3 hours | `tailoring.services.custom_suits.duration` |
| 150 | 1 hour | `tailoring.services.alterations.duration` |
| 159 | Excellent craftsmanship! My wedding suit was perfect. | `tailoring.reviews.mock.1.comment` |
| 161 | Custom Suit | `tailoring.reviews.mock.1.service` |
| 166 | Great attention to detail. Very professional service. | `tailoring.reviews.mock.2.comment` |
| 168 | Alterations | `tailoring.reviews.mock.2.service` |
| 264 | Portfolio ${index + 1} | `tailoring.profile.portfolio_image_alt` |

## `app/services/tailoring/page.tsx` (4)
| line | text | suggested key |
|---|---|---|
| 12 | Men's traditional djellaba atelier | `tailoring.gallery.alt.0` |
| 16 | Hand-embroidered caftan detail | `tailoring.gallery.alt.1` |
| 20 | Wedding takchita in progress | `tailoring.gallery.alt.2` |
| 24 | Brocade weaving, Fez atelier | `tailoring.gallery.alt.3` |

## `app/services/tailoring/tailors/[id]/page.tsx` (10)
| line | text | suggested key |
|---|---|---|
| 51 | 1500 - 3000 MAD | `content.tailorDetail.service1Price` |
| 52 | 2-3 weeks | `content.tailorDetail.service1Duration` |
| 57 | 200 - 500 MAD | `content.tailorDetail.service2Price` |
| 58 | 2-5 days | `content.tailorDetail.service2Duration` |
| 63 | 5000+ MAD | `content.tailorDetail.service3Price` |
| 64 | 4-8 weeks | `content.tailorDetail.service3Duration` |
| 69 | 2000 - 4000 MAD | `content.tailorDetail.service4Price` |
| 70 | 3-4 weeks | `content.tailorDetail.service4Duration` |
| 557 | 9:00 - 18:00 | `content.tailorDetail.monFriHours` |
| 561 | 10:00 - 16:00 | `content.tailorDetail.satHours` |

## `app/shipping/page.tsx` (10)
| line | text | suggested key |
|---|---|---|
| 32 | How can I track my order? | `pages.shipping.faq1.question` |
| 33 | You can track your order by logging into your account and visiting the Orders se… | `pages.shipping.faq1.answer` |
| 37 | What are the shipping costs? | `pages.shipping.faq2.question` |
| 38 | Shipping costs vary based on your location and the shipping method selected. Sta… | `pages.shipping.faq2.answer` |
| 42 | Do you ship internationally? | `pages.shipping.faq3.question` |
| 43 | Yes, we ship internationally to most countries. International shipping rates sta… | `pages.shipping.faq3.answer` |
| 47 | How long will it take to receive my order? | `pages.shipping.faq4.question` |
| 48 | Delivery times depend on your location and the shipping method selected. Standar… | `pages.shipping.faq4.answer` |
| 52 | What should I do if my order hasn't arrived? | `pages.shipping.faq5.question` |
| 53 | If your order hasn't arrived within the expected delivery timeframe, please cont… | `pages.shipping.faq5.answer` |

## `app/shops/[name]/page.tsx` (14)
| line | text | suggested key |
|---|---|---|
| 41 | Morocco | `shop.city.default` |
| 53 | Contemporary Kaftans · Marrakech | `shop.staticAteliers.maisonMarrakech.subtitle` |
| 54 | Fine Leather Goods · Fez | `shop.staticAteliers.artisanDuCuir.subtitle` |
| 55 | Handcrafted Silver · Essaouira | `shop.staticAteliers.zelligeStudio.subtitle` |
| 56 | Berber Textiles · Atlas Mts | `shop.staticAteliers.atlasWeavers.subtitle` |
| 87 | The craftsmanship is breathtaking. I ordered a caftan for my wedding, and the ha… | `shop.staticReviews.0.text` |
| 93 | Incredible quality on the djellaba. The wool is soft yet structured, and the det… | `shop.staticReviews.1.text` |
| 99 | Their bespoke service was a dream. They guided me through fabric choices and mea… | `shop.staticReviews.2.text` |
| 175 | Please login to follow this shop | `shop.toast.loginToFollow` |
| 185 | Action failed | `shop.toast.actionFailed` |
| 188 | Authentication error. Please login again | `shop.toast.authError` |
| 192 | Successfully {{action}} shop | `shop.toast.followSuccess` |
| 199 | An error occurred | `shop.toast.genericError` |
| 314 | This atelier brings the finest Moroccan craftsmanship directly to you. Each piec… | `shop.description.fallback` |

## `app/terms-of-service/page.tsx` (4)
| line | text | suggested key |
|---|---|---|
| 33 | May 18, 2025 | `pages.termsOfService.lastUpdatedDate` |
| 214 | Email: legal@beldify.com | `pages.termsOfService.contactEmail` |
| 215 | Phone: +212 (0) 7 08 15 03 51 | `pages.termsOfService.contactPhone` |
| 216 | Postal Address: 123 Medina Street, Tetouan, Morocco | `pages.termsOfService.contactAddress` |
