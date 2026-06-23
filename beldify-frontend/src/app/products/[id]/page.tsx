'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ReviewsSection from '@/components/reviews/ReviewsSection';
import RelatedProducts from '@/components/products/RelatedProducts';
import ShareButton from '@/components/share/ShareButton';
import NotifyMeButton from '@/components/products/NotifyMeButton';
import { productService } from '@/services/api';
import { Product } from '@/lib/types';
import { partitionShelves } from './partitionShelves';
import { useDirection } from '@/hooks/useDirection';
import { formatPrice } from '@/utils/formatters';
import { getColorName, useLazyColorName } from '@/utils/colorNamer';
import { buildImageUrl, cn } from '@/lib/utils';
import { getImageUrl } from '@/utils/imageUtils';
import logger from '@/utils/consoleLogger';
import { addRecentlyViewed } from '@/utils/recentlyViewed';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import {
  BadgeCheck,
  Heart,
  ShoppingBag,
  Star,
  Truck,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
  Plus,
  Minus,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { PdpBuyBar } from '@/components/products/PdpBuyBar';
import { HowToBuySheet } from '@/components/products/HowToBuySheet';
import { AiReviewSummaryCard } from '@/components/buyer-ai/AiReviewSummaryCard';
import { SizeAdvisorSheet } from '@/components/buyer-ai/SizeAdvisorSheet';
import { getReviewSummary, type ReviewSummaryAI } from '@/services/buyerAiService';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import toast from '@/utils/toast';
import JewelryFields from '@/components/products/JewelryFields';
import { isJewelryProduct, hasRingSizes } from './verticalDetection';
import { TryOnButton } from '@/components/buyer-ai/TryOnButton';
import { TryOnModal } from '@/components/buyer-ai/TryOnModal';
import { fetchTryonConfig, type TryonConfig } from '@/services/tryonService';
import { track } from '@/lib/analytics';

interface ProductImage {
  id: string;
  url: string;
  is_primary?: boolean;
  is_group_primary?: boolean;
  color_group?: string;
  color_hex?: string;
  sort_order?: number;
}

interface VariantSize {
  id: number;
  name: string;
  name_ar: string;
  code: string;
}

interface VariantColor {
  id: number;
  name: string;
  name_ar: string;
  hex_code: string;
}

interface VariantFabric {
  id: number;
  name: string;
  name_ar: string;
  code: string;
  description: string;
  description_ar: string;
}

interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  is_default: boolean;
  size: VariantSize | null;
  color: VariantColor | null;
  fabric: VariantFabric | null;
  attributes: Record<string, any >;
  images: ProductImage[];
}
interface ProductDetails {
  id: string;
  name: string;
  name_ar?: string;
  description: string;
  price: number;
  /** Hybrid-stock object for variant-less products (new backend contract).
   *  quantity: null = made-to-order (unlimited production, always purchasable).
   *  Legacy scalar `quantity` field kept for backward compatibility only. */
  stock?: {
    id: string;
    quantity: number | null;
    in_stock: boolean;
    made_to_order: boolean;
  } | null;
  quantity?: number | string; // Legacy field for backward compatibility
  main_image?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  stock_id?: number;
  store_id?: number;
  category?: string;
  category_ar?: string;
  /** Vertical slug set by the backend (e.g. "jewelry", "womenswear", "menswear") */
  vertical?: string | null;
  /** Category slug for vertical detection (e.g. "jewelry") */
  category_slug?: string | null;
  /** Jewelry/vertical spec fields stored in customization_options */
  customization_options?: Record<string, string | number | null> | null;
  has_discount?: boolean;
  discount_price?: number;
  rating?: number;
  reviews_count?: number;
  shop?: {
    id?: string;
    name?: string;
    logo?: string;
    location?: string;
    products_count?: number;
    url_name?: string;
    website?: string;
  };
}

interface ApiResponse {
  product: ProductDetails;
}

// Color name display component with lazy loading
interface ColorNameDisplayProps {
  hexCode: string;
  fallbackName: string;
}

const ColorNameDisplay = ({ hexCode, fallbackName }: ColorNameDisplayProps) => {
  const { colorName, isLoading, loadColorName } = useLazyColorName(hexCode);
  
  // Trigger color name loading on hover
  const handleMouseEnter = () => {
    loadColorName();
  };
  
  return (
    <div className="font-medium" onMouseEnter={handleMouseEnter}>
      {isLoading ? fallbackName : (colorName || fallbackName)}
    </div>
  );
};

export default function ProductDetailsPage() {
  const params = useParams();
  const id = params ? params.id as string : null;
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isPurchaseLoading, setIsPurchaseLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<VariantColor | null>(null);
  const [selectedSize, setSelectedSize] = useState<VariantSize | null>(null);
  const [selectedFabric, setSelectedFabric] = useState<VariantFabric | null>(null);
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);
  // Fetched once; partitioned between "Complete the look" (first 4) and
  // "You might also like" (next 4) so the two shelves show distinct items.
  const [allRelatedProducts, setAllRelatedProducts] = useState<Product[]>([]);

  // State for active main image index in the simple gallery
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'sizing' | 'reviews'>('description');
  // Click-to-zoom lightbox state
  const [isZoomed, setIsZoomed] = useState(false);
  // "كيفاش نشري؟" how-to-buy sheet
  const [isHowToBuyOpen, setIsHowToBuyOpen] = useState(false);
  // Virtual try-on modal
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [tryOnHidden, setTryOnHidden] = useState(false);
  // Shared try-on config — fetched once, passed to both button and modal so
  // paid mode (sign-in gate, wallet, top-up) activates correctly
  const [tryonConfig, setTryonConfig] = useState<TryonConfig | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchTryonConfig()
      .then((cfg) => {
        if (!cancelled) setTryonConfig(cfg);
      })
      .catch(() => {
        if (!cancelled) setTryOnHidden(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  // AI review summary — loaded either on product fetch (when reviews_count >= 3)
  // or lazily when the Reviews tab first becomes active.
  const [aiReviewSummary, setAiReviewSummary] = useState<ReviewSummaryAI | null>(null);
  const aiReviewFetchedRef = React.useRef(false);
  // Race-guard refs for PDP fetches — rapid PDP→PDP nav can otherwise let a
  // stale getProduct/getRelatedProducts response overwrite the new product's
  // state. Each fetch captures its token and discards results if it changes.
  const productFetchTokenRef = React.useRef(0);
  const relatedFetchTokenRef = React.useRef(0);
  const { addItem } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { t, i18n } = useTranslation();
  const { isRTL } = useDirection();
  const router = useRouter();

  // Transform image URLs to fetch from the correct source
  const transformImageUrl = (imageUrl: string) => {
    return getImageUrl(imageUrl);
  };

  // Get all images for a specific color group
  const getImagesForColorGroup = (colorGroup: string | null) => {
    if (!product || !colorGroup) return [];

    // Filter images by the selected color group
    const colorImages = product.images.filter((img: ProductImage) => 
      img.color_group === colorGroup
    );

    // If we found images for this color group, return them
    if (colorImages.length > 0) {
      return colorImages.sort((a: ProductImage, b: ProductImage) => {
        // Sort by group primary first
        if (a.is_group_primary && !b.is_group_primary) return -1;
        if (!a.is_group_primary && b.is_group_primary) return 1;
        // Then by regular primary
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        // Then by sort order
        return (a.sort_order || 0) - (b.sort_order || 0);
      });
    }

    return [];
  };
  
  // Get all images for a specific color hex
  const getImagesForColor = (colorHex: string | null) => {
    if (!product || !colorHex) return [];

    // First, find what color group this hex belongs to
    const image = product.images.find((img: ProductImage) => img.color_hex === colorHex);
    if (image && image.color_group) {
      // If we found a color group, get all images in that group
      return getImagesForColorGroup(image.color_group);
    }

    // Fallback: filter images by the exact color hex
    const colorImages = product.images.filter((img: ProductImage) => 
      img.color_hex === colorHex
    );

    return colorImages.sort((a: ProductImage, b: ProductImage) => {
      // Sort by group primary first
      if (a.is_group_primary && !b.is_group_primary) return -1;
      if (!a.is_group_primary && b.is_group_primary) return 1;
      // Then by regular primary
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      // Then by sort order
      return (a.sort_order || 0) - (b.sort_order || 0);
    });
  };

  // Enhanced stock checking utility functions
  const isOutOfStock = (variant: ProductVariant | null): boolean => {
    if (!variant) return true;

    // Handle various data types and edge cases
    const qty = variant.quantity;

    // Log for debugging
    logger.log('Stock check for variant:', {
      variantId: variant.id,
      quantity: qty,
      quantityType: typeof qty,
      isNull: qty === null,
      isUndefined: qty === undefined,
      isZero: qty === 0,
      isFalsy: !qty
    });

    // Check for all possible falsy/zero values
    if (qty === null || qty === undefined) return true;
    if (qty <= 0) return true;

    return false;
  };

  const isValidQuantityForVariant = (variant: ProductVariant | null, requestedQty: number): boolean => {
    if (!variant || isOutOfStock(variant)) return false;

    const availableQty = typeof variant.quantity === 'string' ?
      parseInt(variant.quantity) : variant.quantity;

    return requestedQty <= availableQty;
  };

  const shouldDisableButton = (): boolean => {
    // For products with variants, we need a selected variant
    if (product?.variants && product.variants.length > 0) {
      if (!selectedVariant) {
        logger.log('Button disabled: No variant selected');
        return true;
      }

      if (isOutOfStock(selectedVariant)) {
        logger.log('Button disabled: Variant out of stock');
        return true;
      }

      if (!isValidQuantityForVariant(selectedVariant, quantity)) {
        logger.log('Button disabled: Quantity exceeds stock');
        return true;
      }
    } else if (product) {
      // For products WITHOUT variants, use the hybrid-stock object (new backend contract)
      if (product.stock) {
        // New stock object path: use in_stock flag directly
        if (product.stock.in_stock === false) {
          logger.log('Button disabled: product.stock.in_stock is false');
          return true;
        }
        // made_to_order and in_stock === true → always purchasable (null quantity = unlimited)
        // If quantity is a finite number, check it covers the requested amount
        if (
          product.stock.quantity !== null &&
          typeof product.stock.quantity === 'number' &&
          quantity > product.stock.quantity
        ) {
          logger.log('Button disabled: Requested quantity exceeds main product stock');
          return true;
        }
      } else {
        // Legacy fallback: no stock object — use quantity field
        const legacyStock = product.quantity;
        const legacyNum = typeof legacyStock === 'string' ? parseInt(legacyStock) : legacyStock;
        if (!legacyNum || legacyNum <= 0) {
          logger.log('Button disabled: Legacy stock unavailable');
          return true;
        }
      }
    }

    return false;
  };

  // Get all available images for thumbnails
  const getAllImages = () => {
    if (!product) return [];
    
    // If a color is selected, show only images for that color's group
    if (selectedColor && product.images.some((img: ProductImage) => img.color_hex === selectedColor.hex_code)) {
      return getImagesForColor(selectedColor.hex_code);
    }
    
    // Extract unique color groups and their primary images
    const colorGroups = new Map<string, ProductImage[]>();
    
    // Group images by color_group
    if (product.images && product.images.length > 0) {
      // First pass: group all images by color_group
      product.images.forEach((image: ProductImage) => {
        if (image.url && image.color_group) {
          if (!colorGroups.has(image.color_group)) {
            colorGroups.set(image.color_group, []);
          }
          colorGroups.get(image.color_group)?.push(image);
        }
      });
      
      // If we have color groups, return a representative image from each group
      // plus any images without color_group
      if (colorGroups.size > 0) {
        const result: ProductImage[] = [];
        
        // Add one representative image from each color group
        colorGroups.forEach((images, colorGroup) => {
          // Prefer group primary image
          const primaryImage = images.find(img => img.is_group_primary) || 
                              images.find(img => img.is_primary) || 
                              images[0];
          if (primaryImage) {
            result.push(primaryImage);
          }
        });
        
        // Add images without color information
        product.images
          .filter((img: ProductImage) => img.url && !img.color_group)
          .forEach((img: ProductImage) => result.push(img));
          
        return result;
      }
    }
    
    // Fallback: return all valid images if no color grouping is possible
    return product.images.filter((img: ProductImage) => img.url);
  };

  // Get current image URL to display in main view
  // This now prioritizes selectedImage state, which is updated by handleColorSelection
  const getCurrentImageUrl = () => {
    if (selectedImage && selectedImage.url) {
      return buildImageUrl(selectedImage.url);
    }
    // Fallback logic if no selectedImage (e.g., initial load)
    if (product) {
      // Try to use main_image if available
      if (product.main_image) {
        return buildImageUrl(product.main_image);
      }
      
      const defaultVariant = product.variants?.find(v => v.is_default && v.images?.length > 0);
      if (defaultVariant?.images) {
        const primaryImage = defaultVariant.images.find((img: ProductImage) => img.is_primary && img.url);
        if (primaryImage) {
          return buildImageUrl(primaryImage.url);
        }
        // Find first image with non-null URL
        const firstValidImage = defaultVariant.images.find((img: ProductImage) => img.url);
        if (firstValidImage) {
          return buildImageUrl(firstValidImage.url);
        }
      }
      // Fallback to first product image if no default variant image
      if (product.images?.length > 0) {
        const primaryProductImage = product.images.find((img: ProductImage) => img.is_primary && img.url);
        if (primaryProductImage) {
          return buildImageUrl(primaryProductImage.url);
        }
        // Find first image with non-null URL
        const firstValidImage = product.images.find((img: ProductImage) => img.url);
        if (firstValidImage) {
          return buildImageUrl(firstValidImage.url);
        }
      }
    }
    return '/placeholder-product.svg'; // Ultimate fallback
  };

  // Enhanced variant selection logic with debugging
  const updateSelectedVariant = useCallback(() => {
    if (!product) {
      setSelectedVariant(null);
      return;
    }

    const matchingVariant = product.variants.find((variant: ProductVariant | null) => {
      if (!variant) return false;
      const colorMatch = !selectedColor || variant.color?.id === selectedColor?.id;
      const sizeMatch = !selectedSize || variant.size?.id === selectedSize?.id;
      const fabricMatch = !selectedFabric || variant.fabric?.id === selectedFabric?.id;

      return colorMatch && sizeMatch && fabricMatch;
    });

    if (matchingVariant) {
      // Debug logging for stock information
      logger.log('Selected variant details:', {
        id: matchingVariant.id,
        sku: matchingVariant.sku,
        quantity: matchingVariant.quantity,
        quantityType: typeof matchingVariant.quantity,
        price: matchingVariant.price,
        color: matchingVariant.color?.name,
        size: matchingVariant.size?.name,
        fabric: matchingVariant.fabric?.name
      });

      setSelectedVariant(matchingVariant);

      // Update images if the variant has its own images
      if (matchingVariant.images?.length > 0) {
        const primaryImage = matchingVariant.images.find(img => img.is_primary);
        if (primaryImage) {
          setSelectedImage(primaryImage);
        } else if (matchingVariant.images.length > 0) {
          setSelectedImage(matchingVariant.images[0]);
        }
      }
    } else {
      logger.log('No matching variant found for selection:', {
        selectedColor: selectedColor?.name,
        selectedSize: selectedSize?.name,
        selectedFabric: selectedFabric?.name,
        availableVariants: product.variants.length
      });
      setSelectedVariant(null);
    }
  }, [product, selectedColor, selectedSize, selectedFabric]);

  // Enhanced color selection handler that uses the color_hex data from images
  const handleColorSelection = (color: VariantColor | null) => {
    setSelectedColor(color);

    if (color) {
      // Get all images for this color
      const colorImages = getImagesForColor(color.hex_code);
      
      if (colorImages.length > 0) {
        // Set the selected image to the primary image for this color
        setSelectedImage(colorImages[0]);
      } else {
        // If no images found for this color, try to find a variant with this color
        const variantWithColor = product?.variants.find(
          (v: ProductVariant) => v.color?.id === color.id
        );

        if (variantWithColor?.images?.length) {
          // Set selectedImage to the primary image of that variant
          const validVariantImage = variantWithColor.images.find((img: ProductImage) => img.url);
          setSelectedImage(validVariantImage || null);
        } else {
          // Fallback: If no variant image for this color, use default image
          const defaultImage = product?.images?.find((img: ProductImage) => img.is_primary && img.url);
          setSelectedImage(defaultImage || null);
        }
      }

      // Find variants with this color
      if (product) {
        const variantsWithColor = product.variants.filter(
          (v: ProductVariant) => v.color && v.color.id === color.id
        );

        // Get available sizes for this color
        const availableSizes = Array.from(new Set(
          variantsWithColor
            .map((v: ProductVariant) => v.size)
            .filter((size): size is VariantSize => size !== null)
        ));

        // If we have available sizes, select the first one
        if (availableSizes.length > 0) {
          setSelectedSize(availableSizes[0]);
          
          // Find the matching variant with the selected color and first available size
          const matchingVariant = variantsWithColor.find(
            (v: ProductVariant) => v.size && v.size.id === availableSizes[0].id
          );

          // If we found a matching variant, set its fabric too
          if (matchingVariant && matchingVariant.fabric) {
            setSelectedFabric(matchingVariant.fabric);
          } else {
            setSelectedFabric(null);
          }
          
          // Set this as the selected variant (which will update price, etc.)
          setSelectedVariant(matchingVariant || null);
        } else {
          // If no sizes available for this color, reset these values
          setSelectedSize(null);
          setSelectedFabric(null);
          setSelectedVariant(null);
        }
      }
    } else {
      // If no color selected, use the primary product image
      const primaryImage = product?.images?.find((img: ProductImage) => img.is_primary && img.url);
      setSelectedImage(primaryImage || null);
      
      // Reset other selections
      setSelectedSize(null);
      setSelectedFabric(null);
      setSelectedVariant(null);
    }
  };

  // Improved size selection handler with null checks
  const handleSizeSelection = (size: VariantSize | null) => {
    if (!size) {
      setSelectedSize(null);
      setSelectedVariant(null);
      return;
    }

    setSelectedSize(size);

    // Find available variants with current color and selected size
    if (selectedColor && product) {
      const matchingVariants = product.variants.filter((v: ProductVariant) =>
        v.color !== null && selectedColor !== null && v.color.id === selectedColor.id
      );

      if (matchingVariants.length > 0) {
        // Get available fabrics for this color and size combination
        const availableFabrics = Array.from(new Set(
          matchingVariants
            .map((v: ProductVariant) => v.fabric)
            .filter((fabric): fabric is VariantFabric => fabric !== null)
        ));

        // If there are multiple fabric options, select the first one
        if (availableFabrics.length > 0) {
          setSelectedFabric(availableFabrics[0]);

          // Find the matching variant with the selected color, size and first available fabric
          const matchingVariant = matchingVariants.find(
            (v: ProductVariant) => 
              v.fabric && v.fabric.id === availableFabrics[0].id
          );
          
          // Set this as the selected variant (which will update price, etc.)
          setSelectedVariant(matchingVariant || matchingVariants[0]);
        } else {
          // If no fabric options, just use the first matching variant
          setSelectedFabric(null);
          setSelectedVariant(matchingVariants[0]);
        }
      } else {
        // If no matching variants, reset fabric and variant
        setSelectedFabric(null);
        setSelectedVariant(null);
      }
    } else {
      // If no color selected, find variants with just this size
      if (product) {
        const sizeVariants = product.variants.filter((v: ProductVariant) =>
          v.size?.id === size.id
        );

        if (sizeVariants.length > 0) {
          // Select the first variant for this size
          setSelectedVariant(sizeVariants[0]);
          setSelectedColor(sizeVariants[0].color);
          setSelectedFabric(sizeVariants[0].fabric);
        } else {
          updateSelectedVariant();
        }
      }
    }
  };

  // Improved fabric selection handler with null checks
  const handleFabricSelection = (fabric: VariantFabric | null) => {
    if (!fabric) {
      setSelectedFabric(null);
      updateSelectedVariant();
      return;
    }

    setSelectedFabric(fabric);
    updateSelectedVariant();
  };

  // Effect to update variant when selections change and get relevant images
  useEffect(() => {
    // Only call updateSelectedVariant for fabric changes or when no variant is selected
    // This avoids overriding the direct variant setting done in color/size handlers
    if (selectedFabric || !selectedVariant) {
      updateSelectedVariant();
    }

    // Log selection state for debugging
    logger.log('Selection state:', {
      color: selectedColor?.name || 'None',
      colorHex: selectedColor?.hex_code || 'None',
      size: selectedSize?.name || 'None',
      fabric: selectedFabric?.name || 'None',
      hasVariant: !!selectedVariant,
      variantId: selectedVariant?.id,
      price: selectedVariant?.price || product?.price
    });
    // price/variant snapshot is intentionally driven by the selection keys only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColor, selectedSize, selectedFabric, updateSelectedVariant]);

  // Effect to set initial variant and display related images
  useEffect(() => {
    if (product && product.variants.length > 0) {
      const defaultVariant = product.variants.find(v => v.is_default);
      if (defaultVariant) {
        setSelectedColor(defaultVariant.color);
        setSelectedSize(defaultVariant.size);
        setSelectedFabric(defaultVariant.fabric);
        setSelectedVariant(defaultVariant);

        // If the variant has a color, get all images for that color group
        if (defaultVariant.color?.hex_code) {
          const colorImages = getImagesForColor(defaultVariant.color.hex_code);
          if (colorImages.length > 0) {
            // Find the primary image for this color group
            const primaryImage = colorImages.find(img => img.is_group_primary) || 
                                colorImages.find(img => img.is_primary) || 
                                colorImages[0];
            setSelectedImage(primaryImage);
          } else if (defaultVariant.images?.length > 0) {
            // Fallback to variant images if no color group images found
            const primaryImage = defaultVariant.images.find((img: ProductImage) => img.is_primary && img.url);
            const firstValidImage = defaultVariant.images.find((img: ProductImage) => img.url);
            if (primaryImage) {
              setSelectedImage(primaryImage);
            } else if (firstValidImage) {
              setSelectedImage(firstValidImage);
            }
          }
        } else if (defaultVariant.images?.length > 0) {
          // If no color but variant has images, use those
          const primaryImage = defaultVariant.images.find((img: ProductImage) => img.is_primary && img.url);
          const firstValidImage = defaultVariant.images.find((img: ProductImage) => img.url);
          if (primaryImage) {
            setSelectedImage(primaryImage);
          } else if (firstValidImage) {
            setSelectedImage(firstValidImage);
          }
        }
      } else {
        // If no default variant, use the first one
        const firstVariant = product.variants[0];
        setSelectedColor(firstVariant.color);
        setSelectedSize(firstVariant.size);
        setSelectedFabric(firstVariant.fabric);
        setSelectedVariant(firstVariant);
        
        // Try to find color group images for this variant
        if (firstVariant.color?.hex_code) {
          const colorImages = getImagesForColor(firstVariant.color.hex_code);
          if (colorImages.length > 0) {
            setSelectedImage(colorImages[0]);
          }
        }
      }
      
      // If no image was set, try using main_image
      if (!selectedImage && product.main_image) {
        setSelectedImage({
          id: 'main-image',
          url: product.main_image,
          is_primary: true,
          sort_order: 0
        });
      }
    }
    // initial variant/images are derived once per product load by design
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  // Type predicate to help TypeScript understand filtered values
  const isNotNull = <T,>(value: T | null | undefined): value is T => {
    return value !== null && value !== undefined;
  };

  // Helper function to get available options based on current selection with strict null checks
  const getAvailableOptions = useCallback(() => {
    if (!product) return { colors: [], sizes: [], fabrics: [] };

    // Always show all available colors from all variants
    const colors = Array.from(new Set(
      product.variants
        .map((v: ProductVariant) => v.color)
        .filter((color): color is VariantColor => color !== null)
    ));
    
    // For sizes: filter based on selected color
    let sizeFilteredVariants = product.variants;
    if (selectedColor) {
      sizeFilteredVariants = product.variants.filter(v =>
        v.color !== null && selectedColor !== null && v.color.id === selectedColor.id
      );
    }
    
    const sizes = Array.from(new Set(
      sizeFilteredVariants
        .map((v: ProductVariant) => v.size)
        .filter((size): size is VariantSize => size !== null)
    ));
    
    // For fabrics: filter based on selected color and size
    let fabricFilteredVariants = product.variants;
    if (selectedColor) {
      fabricFilteredVariants = fabricFilteredVariants.filter(v =>
        v.color !== null && selectedColor !== null && v.color.id === selectedColor.id
      );
    }
    
    if (selectedSize) {
      fabricFilteredVariants = fabricFilteredVariants.filter(v =>
        v.size !== null && selectedSize !== null && v.size.id === selectedSize.id
      );
    }
    
    const fabrics = Array.from(new Set(
      fabricFilteredVariants
        .map((v: ProductVariant) => v.fabric)
        .filter((fabric): fabric is VariantFabric => fabric !== null)
    ));
    
    return { colors, sizes, fabrics }; 
    // selectedFabric kept for parity with sibling selectors; memo is cheap
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, selectedColor, selectedSize, selectedFabric]);

  // Use the available options in your render
  const { colors, sizes, fabrics } = getAvailableOptions();

  // Chat / custom-request handlers removed — not in current design scope.

  // Function to handle adding to cart
  const handleAddToCart = async () => {
    // CARTDBG: trace which branch handleAddToCart takes and the resolved IDs.
    if (typeof window !== 'undefined') {
      const hasVariants = (product?.variants?.length ?? 0) > 0;
      const resolvedStockId = product?.stock?.id ?? product?.stock_id ?? product?.id;
      console.warn(
        `[CARTDBG] handleAddToCart entry | hasVariants=${hasVariants}` +
        ` | selectedVariant=${selectedVariant?.id ?? 'none'}` +
        ` | resolvedStockId=${resolvedStockId} | quantity=${quantity}`
      );
    }

    // Guests can add to cart and check out via the guest cart (X-Guest-Token) —
    // no login required. Do not gate add-to-cart behind authentication; the
    // downstream addItem/cart logic works identically for guests and members.

    // Early exit if button should be disabled
    if (product?.variants && product.variants.length > 0) {
      if (!selectedVariant || 
          selectedVariant.quantity === 0 || 
          selectedVariant.quantity === null || 
          selectedVariant.quantity === undefined ||
          quantity > selectedVariant.quantity) {
        logger.log('Add to cart blocked: insufficient stock', { 
          selectedVariant: selectedVariant?.quantity, 
          quantity 
        });
        toast.error(t('stock.out_of_stock'));
        return; // Don't execute if conditions aren't met
      }
    }
    
    // Additional safety check for out of stock - check all falsy values
    if (selectedVariant && (!selectedVariant.quantity || selectedVariant.quantity <= 0)) {
      logger.log('Add to cart blocked: variant out of stock');
      toast.error(t('stock.out_of_stock'));
      return;
    }
    
    // Input validation
    if (!selectedVariant && product && product.variants.length > 0) {
      toast.debug('Attempted to add product without selecting a variant');
      toast.error(t('errors.selectAllOptions'));
      return;
    }
    
    // Check stock availability
    if (selectedVariant && selectedVariant.quantity && selectedVariant.quantity < quantity) {
      toast.debug(`Quantity (${quantity}) exceeds available stock (${selectedVariant.quantity})`);
      toast.error(t('stock.exceeded'));
      return;
    }
    
    if (selectedVariant && selectedVariant.quantity === 0) {
      toast.debug('Attempted to add out-of-stock variant to cart');
      toast.error(t('stock.out_of_stock'));
      return;
    }
    
    // More validation
    if (product && !selectedColor && product.variants.length > 0) {
      toast.debug('Attempted to add product without selecting a color');
      toast.error(t('errors.variantNotAvailable'));
      return;
    }
    
    if (product && !selectedSize && product.variants.length > 0) {
      toast.debug('Attempted to add product without selecting a size');
      toast.error(t('errors.variantNotAvailable'));
      return;
    }

    try {
      // ── Variant-less path (hybrid-stock backend contract) ──────────────────
      // When a product has no variants, resolve the stock_id with the same
      // precedence as handlePurchaseNow: product.stock.id → product.stock_id →
      // product.id. The catalog serves flat stocks-table rows whose own id IS
      // the stock_id (see KB beldify-catalog-stocks-table), so falling back to
      // product.id is required — without it, add-to-cart silently no-ops for
      // variant-less products that have no nested `stock` object.
      if (product && product.variants.length === 0) {
        const stockId = Number(product.stock?.id ?? product.stock_id ?? product.id);
        const loadingToast = toast.loading('Adding to cart...');
        try {
          await addItem(stockId, quantity, 'stock');
        } catch (error) {
          logger.error('Variant-less cart error:', {
            stockId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          throw error;
        }
        toast.dismiss(loadingToast);
        toast.success(t('success.addedToCart'), { icon: '🛒', duration: 3000 });
        // Analytics: add_to_cart (variant-less path)
        track({
          event: 'add_to_cart',
          currency: 'MAD',
          value: (product.price || 0) * quantity,
          items: [
            {
              item_id: String(stockId),
              item_name: product.name,
              item_category: product.category || '',
              price: product.price || 0,
              quantity,
            },
          ],
        });
        setQuantity(1);
        return;
      }

      // ── Variant path ───────────────────────────────────────────────────────
      // Enhanced checks to ensure selectedVariant is valid
      if (!selectedVariant || typeof selectedVariant.id !== 'string') {
        logger.error('Invalid selectedVariant:', selectedVariant);
        toast.error(t('errors.variantNotAvailable'));
        return;
      }

      // Validate variant ID
      if (!selectedVariant.id) {
        logger.error('Invalid variant ID:', selectedVariant.id);
        toast.error(t('errors.variantNotAvailable'));
        return;
      }

      // Show loading toast
      const loadingToast = toast.loading('Adding to cart...');

      try {
        // Add item to cart with variant ID as string
        await addItem(Number(selectedVariant.id), quantity, 'variant');
      } catch (error) {
        logger.error('Detailed cart error:', {
          variant: selectedVariant,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success(t('success.addedToCart'), {
        icon: '🛒',
        duration: 3000,
      });

      // Analytics: add_to_cart (variant path)
      track({
        event: 'add_to_cart',
        currency: 'MAD',
        value: (selectedVariant.price || product?.price || 0) * quantity,
        items: [
          {
            item_id: String(selectedVariant.id),
            item_name: product?.name ?? '',
            item_category: product?.category || '',
            item_variant: [selectedColor?.name, selectedSize?.name].filter(Boolean).join(' / '),
            price: selectedVariant.price || product?.price || 0,
            quantity,
          },
        ],
      });

      // Reset quantity to 1 after successful addition
      setQuantity(1);
    } catch (error) {
      logger.error('Error adding to cart:', error);
      const errorMessage = error instanceof Error ? error.message : t('cart.error_adding');
      toast.error(errorMessage);
    }
  };

  // Function to handle direct purchase
  const handlePurchaseNow = async () => {
    // CARTDBG: trace handlePurchaseNow entry
    if (typeof window !== 'undefined') {
      const hasVariants = (product?.variants?.length ?? 0) > 0;
      const resolvedStockId = product?.stock?.id ?? product?.stock_id ?? product?.id;
      console.warn(
        `[CARTDBG] handlePurchaseNow entry | hasVariants=${hasVariants}` +
        ` | selectedVariant=${selectedVariant?.id ?? 'none'}` +
        ` | resolvedStockId=${resolvedStockId} | quantity=${quantity}`
      );
    }

    // Guests can buy now via the guest cart + guest checkout (COD) — no login
    // required. Do not gate direct purchase behind authentication; the flow adds
    // to the guest cart and proceeds to /checkout, which supports guests.

    // Early exit if button should be disabled
    if (product?.variants && product.variants.length > 0) {
      if (!selectedVariant || 
          selectedVariant.quantity === 0 || 
          selectedVariant.quantity === null || 
          selectedVariant.quantity === undefined ||
          quantity > selectedVariant.quantity) {
        logger.log('Purchase blocked: insufficient stock', { 
          selectedVariant: selectedVariant?.quantity, 
          quantity 
        });
        toast.error(t('stock.out_of_stock'));
        return; // Don't execute if conditions aren't met
      }
    }
    
    // Additional safety check for out of stock - check all falsy values
    if (selectedVariant && (!selectedVariant.quantity || selectedVariant.quantity <= 0)) {
      logger.log('Purchase blocked: variant out of stock');
      toast.error(t('stock.out_of_stock'));
      return;
    }
    
    try {
      setIsPurchaseLoading(true);
      
      // Add to cart first
      if (product) {
        // Determine what ID to use and which type
        let itemId: number;
        let idType: 'stock' | 'variant' = 'stock';
        
        // If we have a selected variant with an ID, use that
        if (selectedVariant && selectedVariant.id) {
          itemId = Number(selectedVariant.id);
          idType = 'variant';
          logger.log('Using variant_id for purchase:', itemId);
        } else if (product.stock?.id) {
          // Variant-less product: use the hybrid stock object id (current backend contract)
          itemId = Number(product.stock.id);
          idType = 'stock';
          logger.log('Using stock.id for purchase:', itemId);
        } else if (product.stock_id) {
          // Legacy fallback: top-level scalar stock_id
          itemId = Number(product.stock_id);
          logger.log('Using stock_id for purchase:', itemId);
        } else {
          // Last resort: use product ID
          itemId = Number(product.id);
          logger.log('Using product_id for purchase:', itemId);
        }
        
        // Add to cart with the appropriate ID type
        await addItem(itemId, quantity, idType);
        
        // Set flags for checkout flow
        sessionStorage.setItem('purchaseNow', 'true');

        // Analytics: add_to_cart (buy-now path)
        const analyticsPrice = selectedVariant
          ? (selectedVariant.price || product.price || 0)
          : (product.price || 0);
        track({
          event: 'add_to_cart',
          currency: 'MAD',
          value: analyticsPrice * quantity,
          items: [
            {
              item_id: String(selectedVariant?.id ?? product.id),
              item_name: product.name,
              item_category: product.category || '',
              price: analyticsPrice,
              quantity,
            },
          ],
        });

        // Navigate to checkout
        router.push('/checkout');
      }
    } catch (error) {
      // Error is caught, toast is shown by addItem or here, redirect is prevented
      logger.error('Error processing purchase:', error);
      const errorMessage = error instanceof Error ? error.message : t('cart.error_adding');
      toast.error(errorMessage);
    } finally {
      setIsPurchaseLoading(false);
    }
  };


  // ── Guest "Buy now" handler ────────────────────────────────────────────────
  // Writes a minimal buy-now object to sessionStorage and navigates to
  // /checkout?buyNow=1.  Does NOT touch the server cart or CartContext.
  // No auth required — this is the guest COD entry point.
  const handleBuyNow = () => {
    if (!product) return;

    // Require variant selection when the product has variants
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      toast.error(t('product.select_options', 'Select options first'));
      return;
    }

    if (shouldDisableButton()) {
      toast.error(t('stock.out_of_stock', 'Out of stock'));
      return;
    }

    // Resolve stock_id — same precedence as handlePurchaseNow and handleAddToCart
    let stockId: number | undefined;
    let variantId: number | undefined;

    if (selectedVariant && selectedVariant.id) {
      variantId = Number(selectedVariant.id);
    } else if (product.stock?.id) {
      stockId = Number(product.stock.id);
    } else if (product.stock_id) {
      stockId = Number(product.stock_id);
    } else {
      stockId = Number(product.id);
    }

    const unitPrice = displayPrice;
    const imageUrl = getCurrentImageUrl() || product.main_image || '';

    const buyNowItem = {
      product_id: Number(product.id),
      stock_id: stockId,
      variant_id: variantId,
      store_id: product.store_id || 0,
      quantity,
      unit_price: unitPrice,
      name: product.name,
      name_ar: product.name_ar,
      image: imageUrl,
      ts: Date.now(),
    };

    try {
      sessionStorage.setItem('beldify_buy_now', JSON.stringify(buyNowItem));
    } catch {
      // sessionStorage unavailable (private browsing restrictions)
      toast.error(t('errors.session_storage_unavailable', 'Unable to proceed — please enable cookies'));
      return;
    }

    router.push('/checkout?buyNow=1');
  };

  // Fetch AI review summary:
  //   - eagerly on product load when reviews_count >= 3 (to surface compact gist in buy column)
  //   - lazily on Reviews tab open otherwise
  // Spec: render ONLY on 200, no skeleton flash (stays null on 204/error).
  useEffect(() => {
    if (aiReviewFetchedRef.current || !id || !product) return;
    // Eager path: enough reviews to generate a meaningful summary
    const reviewCount = product.reviews_count ?? 0;
    const isReviewsTab = activeTab === 'reviews';
    if (!isReviewsTab && reviewCount < 3) return;
    aiReviewFetchedRef.current = true;
    const productId = Array.isArray(id) ? id[0] : id;
    getReviewSummary(productId, i18n?.language ?? 'ar')
      .then(setAiReviewSummary)
      .catch(() => { /* graceful: stays null */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id, product]);

  useEffect(() => {
    const myToken = ++productFetchTokenRef.current;
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productId = Array.isArray(id) ? id[0] : id;
        const response = await productService.getProduct(productId as string);
        if (productFetchTokenRef.current !== myToken) return;
        setProduct(response.product);
        // Clear any prior error so retries after a transient failure don't
        // leave stale copy alongside the freshly-loaded product.
        setError(null);
        // Reset the AI-summary fetch latch so the new product can load its own.
        aiReviewFetchedRef.current = false;

        const defaultVariant = response.product.variants?.find((v: any) => v.is_default);
        if (defaultVariant) {
          setSelectedColor(defaultVariant.color || null);
          setSelectedSize(defaultVariant.size || null);
          setSelectedFabric(defaultVariant.fabric || null);
          setSelectedVariant(defaultVariant);
        }
      } catch (error) {
        if (productFetchTokenRef.current !== myToken) return;
        setError(t('errors.product_load_failed'));
        logger.error('Error fetching product:', error);
      } finally {
        if (productFetchTokenRef.current === myToken) setLoading(false);
      }
    };

    fetchProduct();
    // fetch is keyed by route id only; t() is stable enough for error copy
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Fetch 8 related products once; split into two distinct shelf slices:
  //   [0..3] → "Complete the look" up-sell shelf
  //   [4..7] → "You might also like" shelf
  // This guarantees the two shelves always show different items.
  useEffect(() => {
    if (!id) return;
    const myToken = ++relatedFetchTokenRef.current;
    const productId = Array.isArray(id) ? id[0] : id;
    productService.getRelatedProducts(productId, 8)
      .then((data) => {
        if (relatedFetchTokenRef.current !== myToken) return;
        setAllRelatedProducts(data.products || []);
      })
      .catch(() => {
        if (relatedFetchTokenRef.current !== myToken) return;
        setAllRelatedProducts([]);
      });
  }, [id]);

  // Track recently-viewed products in localStorage for the home-page shelf
  useEffect(() => {
    if (!product) return;
    addRecentlyViewed({
      id: Number(product.id),
      name: product.name,
      image: product.main_image || '',
      price: product.price,
      viewedAt: Date.now(),
    });
  }, [product]);

  // Analytics: fire view_item once the product data is available
  useEffect(() => {
    if (!product) return;
    track({
      event: 'view_item',
      currency: 'MAD',
      value: product.price || 0,
      items: [
        {
          item_id: String(product.id),
          item_name: product.name,
          item_category: product.category || '',
          price: product.price || 0,
          quantity: 1,
        },
      ],
    });
  }, [product]);

  if (loading) {
    return (
      <div className="bg-canvas min-h-screen">
        <div className="max-w-7xl mx-auto px-6 pt-6 pb-16">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center gap-2 mb-8">
            <div className="h-3 w-12 rounded-full bg-gray-100 animate-pulse" />
            <div className="h-3 w-2 rounded-full bg-gray-100 animate-pulse" />
            <div className="h-3 w-20 rounded-full bg-gray-100 animate-pulse" />
            <div className="h-3 w-2 rounded-full bg-gray-100 animate-pulse" />
            <div className="h-3 w-32 rounded-full bg-gray-100 animate-pulse" />
          </div>
          {/* Hero skeleton — 2-col on lg */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Gallery skeleton */}
            <div className="flex flex-col gap-4">
              <div className="w-full aspect-[4/5] rounded-2xl bg-gray-100 animate-pulse" />
              <div className="grid grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            </div>
            {/* Info pane skeleton */}
            <div className="bg-white rounded-2xl ring-1 ring-gray-200 p-8 flex flex-col gap-5 shadow-atlas-sm">
              <div className="h-3 w-20 rounded-full bg-gray-100 animate-pulse" />
              <div className="space-y-2">
                <div className="h-8 w-3/4 rounded-2xl bg-gray-100 animate-pulse" />
                <div className="h-8 w-1/2 rounded-2xl bg-gray-100 animate-pulse" />
              </div>
              <div className="h-6 w-28 rounded-full bg-gray-100 animate-pulse" />
              <div className="h-4 w-24 rounded-full bg-gray-100 animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-full rounded-full bg-gray-100 animate-pulse" />
                <div className="h-3.5 w-5/6 rounded-full bg-gray-100 animate-pulse" />
              </div>
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 w-10 rounded-full bg-gray-100 animate-pulse" />
                ))}
              </div>
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-8 w-14 rounded-full bg-gray-100 animate-pulse" />
                ))}
              </div>
              <div className="h-12 w-full rounded-full bg-gray-100 animate-pulse mt-2" />
              <div className="h-10 w-full rounded-full bg-gray-100 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-4 text-center px-6 max-w-sm">
          <div className="h-16 w-16 rounded-2xl bg-rose-50 ring-1 ring-rose-200 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-rose-700" aria-hidden />
          </div>
          <h1 className="text-xl font-semibold text-gray-900" style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}>
            {error || t('errors.productNotFound', 'Product not found')}
          </h1>
          <p className="text-sm text-gray-500">
            {t('errors.productNotFoundDesc', 'This product may have been removed or the link is incorrect.')}
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
          >
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            {t('navigation.backToProducts', 'Back to products')}
          </Link>
        </div>
      </div>
    );
  }

  const displayName = isRTL ? product.name_ar || product.name : product.name;
  const displayCategory = isRTL ? product.category_ar || product.category : product.category;

  // ── Vertical detection — drives jewelry vs. clothing UI branching ─────────
  const isJewelry = isJewelryProduct({
    vertical: product.vertical,
    category: product.category,
    category_slug: product.category_slug,
    customization_options: product.customization_options as Record<string, unknown> | null | undefined,
  });
  // Jewelry spec data from backend customization_options (vertical spec fields)
  const jewelrySpec = product.customization_options ?? null;
  
  // Use the selected variant's price if available, otherwise use product price
  const variantPrice = selectedVariant?.price;
  
  // Calculate display price considering both variant price and product discounts
  const displayPrice = variantPrice || 
    (product.has_discount && product.discount_price ? product.discount_price : product.price);
    
  const hasDiscount = product.has_discount && product.discount_price;
  const discountPercentage =
    hasDiscount && typeof product.price === 'number' && typeof product.discount_price === 'number'
      ? Math.round((1 - product.discount_price / product.price) * 100)
      : 0;

  // Get available options with proper type safety
  const availableFabrics = product.variants
    .map((variant) => variant.fabric)
    .filter((fabric): fabric is VariantFabric => fabric !== null)
    .filter((fabric, index, self) =>
      self.findIndex((f) => f.id === fabric.id) === index
    );

  const availableColors = product.variants
    .map((variant) => variant.color)
    .filter((color): color is VariantColor => color !== null)
    .filter((color, index, self) =>
      self.findIndex((c) => c.id === color.id) === index
    );

  const availableSizes = product.variants
    .map((variant) => variant.size)
    .filter((size): size is VariantSize => size !== null)
    .filter((size, index, self) =>
      self.findIndex((s) => s.id === size.id) === index
    );
  // This price is used for stock and inventory calculations
  const currentPrice = selectedVariant?.price || product.price;
  
  // Get the stock status for the current variant or main product
  const stockStatus = (() => {
    if (selectedVariant) {
      return selectedVariant.quantity > 0
        ? `${t('stock.in_stock')} (${selectedVariant.quantity})`
        : t('stock.out_of_stock');
    }

    if (product && product.stock) {
      // New hybrid-stock object path
      if (!product.stock.in_stock) return t('stock.out_of_stock');
      if (product.stock.made_to_order) return t('stock.made_to_order', 'Made to order');
      if (product.stock.quantity !== null) {
        return `${t('stock.in_stock_simple', 'In stock')} (${product.stock.quantity})`;
      }
      return t('stock.in_stock_simple', 'In stock');
    }

    // Legacy fallback
    if (product) {
      const legacyStock = product.quantity;
      const legacyNum = typeof legacyStock === 'string' ? parseInt(legacyStock) : legacyStock;
      if (!legacyNum || legacyNum <= 0) return t('stock.out_of_stock');
      return `${t('stock.in_stock_simple', 'In stock')} (${legacyNum})`;
    }

    return t('stock.out_of_stock');
  })();

  // Wishlist toggle helper
  // Guests are handled by WishlistContext's guest path (localStorage-backed,
  // merged to server on login/register). Do NOT redirect guests to /login here —
  // they must be able to wishlist without an account.
  const wishlisted = isInWishlist(Number(product.id));
  const handleWishlistToggle = async () => {
    if (wishlisted) {
      await removeFromWishlist(Number(product.id));
    } else {
      await addToWishlist(Number(product.id));
    }
  };

  // Thumbnail images (up to 4)
  const thumbnails = (() => {
    const imgs = getAllImages();
    if (imgs.length > 0) return imgs.slice(0, 4);
    if (product.main_image) {
      return [
        { id: 'main', url: product.main_image, is_primary: true },
        { id: 'main-2', url: product.main_image },
        { id: 'main-3', url: product.main_image },
        { id: 'main-4', url: product.main_image },
      ];
    }
    return [];
  })();

  // Kicker label
  const kickerLabel = (product as any).is_featured
    ? t('product.bestseller', 'BESTSELLER')
    : (product as any).is_new
    ? t('product.new', 'NEW')
    : displayCategory || '';

  // Size pills — only from real variant sizes; render nothing when no sizes available
  const sizePills: string[] = availableSizes.map(s => s.name);
  // For jewelry, detect if sizes are ring-size codes (numeric, 40–75 range)
  const isRingSizes = isJewelry && hasRingSizes(sizePills);

  // ── JSON-LD structured data (Product schema) ──────────────────────────────
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.beldify.com';
  const productJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: displayName,
    description: product.description || displayName,
    image: getCurrentImageUrl() || product.main_image || undefined,
    offers: {
      '@type': 'Offer',
      price: String(displayPrice),
      priceCurrency: 'MAD',
      availability:
        !shouldDisableButton()
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: `${siteUrl}/products/${product.id}`,
    },
  };
  // AggregateRating — emit only when there's at least one review with a real
  // rating, so Google can surface the star snippet on SERP. Skipping when
  // reviewCount=0 avoids the "0.0 (0 reviews)" anti-snippet penalty.
  const reviewCountForLd = product.reviews_count ?? 0;
  const ratingForLd = product.rating ?? 0;
  if (reviewCountForLd > 0 && ratingForLd > 0) {
    productJsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: ratingForLd.toFixed(1),
      reviewCount: reviewCountForLd,
      bestRating: '5',
      worstRating: '1',
    };
  }

  // BreadcrumbList JSON-LD — drives rich-results breadcrumb on Google PDP cards.
  // Mirrors the visible breadcrumb nav below (Home › Category › Product).
  const breadcrumbItems: Array<{ '@type': 'ListItem'; position: number; name: string; item?: string }> = [
    { '@type': 'ListItem', position: 1, name: t('navigation.home', 'Home'), item: `${siteUrl}/` },
  ];
  if (displayCategory) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: String(displayCategory),
      item: `${siteUrl}/products?category=${encodeURIComponent(product.category || '')}`,
    });
  }
  breadcrumbItems.push({
    '@type': 'ListItem',
    position: breadcrumbItems.length + 1,
    name: displayName,
  });
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  // pb-28 on mobile = ~112px clearance for the PdpBuyBar (two rows + safe-area)
  return (
    <div className="bg-canvas min-h-screen pb-28 md:pb-16">
    {/* Product structured data for SEO */}
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
    />
    {/* BreadcrumbList structured data — Google rich-results breadcrumbs */}
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
    />
    <main className="max-w-7xl mx-auto" role="main">
      {/* ── 1. Breadcrumb strip ── */}
      <nav className="px-6 py-4 text-sm text-gray-500" aria-label={t('catalog.pdp.breadcrumb_label', 'Breadcrumb')}>
        <ol className="flex items-center gap-1.5 flex-wrap">
          <li>
            <Link href="/" className="hover:text-indigo-700 transition-colors">
              {t('navigation.home', 'Home')}
            </Link>
          </li>
          <li><span className="text-gray-500">/</span></li>
          {displayCategory && (
            <>
              <li>
                <Link
                  href={`/products?category=${encodeURIComponent(product.category || '')}`}
                  className="hover:text-indigo-700 transition-colors"
                >
                  {displayCategory}
                </Link>
              </li>
              <li><span className="text-gray-500">/</span></li>
            </>
          )}
          <li>
            <span className="text-gray-900 font-medium" aria-current="page">
              {displayName}
            </span>
          </li>
        </ol>
      </nav>

      {/* ── 2. Hero — 2-col on lg+ ── */}
      <section className="px-6 grid grid-cols-1 lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_520px] gap-10 mb-16" aria-label={t('product.details', 'Product details')}>

        {/* ── Left: Image gallery ── */}
        <div className="flex flex-col gap-4">
          {/* Main image — constrained on mobile so title+price appear above the fold.
              max-h-[55vh] on mobile keeps the gallery to ~55% of the viewport height,
              letting the info pane title + price + buy CTA show within 390×844.
              On desktop the layout is 2-col so the constraint is removed (lg:aspect-[4/5]). */}
          <div
            className="relative w-full max-h-[55vh] lg:max-h-none lg:aspect-[4/5] aspect-[4/5] rounded-2xl overflow-hidden ring-1 ring-amber-200 shadow-atlas-sm group cursor-zoom-in"
            onClick={() => getCurrentImageUrl() && setIsZoomed(true)}
            role="button"
            aria-label={t('product.zoom_image', 'Zoom image')}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); getCurrentImageUrl() && setIsZoomed(true); } }}
          >
            {getCurrentImageUrl() ? (
              <Image
                src={getCurrentImageUrl()}
                alt={displayName}
                fill
                priority
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full bg-amber-100 flex items-center justify-center rounded-2xl">
                <span className="text-amber-400 text-sm font-medium">{displayName}</span>
              </div>
            )}

            {/* Gradient vignette at base — editorial depth */}
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-gray-950/20 to-transparent pointer-events-none"
            />

            {/* Kicker badge overlaid on image (mobile only) */}
            {kickerLabel && (
              <span className="lg:hidden absolute top-4 start-4 text-xs uppercase tracking-[0.18em] text-amber-700 font-medium bg-amber-50 ring-1 ring-amber-200 rounded-full px-3 py-1">
                {kickerLabel}
              </span>
            )}

            {/* Wishlist pill top-end (RTL-safe logical positioning) */}
            <button
              onClick={handleWishlistToggle}
              aria-label={wishlisted ? t('wishlist.remove', 'Remove from wishlist') : t('wishlist.add', 'Add to wishlist')}
              className="absolute top-4 end-4 bg-white rounded-full p-2.5 shadow-atlas-sm hover:bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
            >
              <Heart
                className={cn('h-5 w-5 transition-colors', wishlisted ? 'fill-rose-600 text-rose-600' : 'text-gray-500')}
              />
            </button>

            {/* Sale badge overlaid on image (start side, below wishlist) */}
            {hasDiscount && discountPercentage > 0 && (
              <span className="absolute bottom-4 end-4 inline-flex items-center rounded-full bg-rose-700 px-2.5 py-1 text-xs font-bold text-white shadow-atlas-sm">
                −{discountPercentage}%
              </span>
            )}
          </div>

          {/* Thumbnail strip (up to 5, scroll on mobile) */}
          {thumbnails.length > 1 && (
            <div
              className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-none"
              role="group"
              aria-label={t('product.image_thumbnails', 'Product images')}
            >
              {thumbnails.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => {
                    setSelectedImage(img);
                    setActiveImageIndex(idx);
                  }}
                  aria-label={`${displayName} ${t('product.view', 'view')} ${idx + 1}`}
                  aria-pressed={activeImageIndex === idx}
                  className={cn(
                    'relative shrink-0 w-20 h-20 rounded-xl overflow-hidden ring-1 transition-all duration-200 snap-start focus:outline-none focus-visible:ring-2',
                    activeImageIndex === idx
                      ? 'ring-2 ring-indigo-700 shadow-atlas-sm focus-visible:ring-indigo-700'
                      : 'ring-gray-200 opacity-60 hover:opacity-90 hover:ring-gray-300 focus-visible:ring-indigo-700/50'
                  )}
                >
                  <Image
                    src={buildImageUrl(img.url)}
                    alt={`${displayName} ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Info pane ── */}
        <div className="bg-white ring-1 ring-gray-200 rounded-2xl p-7 lg:p-8 flex flex-col gap-5 shadow-atlas-sm">

          {/* Kicker — desktop only (mobile shows it overlaid on image) */}
          {kickerLabel && (
            <p className="hidden lg:block text-xs uppercase tracking-[0.18em] text-amber-700 font-medium">
              {kickerLabel}
            </p>
          )}

          {/* Product name — large Playfair on desktop */}
          <h1
            className={cn(
              'text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-gray-900 leading-[1.1] tracking-tight',
              isRTL ? 'font-arabic' : ''
            )}
            style={isRTL ? undefined : { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {displayName}
          </h1>

          {/* Price line */}
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl font-bold text-indigo-700 tabular-nums currency-mad">
              {formatPrice(displayPrice)}
            </span>
            {hasDiscount && (
              <span className="text-base text-gray-500 line-through tabular-nums">
                {formatPrice(product.price)}
              </span>
            )}
            {hasDiscount && discountPercentage > 0 && (
              <span className="inline-flex items-center rounded-full bg-rose-700 px-2.5 py-0.5 text-xs font-bold text-white">
                −{discountPercentage}%
              </span>
            )}
          </div>

          {/* Rating row — real stars only once reviews exist; a brand-new product
              shows a positive Saffron-amber "new" badge instead of empty grey stars
              (avoids the negative "0.0 (0 reviews)" social-proof penalty). */}
          {(product.reviews_count ?? 0) > 0 ? (
            <div className="flex items-center gap-2 text-sm">
              {/* Numeric score — prominent social proof anchor */}
              <span className="font-bold text-gray-900 tabular-nums">
                {(product.rating ?? 0).toFixed(1)}
              </span>
              {/* Spoken label announces the rating rounded to the nearest half, so it
                  agrees with the rendered half-star fill (e.g. 3.4 → "3.5 stars"). */}
              <span
                className="flex items-center gap-0.5"
                aria-label={`${Math.round((product.rating ?? 0) * 2) / 2} ${t('product.stars', 'stars')}`}
              >
                {[1, 2, 3, 4, 5].map((i) => {
                  const rating = product.rating ?? 0;
                  const isFull = rating >= i;
                  const isHalf = !isFull && rating >= i - 0.5;
                  return (
                    <span key={i} className="relative inline-flex h-4 w-4 shrink-0" aria-hidden>
                      {/* Empty base star */}
                      <Star className="h-4 w-4 fill-gray-200 text-gray-200" />
                      {/* Filled overlay — full star or a start-clipped half (RTL-safe via inset-inline-start) */}
                      {(isFull || isHalf) && (
                        <span
                          className="absolute inset-y-0 start-0 overflow-hidden"
                          style={{ width: isHalf ? '50%' : '100%' }}
                        >
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        </span>
                      )}
                    </span>
                  );
                })}
              </span>
              <a
                href="#reviews"
                className="text-indigo-700 hover:underline underline-offset-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 rounded"
              >
                ({product.reviews_count ?? 0} {t('product.reviews', 'reviews')})
              </a>
            </div>
          ) : (
            <a
              href="#reviews"
              className="inline-flex items-center gap-1.5 self-start rounded-full bg-amber-100/80 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {t('product.be_first_review', 'New — be the first to review')}
            </a>
          )}

          {/* AI review gist — compact one-liner surfaced in buy column when summary is ready
              and the product has >= 3 reviews. Clicking scrolls to the Reviews tab.
              Spec: only render on 200 (aiReviewSummary non-null), clearly labelled as AI. */}
          {aiReviewSummary && (product.reviews_count ?? 0) >= 3 && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('reviews');
                document.getElementById('product-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="w-full text-start flex items-start gap-2 rounded-xl bg-amber-50 ring-1 ring-amber-200 px-3.5 py-2.5 hover:ring-indigo-300 hover:bg-indigo-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 group"
              aria-label={t('buyerAi.reviewSummary.header', 'ملخص التقييمات')}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" aria-hidden />
              <span className="text-xs text-gray-700 leading-relaxed line-clamp-2 group-hover:text-indigo-800 transition-colors">
                <span className="font-semibold text-amber-700 me-1.5">
                  {t('buyerAi.reviewSummary.header', 'ملخص بالذكاء الاصطناعي')}
                </span>
                {aiReviewSummary.summary}
              </span>
            </button>
          )}

          {/* Seller card — clickable when the shop has a public page; always
              balanced via justify-between + an always-present subtitle, so a shop
              with no location/url never leaves a gaping void on one side. */}
          {(() => {
            const shopName = product.shop?.name ?? t('shop.default_name');
            const subtitle = product.shop?.location
              ? `${product.shop.location} · ${t('pdp.artisanMade', 'artisan made')}`
              : t('pdp.trustedArtisan', 'Verified artisan seller');
            const inner = (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  {/* Shop logo / monogram */}
                  <div className="shrink-0 h-11 w-11 rounded-full bg-indigo-700 flex items-center justify-center shadow-atlas-sm overflow-hidden">
                    {product.shop?.logo ? (
                      <Image
                        src={buildImageUrl(product.shop.logo)}
                        alt={shopName}
                        width={44}
                        height={44}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {shopName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-900 text-sm truncate">
                        {shopName}
                      </span>
                      <BadgeCheck className="h-4 w-4 text-indigo-700 shrink-0" aria-label={t('shop.verified', 'Verified')} />
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{subtitle}</p>
                  </div>
                </div>
                {product.shop?.url_name && (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 group-hover/seller:bg-indigo-100 transition-colors">
                    {t('shop.visit', 'Visit shop')}
                    <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
                  </span>
                )}
              </>
            );
            return product.shop?.url_name ? (
              <Link
                href={`/shops/${product.shop.url_name}`}
                className="group/seller flex items-center justify-between gap-3 bg-amber-50 ring-1 ring-amber-200 rounded-2xl px-4 py-3 hover:ring-indigo-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
                aria-label={t('shop.visit', 'Visit shop')}
              >
                {inner}
              </Link>
            ) : (
              <div className="flex items-center justify-between gap-3 bg-amber-50 ring-1 ring-amber-200 rounded-2xl px-4 py-3">
                {inner}
              </div>
            );
          })()}

          {/* Description — 3 lines, styled. dir="auto" lets the browser detect the
              text's language from the first strong character, so an English blurb on
              an RTL page renders left-aligned with punctuation in the right place
              instead of a period floating to the wrong side. */}
          {product.description && (
            <p dir="auto" className="text-gray-600 text-sm leading-relaxed line-clamp-3 border-s-2 border-gray-300 ps-3 text-start">
              {product.description}
            </p>
          )}

          {/* Jewelry spec block — shown immediately below description for jewelry products */}
          {isJewelry && jewelrySpec && (
            <JewelryFields spec={jewelrySpec} />
          )}

          {/* Color swatches (if present in variants) */}
          {availableColors.length > 0 && (
            <fieldset>
              <legend className="text-sm font-medium text-gray-800 mb-2">
                {t('product.color', 'Color')}
              </legend>
              <div className="flex flex-wrap gap-2" role="radiogroup">
                {availableColors.map((color) => (
                  // Option 1: 44×44 hit area wraps 32×32 visual swatch — preserves tight-row layout rhythm
                  <button
                    type="button"
                    key={color.id}
                    onClick={() => handleColorSelection(color)}
                    title={color.name}
                    aria-label={`${t('product.select_color', 'Select')} ${color.name}`}
                    role="radio"
                    aria-checked={selectedColor?.id === color.id}
                    className="relative flex items-center justify-center w-11 h-11 rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                  >
                    {/* Inner 32×32 color circle carries the ring styling */}
                    <span
                      className={cn(
                        'w-8 h-8 rounded-full transition-all duration-200',
                        selectedColor?.id === color.id
                          ? 'ring-2 ring-amber-500 ring-offset-2'
                          : 'ring-1 ring-gray-200 hover:ring-gray-300'
                      )}
                      style={{ backgroundColor: color.hex_code }}
                    />
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* Size pills — only rendered when real variant sizes are present */}
          {availableSizes.length > 0 && (
            <fieldset>
              <div className="flex items-center justify-between mb-2">
                <legend className="text-sm font-medium text-gray-800">
                  {isRingSizes
                    ? t('jewelry.ring_size', 'Ring size')
                    : t('product.size', 'Size')}
                </legend>
              </div>
              <div className="flex flex-wrap gap-2" role="radiogroup">
                {sizePills.map((sizeName) => {
                  const sizeObj = availableSizes.find(s => s.name === sizeName);
                  const isSelected = sizeObj
                    ? selectedSize?.id === sizeObj.id
                    : false;
                  const isAvail = sizeObj
                    ? !selectedColor || product.variants.some(
                        v => v.size?.id === sizeObj.id && v.color?.id === selectedColor.id && v.quantity > 0
                      )
                    : true;
                  return (
                    <button
                      key={sizeName}
                      onClick={() => sizeObj && isAvail && handleSizeSelection(sizeObj)}
                      disabled={!!sizeObj && !isAvail}
                      role="radio"
                      aria-checked={isSelected}
                      className={cn(
                        'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                        isSelected
                          ? 'bg-indigo-700 text-white'
                          : isAvail
                            ? 'bg-white ring-1 ring-gray-200 text-gray-700 hover:ring-indigo-300'
                            : 'bg-gray-100 text-gray-400 ring-1 ring-gray-200 cursor-not-allowed'
                      )}
                    >
                      {sizeName}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* Fabric picker (if present) — hidden for jewelry products */}
          {!isJewelry && availableFabrics.length > 0 && (
            <fieldset>
              <legend className="text-sm font-medium text-gray-800 mb-2">
                {t('product.fabric', 'Fabric')}
              </legend>
              <div className="flex flex-wrap gap-2" role="radiogroup">
                {availableFabrics.map((fabric) => {
                  const isAvailableForSelection = !selectedColor || !selectedSize || product.variants.some(
                    v => v.fabric?.id === fabric.id &&
                         v.color?.id === selectedColor?.id &&
                         v.size?.id === selectedSize?.id &&
                         v.quantity > 0
                  );
                  return (
                    <button
                      key={fabric.id}
                      onClick={() => isAvailableForSelection && handleFabricSelection(fabric)}
                      disabled={!isAvailableForSelection}
                      role="radio"
                      aria-checked={selectedFabric?.id === fabric.id}
                      className={cn(
                        'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                        selectedFabric?.id === fabric.id
                          ? 'bg-indigo-700 text-white'
                          : isAvailableForSelection
                            ? 'bg-white ring-1 ring-gray-200 text-gray-700 hover:ring-indigo-300'
                            : 'bg-gray-100 text-gray-400 ring-1 ring-gray-200 cursor-not-allowed'
                      )}
                    >
                      {fabric.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* AI size advisor — only shown for clothing products with size variants */}
          {!isJewelry && availableSizes.length > 0 && (
            <SizeAdvisorSheet
              productId={product.id}
              hasSizes={availableSizes.length > 0}
              availableSizes={sizePills}
              onSelectSize={(size) => {
                const sizeObj = availableSizes.find(s => s.name === size);
                if (sizeObj) handleSizeSelection(sizeObj);
              }}
            />
          )}

          {/* Custom size link — clothing only (hidden for jewelry) */}
          {!isJewelry && (
            <Link
              href="/services/tailoring"
              className="inline-flex items-center gap-1.5 text-sm text-indigo-700 underline underline-offset-2 hover:text-indigo-900 transition-colors self-start focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 rounded"
            >
              {t('product.custom_size', 'Custom size available')}
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
            </Link>
          )}

          {/* Divider */}
          <div className="border-t border-gray-100" aria-hidden />

          {/* Quantity stepper + CTA group */}
          <div className="space-y-3">
            {/* Qty row */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 shrink-0">
                {t('product.quantity', 'Qty')}
              </span>
              <div className="flex items-center bg-amber-50 ring-1 ring-amber-200 rounded-full overflow-hidden">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label={t('stock.decrease_quantity', 'Decrease quantity')}
                  className="p-2.5 hover:bg-amber-100 disabled:opacity-40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-700/30"
                >
                  <Minus className="h-3.5 w-3.5 text-gray-700" aria-hidden />
                </button>
                <span className="w-10 text-center text-sm font-semibold text-gray-900 select-none" aria-live="polite">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  aria-label={t('stock.increase_quantity', 'Increase quantity')}
                  className="p-2.5 hover:bg-amber-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-700/30"
                >
                  <Plus className="h-3.5 w-3.5 text-gray-700" aria-hidden />
                </button>
              </div>
              {/* Stock indicator — variant path */}
              {selectedVariant && (
                <span className={cn(
                  'text-xs font-medium rounded-full px-2.5 py-1',
                  selectedVariant.quantity > 0
                    ? selectedVariant.quantity <= 5
                      ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                      : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                )}>
                  {selectedVariant.quantity > 0
                    ? selectedVariant.quantity <= 5
                      ? t('stock.only_left', 'Only {{count}} left', { count: selectedVariant.quantity })
                      : `${selectedVariant.quantity} ${t('stock.available', 'available')}`
                    : t('stock.out_of_stock', 'Out of stock')}
                </span>
              )}
              {/* Stock indicator — variant-less (hybrid-stock) path */}
              {!selectedVariant && product.variants.length === 0 && product.stock && (
                <span className={cn(
                  'text-xs font-medium rounded-full px-2.5 py-1',
                  !product.stock.in_stock
                    ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                    : product.stock.made_to_order
                      ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                      : product.stock.quantity !== null && product.stock.quantity <= 5
                        ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                        : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                )}>
                  {!product.stock.in_stock
                    ? t('stock.out_of_stock', 'Out of stock')
                    : product.stock.made_to_order
                      ? t('stock.made_to_order', 'Made to order')
                      : product.stock.quantity !== null && product.stock.quantity <= 5
                        ? t('stock.only_left', 'Only {{count}} left', { count: product.stock.quantity })
                        : t('stock.in_stock_simple', 'In stock')}
                </span>
              )}
            </div>

            {/* Primary CTA: Add to bag — DESKTOP ONLY (mobile purchase lives in the
                sticky PdpBuyBar; duplicating both pairs on one mobile screen confused
                users). Full-width, large tap target.
                INTENTIONAL Atlas exception: the global add-to-cart contract is the
                amber-500 / text-amber-950 accent variant, but on the PDP the saffron
                accent is reserved for the bespoke-tailoring CTA below (the editorial
                hook). To avoid two amber CTAs competing on one screen, the PDP add-to-bag
                is the indigo-700 primary instead. This is a documented PDP-primary-indigo
                exception, not silent drift. */}
            <button
              type="button"
              onClick={() => {
                if (!shouldDisableButton()) handleAddToCart();
              }}
              disabled={shouldDisableButton()}
              className={cn(
                'hidden md:flex w-full rounded-full py-4 items-center justify-center gap-2.5 text-base font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
                shouldDisableButton()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed ring-1 ring-gray-200'
                  : 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-atlas-sm hover:shadow-atlas-md active:scale-[0.98]'
              )}
            >
              <ShoppingBag className="h-5 w-5" aria-hidden />
              {(() => {
                if (!product?.variants || product.variants.length === 0) {
                  // Variant-less: reflect stock state in the label
                  if (product?.stock && !product.stock.in_stock) return t('stock.out_of_stock', 'Out of stock');
                  if (product?.stock?.made_to_order) return t('stock.made_to_order', 'Made to order');
                  return t('cart.add_to_bag', 'Add to bag');
                }
                if (!selectedVariant) return t('product.select_options', 'Select options');
                if (isOutOfStock(selectedVariant)) return t('stock.out_of_stock', 'Out of stock');
                return t('cart.add_to_bag', 'Add to bag');
              })()}
            </button>

            {/* Secondary CTA: Buy now — guest COD path, no account required */}
            <button
              type="button"
              data-testid="buy-now-button"
              onClick={handleBuyNow}
              disabled={shouldDisableButton()}
              className={cn(
                'hidden md:flex w-full rounded-full py-3.5 items-center justify-center gap-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40',
                shouldDisableButton()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed ring-1 ring-gray-200'
                  : 'bg-amber-400 hover:bg-amber-300 text-gray-900 shadow-atlas-sm hover:shadow-atlas-md active:scale-[0.98]'
              )}
            >
              {t('product.buy_now', 'Buy now')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </button>

            {/* Virtual try-on — clothing only, hidden when disabled or 403 */}
            {!tryOnHidden && (
              <TryOnButton
                isJewelry={isJewelry}
                productId={String(id ?? '')}
                config={tryonConfig}
                onOpen={() => setIsTryOnOpen(true)}
              />
            )}

            {/* Tertiary CTA: Save to wishlist */}
            <button
              type="button"
              onClick={handleWishlistToggle}
              className={cn(
                'w-full rounded-full py-3 flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
                wishlisted
                  ? 'bg-rose-50 ring-1 ring-rose-200 text-rose-700 hover:bg-rose-100'
                  : 'bg-white ring-1 ring-gray-200 text-gray-700 hover:ring-indigo-300 hover:text-indigo-700'
              )}
            >
              <Heart className={cn('h-4 w-4', wishlisted ? 'fill-rose-600 text-rose-600' : '')} aria-hidden />
              {wishlisted ? t('wishlist.saved', 'Saved') : t('wishlist.save', 'Save for later')}
            </button>

            {/* Notify me — back-in-stock (OOS) or price-drop (in-stock).
                OOS: prominent, replaces the buy button's call to action.
                In-stock: secondary, shown below the wishlist save button.
                isProductOOS derives from variant-path and hybrid-stock-path
                to avoid using shouldDisableButton() which also fires for
                "no variant selected" — a different condition. */}
            {(() => {
              const isProductOOS =
                // Variant path: variant selected and is out of stock
                (selectedVariant && isOutOfStock(selectedVariant)) ||
                // Variant-less hybrid-stock path: stock object says not in stock
                (!selectedVariant && product.variants.length === 0 && product.stock && !product.stock.in_stock) ||
                // Legacy fallback: no stock object, quantity ≤ 0
                (!selectedVariant && product.variants.length === 0 && !product.stock && (() => {
                  const n = typeof product.quantity === 'string' ? parseInt(product.quantity) : product.quantity;
                  return !n || (n as number) <= 0;
                })());

              return (
                <NotifyMeButton
                  productId={Number(product.id)}
                  currentPrice={displayPrice}
                  isOutOfStock={!!isProductOOS}
                  isRTL={isRTL}
                />
              );
            })()}

            {/* Tertiary CTA: Share — spreads the product link to WhatsApp/social,
                pulling buyers back into the app (sale always closes in-app). */}
            <ShareButton
              block
              title={product?.name}
              text={product?.price != null ? formatPrice(product.price) : undefined}
              label={t('share.share_product', 'Share this product')}
            />
          </div>

          {/* Trust strip — 3 micro-pills in a warm row */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="flex flex-col items-center gap-1.5 bg-amber-50 ring-1 ring-amber-100 rounded-2xl p-3 text-center">
              <Truck className="h-4 w-4 text-amber-600 shrink-0" aria-hidden />
              <span className="text-[11px] text-gray-600 leading-snug font-medium">
                {t('trust.ships', 'Ships in 3 days')}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5 bg-amber-50 ring-1 ring-amber-100 rounded-2xl p-3 text-center">
              <RotateCcw className="h-4 w-4 text-amber-600 shrink-0" aria-hidden />
              <span className="text-[11px] text-gray-600 leading-snug font-medium">
                {t('trust.returns', 'Free returns')}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5 bg-amber-50 ring-1 ring-amber-100 rounded-2xl p-3 text-center">
              <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" aria-hidden />
              <span className="text-[11px] text-gray-600 leading-snug font-medium">
                {t('trust.authentic', 'Authentic')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Click-to-zoom lightbox overlay ── */}
      {isZoomed && getCurrentImageUrl() && (
        <div
          role="dialog"
          aria-label={t('product.zoom_image', 'Zoom image')}
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 p-4"
          onClick={() => setIsZoomed(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setIsZoomed(false); }}
          tabIndex={-1}
        >
          <div
            className="relative max-w-3xl w-full max-h-[90vh] aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={getCurrentImageUrl()}
              alt={displayName}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
          <button
            aria-label={t('product.close_zoom', 'Close zoom')}
            className="absolute top-4 end-4 bg-white rounded-full p-2.5 shadow-atlas-sm hover:bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
            onClick={() => setIsZoomed(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── 3. Tabs section ── */}
      <section className="px-6 mb-16" aria-label={t('product.tabs', 'Product tabs')} id="product-tabs">
        {/* Tab pills — horizontal scroll on mobile, sticky feel */}
        <div
          className="flex gap-0 border-b border-amber-200 mb-8 overflow-x-auto scrollbar-none sticky top-0 z-10 bg-amber-50 pt-2"
          role="tablist"
          aria-label={t('product.tabs', 'Product tabs')}
        >
          {(['description', 'specs', 'sizing', 'reviews'] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              id={`tab-${tab}`}
              aria-controls={`tabpanel-${tab}`}
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-700/30',
                activeTab === tab
                  ? 'text-indigo-700 border-b-2 border-indigo-700 -mb-px'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-t-xl'
              )}
            >
              {t(`product.tab_${tab}`, tab.charAt(0).toUpperCase() + tab.slice(1))}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div className="max-w-3xl">
          {/* Description */}
          <div
            role="tabpanel"
            id="tabpanel-description"
            aria-labelledby="tab-description"
            className={activeTab === 'description' ? '' : 'hidden'}
          >
            <div className="space-y-5 text-gray-600 text-sm leading-relaxed">
              <p className="text-base">{product.description}</p>
              {/* "From the journal" teaser removed — the journal route does not exist yet.
                  TODO: restore link card when the journal section ships. */}
            </div>
          </div>

          {/* Specs */}
          <div
            role="tabpanel"
            id="tabpanel-specs"
            aria-labelledby="tab-specs"
            className={activeTab === 'specs' ? '' : 'hidden'}
          >
            {/* Jewelry products: show full JewelryFields spec table */}
            {isJewelry && jewelrySpec ? (
              <div className="space-y-4">
                <JewelryFields spec={jewelrySpec} />
                {/* Category + SKU still useful for reference */}
                <div className="rounded-2xl ring-1 ring-gray-200 overflow-hidden bg-white">
                  {product.category && (
                    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-100 last:border-b-0">
                      <span className="text-xs uppercase tracking-wider text-gray-500 w-24 shrink-0">{t('product.category', 'Category')}</span>
                      <span className="text-sm font-medium text-gray-900">{displayCategory}</span>
                    </div>
                  )}
                  {selectedVariant?.sku && (
                    <div className="flex items-center gap-4 px-5 py-3.5 last:border-b-0">
                      <span className="text-xs uppercase tracking-wider text-gray-500 w-24 shrink-0">{t('catalog.pdp.sku', 'SKU')}</span>
                      <span className="text-sm font-mono text-gray-900">{selectedVariant.sku}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Clothing / default: category + SKU + fabrics table */
              <div className="rounded-2xl ring-1 ring-gray-200 overflow-hidden bg-white">
                {product.category && (
                  <div className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-100 last:border-b-0">
                    <span className="text-xs uppercase tracking-wider text-gray-500 w-24 shrink-0">{t('product.category', 'Category')}</span>
                    <span className="text-sm font-medium text-gray-900">{displayCategory}</span>
                  </div>
                )}
                {selectedVariant?.sku && (
                  <div className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-100 last:border-b-0">
                    <span className="text-xs uppercase tracking-wider text-gray-500 w-24 shrink-0">{t('catalog.pdp.sku', 'SKU')}</span>
                    <span className="text-sm font-mono text-gray-900">{selectedVariant.sku}</span>
                  </div>
                )}
                {availableFabrics.length > 0 && (
                  <div className="flex items-center gap-4 px-5 py-3.5 last:border-b-0">
                    <span className="text-xs uppercase tracking-wider text-gray-500 w-24 shrink-0">{t('product.fabric', 'Fabric')}</span>
                    <span className="text-sm text-gray-900">{availableFabrics.map(f => f.name).join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sizing */}
          <div
            role="tabpanel"
            id="tabpanel-sizing"
            aria-labelledby="tab-sizing"
            className={activeTab === 'sizing' ? '' : 'hidden'}
          >
            {isJewelry ? (
              /* Jewelry ring-size guidance */
              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <p>{t('jewelry.ring_size_info', 'Ring sizes are in EU numeric format (e.g. 48–72). Use a ring sizer or measure the inner diameter of an existing ring in millimeters to find your size.')}</p>
                <Link
                  href="/custom-orders/new?vertical=jewelry"
                  className="inline-flex items-center gap-2 text-indigo-700 underline underline-offset-2 hover:text-indigo-900 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 rounded"
                >
                  {t('jewelry.request_custom_size', 'Request a custom size')}
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
                </Link>
              </div>
            ) : (
              /* Clothing sizing guidance */
              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <p>{t('product.sizing_info', 'Please refer to our size guide for accurate measurements. Custom sizing is always available.')}</p>
                <Link
                  href="/services/tailoring"
                  className="inline-flex items-center gap-2 text-indigo-700 underline underline-offset-2 hover:text-indigo-900 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 rounded"
                >
                  {t('product.custom_sizing', 'Request custom sizing')}
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
                </Link>
              </div>
            )}
          </div>

          {/* Reviews */}
          <div
            role="tabpanel"
            id="tabpanel-reviews"
            aria-labelledby="tab-reviews"
            className={activeTab === 'reviews' ? '' : 'hidden'}
          >
            {/* AI review summary card — lazy-fetched; renders only on 200 (spec) */}
            <AiReviewSummaryCard data={aiReviewSummary} />
            <ReviewsSection productId={product.id} productName={product.name} />
          </div>
        </div>
      </section>

      {/* ── 4. Bespoke strip (full-bleed) ── */}
      {/* Jewelry products get a jewelry-specific custom-order section.
          Clothing/default products get the tailoring bespoke strip. */}
      {isJewelry ? (
        /* ── Jewelry: custom-piece request strip ── */
        <section className="relative isolate overflow-hidden bg-indigo-900 text-white py-16 px-6 mb-16" data-testid="jewelry-bespoke-strip">
          <div
            aria-hidden
            className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,_theme(colors.amber.500)_0,_transparent_45%),radial-gradient(circle_at_80%_60%,_theme(colors.indigo.950)_0,_transparent_50%)]"
          />
          <div className="relative max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-300 font-medium">
              {t('jewelry.bespoke.eyebrow', 'Custom Jewelry')}
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold leading-tight"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('jewelry.bespoke.headline', 'Request a custom piece')}
            </h2>
            <p className="text-indigo-100 text-sm max-w-lg">
              {t('jewelry.bespoke.body', 'Choose your metal, stone, engraving, and ring size. Our master jewelers will craft a piece made specifically for you.')}
            </p>
            <Link
              href="/custom-orders/new?vertical=jewelry"
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-8 py-3 text-sm font-semibold text-amber-950 shadow-atlas-sm hover:bg-amber-400 hover:text-amber-950 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-900"
            >
              {t('jewelry.bespoke.cta', 'Start a custom jewelry order')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Link>
          </div>
        </section>
      ) : (
        /* ── Clothing / default: tailoring bespoke strip ── */
        <section className="relative isolate overflow-hidden bg-indigo-900 text-white py-16 px-6 mb-16">
          {/* Decorative warm/indigo glow — token-single-sourced via theme() so the
              palette never drifts to literal hexes. amber.500 = saffron accent,
              indigo.950 = deep Atlas surface. */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,_theme(colors.amber.500)_0,_transparent_45%),radial-gradient(circle_at_80%_60%,_theme(colors.indigo.950)_0,_transparent_50%)]"
          />
          <div className="relative max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-300 font-medium">
              {t('bespoke.eyebrow', 'Bespoke')}
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold leading-tight"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('bespoke.headline', 'Want it tailored to you?')}
            </h2>
            <p className="text-indigo-100 text-sm max-w-lg">
              {t('bespoke.body', 'Provide your measurements and an Atelier artisan will craft this piece specifically for you.')}
            </p>
            <Link
              href="/services/tailoring"
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-8 py-3 text-sm font-semibold text-amber-950 shadow-atlas-sm hover:bg-amber-400 hover:text-amber-950 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-900"
            >
              {t('bespoke.cta', 'Start a tailoring order')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Link>
          </div>
        </section>
      )}

      {/* ── 5a & 5b. Up-sell shelves — rendered only when data is available ──
           Heuristic v1: partitionShelves() splits 8 related products into two
           disjoint slices. When ≤ 4 are returned only "Complete the look" is
           shown so the two shelves never display the same items.
           A true complementary cross-sell engine needs a dedicated backend
           endpoint — flagged as a follow-up. */}
      {(() => {
        const { completeLook, alsoLike } = partitionShelves(allRelatedProducts);
        return (
          <>
            {/* 5a — Complete the look */}
            {completeLook.length > 0 && (
              <section
                className="px-6 mb-12"
                aria-label={t('pdp.complete_the_look', 'Complete the look')}
              >
                {/* Warmer container visually distinguishes this from "You might also like" */}
                <div className="rounded-2xl bg-amber-50 ring-1 ring-amber-100 px-6 pt-6 pb-2">
                  {/* Sparkles AI chip eyebrow */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium ring-1 ring-amber-200">
                      <Sparkles size={12} className="shrink-0" aria-hidden />
                      {t('pdp.aiStyling', 'AI styled for you')}
                    </span>
                  </div>
                  {/* Section heading */}
                  <div className="flex items-baseline justify-between flex-wrap gap-4 mb-2">
                    <h2
                      className="text-2xl sm:text-3xl font-bold text-gray-900"
                      style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                    >
                      {t('pdp.complete_the_look', 'Complete the look')}
                    </h2>
                  </div>
                  <RelatedProducts
                    products={completeLook}
                    showHeading={false}
                  />
                </div>
              </section>
            )}

            {/* 5b — You might also like (only rendered when alsoLike is non-empty
                 to guarantee the two shelves never show duplicates) */}
            {alsoLike.length > 0 && (
              <section className="px-6 mb-16" aria-label={t('product.related', 'You might also like')}>
                <div className="flex items-baseline justify-between mb-8 flex-wrap gap-4">
                  <h2
                    className="text-2xl sm:text-3xl font-bold text-gray-900"
                    style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                  >
                    {t('product.you_might_also_like', 'You might also like')}
                  </h2>
                  <Link
                    href="/products"
                    className="text-sm text-indigo-700 hover:text-indigo-900 underline underline-offset-2 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 rounded"
                  >
                    {t('product.view_all', 'View all')}
                  </Link>
                </div>
                <RelatedProducts
                  products={alsoLike}
                  showHeading={false}
                />
              </section>
            )}
          </>
        );
      })()}

      {/* Mobile sticky buy bar — PdpBuyBar handles z-50 > MobileBottomNav z-40 */}
      {/* MobileBottomNav is hidden on /products/[id] so there is no overlap */}
      <PdpBuyBar
        price={(selectedVariant?.price || product.price)}
        quantity={quantity}
        disabled={shouldDisableButton()}
        onAddToCart={() => { if (!shouldDisableButton()) handleAddToCart(); }}
        onBuyNow={handleBuyNow}
        onHowToBuy={() => setIsHowToBuyOpen(true)}
        addToCartLabel={t('cart.add_to_bag', 'زيد للسلة')}
        buyNowLabel={t('product.buy_now', 'شري دابا')}
      />

      {/* "كيفاش نشري؟" bottom sheet — non-technical buyer onboarding */}
      <HowToBuySheet
        isOpen={isHowToBuyOpen}
        onClose={() => setIsHowToBuyOpen(false)}
      />

      {/* Virtual try-on modal — clothing products only */}
      {!isJewelry && (
        <TryOnModal
          open={isTryOnOpen}
          onClose={() => setIsTryOnOpen(false)}
          onHideFeature={() => {
            setTryOnHidden(true);
            setIsTryOnOpen(false);
          }}
          productId={String(id ?? '')}
          config={tryonConfig}
          isAuthenticated={isAuthenticated}
          onBuyNow={handleBuyNow}
        />
      )}
    </main>
    </div>
  );
}
