'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ReviewsSection from '@/components/reviews/ReviewsSection';
import RelatedProducts from '@/components/products/RelatedProducts';
import { productService } from '@/services/api';
import { useDirection } from '@/hooks/useDirection';
import { formatPrice } from '@/utils/formatters';
import { getColorName, useLazyColorName } from '@/utils/colorNamer';
import { buildImageUrl, cn } from '@/lib/utils';
import { getImageUrl } from '@/utils/imageUtils';
import logger from '@/utils/consoleLogger';
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
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import toast from '@/utils/toast';

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
  stock?: number; // Main product stock quantity (matches backend API)
  quantity?: number | string; // Legacy field for backward compatibility
  main_image?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  stock_id?: number;
  store_id?: number;
  category?: string;
  category_ar?: string;
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

  // State for active main image index in the simple gallery
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'sizing' | 'reviews'>('description');
  const { addItem } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { t } = useTranslation();
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
      isStringZero: qty === "0",
      isFalsy: !qty
    });

    // Check for all possible falsy/zero values
    if (qty === null || qty === undefined) return true;
    if (typeof qty === 'number' && qty === 0) return true;
    if (typeof qty === 'string' && qty === "0") return true;
    if (typeof qty === 'string' && parseInt(qty) <= 0) return true;
    if (typeof qty === 'number' && qty <= 0) return true;

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
      // For products WITHOUT variants, check main product stock
      // Use 'stock' field first (matches backend API), fallback to 'quantity' for backward compatibility
      const productStock = product.stock ?? product.quantity;
      logger.log('Checking main product stock:', {
        productId: product.id,
        stock: product.stock,
        quantity: product.quantity,
        finalStock: productStock,
        stockType: typeof productStock,
        requestedQty: quantity
      });

      // Check if main product is out of stock
      // Handle various edge cases: null, undefined, 0, "0", empty string, false, negative values, invalid strings
      if (productStock === null || productStock === undefined || productStock === 0 || productStock === "0" || productStock === "") {
        logger.log('Button disabled: Main product out of stock');
        return true;
      }
      
      // Handle boolean false separately
      if (typeof productStock === 'boolean' && productStock === false) {
        logger.log('Button disabled: Main product out of stock');
        return true;
      }

      // Convert to number and validate
      let availableStock;
      if (typeof productStock === 'string') {
        availableStock = parseInt(productStock);
        // Handle invalid string conversions (NaN) or negative values
        if (isNaN(availableStock) || availableStock <= 0) {
          logger.log('Button disabled: Invalid or negative stock value');
          return true;
        }
      } else if (typeof productStock === 'number') {
        // Handle negative numbers
        if (productStock <= 0) {
          logger.log('Button disabled: Negative or zero stock');
          return true;
        }
        availableStock = productStock;
      } else {
        // Handle any other unexpected types
        logger.log('Button disabled: Invalid stock type');
        return true;
      }

      // Check if requested quantity exceeds available stock
      if (quantity > availableStock) {
        logger.log('Button disabled: Requested quantity exceeds main product stock');
        return true;
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
    return '/placeholder-product.jpg'; // Ultimate fallback
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
  }, [product, selectedColor, selectedSize, selectedFabric]);

  // Use the available options in your render
  const { colors, sizes, fabrics } = getAvailableOptions();

  // Chat / custom-request handlers removed — not in current design scope.

  // Function to handle adding to cart
  const handleAddToCart = async () => {
    // Check authentication first
    if (!isAuthenticated || !user) {
      toast.error(t('auth.login_required'));
      // Store the intended action and product info
      sessionStorage.setItem('redirectAction', 'addToCart');
      sessionStorage.setItem('redirectProductId', product?.id?.toString() || '');
      if (selectedVariant) {
        sessionStorage.setItem('redirectVariant', JSON.stringify({
          id: selectedVariant.id,
          color: selectedColor,
          size: selectedSize,
          fabric: selectedFabric
        }));
      }
      sessionStorage.setItem('redirectQuantity', quantity.toString());
      // Preserve the current URL for redirect after login
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

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
      const loadingToast = toast.loading(t('product.addingToCart', 'Adding to cart...'));

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

      // Reset quantity to 1 after successful addition
      setQuantity(1);
    } catch (error) {
      logger.error('Error adding to cart:', error);
      toast.error(t('cart.error_adding'));
    }
  };

  // Function to handle direct purchase
  const handlePurchaseNow = async () => {
    // Check authentication first
    if (!isAuthenticated || !user) {
      toast.error(t('auth.login_required'));
      // Store the intended action and product info
      sessionStorage.setItem('redirectAction', 'purchaseNow');
      sessionStorage.setItem('redirectProductId', product?.id?.toString() || '');
      if (selectedVariant) {
        sessionStorage.setItem('redirectVariant', JSON.stringify({
          id: selectedVariant.id,
          color: selectedColor,
          size: selectedSize,
          fabric: selectedFabric
        }));
      }
      sessionStorage.setItem('redirectQuantity', quantity.toString());
      // Preserve the current URL for redirect after login
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

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
        } else if (product.stock_id) {
          // Otherwise fall back to stock_id
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
        
        // Navigate to checkout
        router.push('/checkout');
      }
    } catch (error) {
      // Error is caught, toast is shown by addItem or here, redirect is prevented
      logger.error('Error processing purchase:', error);
      toast.error(t('cart.error_adding'));
    } finally {
      setIsPurchaseLoading(false);
    }
  };


  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        // Convert id to string if it's an array
        const productId = Array.isArray(id) ? id[0] : id;
        const response = await productService.getProduct(productId as string);
        setProduct(response.product);

        // Set default selections if available
        const defaultVariant = response.product.variants?.find((v: any) => v.is_default);
        if (defaultVariant) {
          setSelectedColor(defaultVariant.color || null);
          setSelectedSize(defaultVariant.size || null);
          setSelectedFabric(defaultVariant.fabric || null);
          setSelectedVariant(defaultVariant);
        }
      } catch (error) {
        setError('Failed to load product');
          logger.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-700"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <p className="text-rose-700 font-medium">{error || t('errors.productNotFound', 'Product not found')}</p>
          <Link href="/products" className="text-sm text-indigo-700 underline underline-offset-2 hover:text-indigo-900">
            {t('navigation.backToProducts', 'Back to products')}
          </Link>
        </div>
      </div>
    );
  }

  const displayName = isRTL ? product.name_ar || product.name : product.name;
  const displayCategory = isRTL ? product.category_ar || product.category : product.category;
  
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
    
    if (product) {
      const productStock = product.stock ?? product.quantity;
      
      // Handle edge cases for stock status display
       if (productStock === null || productStock === undefined || productStock === 0 || productStock === "0" || productStock === "") {
         return t('stock.out_of_stock');
       }
       
       // Handle boolean false separately
       if (typeof productStock === 'boolean' && productStock === false) {
        return t('stock.out_of_stock');
      }
      
      // Convert to number and validate
      let stockValue;
      if (typeof productStock === 'string') {
        stockValue = parseInt(productStock);
        if (isNaN(stockValue) || stockValue <= 0) {
          return t('stock.out_of_stock');
        }
      } else if (typeof productStock === 'number') {
        if (productStock <= 0) {
          return t('stock.out_of_stock');
        }
        stockValue = productStock;
      } else {
        return t('stock.out_of_stock');
      }
      
      return `${t('stock.in_stock')} (${stockValue})`;
    }
    
    return t('stock.out_of_stock');
  })();

  // Wishlist toggle helper
  const wishlisted = isInWishlist(Number(product.id));
  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error(t('auth.login_required'));
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
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

  // Size pills — use variant sizes if present, else default
  const sizePills: string[] = availableSizes.length > 0
    ? availableSizes.map(s => s.name)
    : ['S', 'M', 'L', 'XL'];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.main_image ? [getImageUrl(product.main_image)] : [],
    sku: product.id,
    brand: product.shop?.name ? { '@type': 'Brand', name: product.shop.name } : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'MAD',
      price: displayPrice,
      availability: (product.stock ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: product.shop?.name ? { '@type': 'Organization', name: product.shop.name } : undefined,
    },
    ...(product.rating && product.reviews_count ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviews_count,
      },
    } : {}),
  };

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    <div className="bg-amber-50 min-h-screen pb-16">
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

      {/* ── 2. Hero (2-col on lg+) ── */}

      {/* ── 2. Hero — 2-col on lg+ ── */}
      <section className="px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16" aria-label={t('product.details', 'Product details')}>

        {/* ── Left: Image gallery ── */}
        <div className="flex flex-col gap-4">
          {/* Main image — 4:5 aspect, amber-200 ring, Atlas rounded-lg (16px) */}
          <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden ring-1 ring-amber-200 bg-amber-50">
            {getCurrentImageUrl() ? (
              <Image
                src={getCurrentImageUrl()}
                alt={displayName}
                fill
                priority
                className="object-cover transition-transform duration-500 hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full bg-amber-100 flex items-center justify-center">
                <span className="text-amber-400 text-sm">{displayName}</span>
              </div>
            )}
            {/* Wishlist pill top-end (RTL-safe logical positioning) */}
            <button
              onClick={handleWishlistToggle}
              aria-label={wishlisted ? t('wishlist.remove', 'Remove from wishlist') : t('wishlist.add', 'Add to wishlist')}
              className="absolute top-4 end-4 bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-sm hover:bg-white transition-colors"
            >
              <Heart
                className={cn('h-5 w-5', wishlisted ? 'fill-indigo-700 text-indigo-700' : 'text-gray-500')}
              />
            </button>
          </div>

          {/* Thumbnail row (up to 4) */}
          {thumbnails.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {thumbnails.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => {
                    setSelectedImage(img);
                    setActiveImageIndex(idx);
                  }}
                  className={cn(
                    'relative aspect-square rounded-xl overflow-hidden ring-1 transition-all duration-200',
                    activeImageIndex === idx
                      ? 'ring-indigo-700 ring-2'
                      : 'ring-amber-200 opacity-70 hover:opacity-100'
                  )}
                >
                  <Image
                    src={buildImageUrl(img.url)}
                    alt={`${displayName} ${t('product.view', 'view')} ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="10vw"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Info pane on sand background ── */}
        <div className="bg-white ring-1 ring-amber-200 rounded-lg p-8 flex flex-col gap-5 shadow-atlas-sm">

          {/* Kicker */}
          {kickerLabel && (
            <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium">
              {kickerLabel}
            </p>
          )}

          {/* Product name */}
          <h1
            className={cn('text-3xl sm:text-4xl font-bold text-gray-900 leading-tight', isRTL ? 'font-arabic' : '')}
            style={isRTL ? undefined : { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {displayName}
          </h1>

          {/* Price line */}
          <div className="flex items-baseline gap-3 flex-wrap">
            {hasDiscount && (
              <span className="text-base text-gray-500 line-through">
                {formatPrice(product.price)}
              </span>
            )}
            <span className="text-2xl font-semibold text-indigo-700">
              {formatPrice(displayPrice)}
            </span>
            {hasDiscount && discountPercentage > 0 && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-300">
                −{discountPercentage}%
              </span>
            )}
          </div>

          {/* Verified seller chip */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-amber-50 ring-1 ring-amber-200 rounded-full px-3 py-1.5 text-sm text-gray-800">
              <BadgeCheck className="h-4 w-4 text-indigo-700" aria-hidden />
              {product.shop?.name ?? 'Atelier Fassi'}
              {(product.shop?.location ?? 'Fez') && (
                <span className="text-gray-500">
                  · {product.shop?.location ?? 'Fez'}
                </span>
              )}
            </span>
          </div>

          {/* Provenance caption — renders only when shop.location (city) is present in API response */}
          {/* expect: font-mono text-[10px] uppercase caption "<City> · artisan made" appears below seller chip */}
          {product.shop?.location && (
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-gray-600 mt-1">
              {product.shop.location} · {t('pdp.artisanMade', 'artisan made')}
            </p>
          )}
          {/* TODO: render provenance once seller_city is in the API response (currently uses shop.location as proxy) */}

          {/* Rating row */}
          {product.rating != null && (
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-0.5" aria-hidden="true">
                {[1,2,3,4,5].map(i => (
                  <Star
                    key={i}
                    className={cn(
                      'h-4 w-4',
                      i <= Math.round(product.rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                    )}
                  />
                ))}
              </span>
              <a href="#reviews" className="text-indigo-700 underline-offset-2 hover:underline">
                ({product.reviews_count ?? 0} {t('product.reviews', 'reviews')})
              </a>
            </div>
          )}

          {/* Description — 2 lines */}
          {product.description && (
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
              {product.description}
            </p>
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
                          : 'ring-1 ring-amber-200 hover:ring-amber-300'
                      )}
                      style={{ backgroundColor: color.hex_code }}
                    />
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* Size pills */}
          <fieldset>
            <div className="flex items-center justify-between mb-2">
              <legend className="text-sm font-medium text-gray-800">
                {t('product.size', 'Size')}
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
                          ? 'bg-white ring-1 ring-amber-200 text-gray-700 hover:ring-indigo-300'
                          : 'bg-gray-100 text-gray-400 ring-1 ring-gray-200 cursor-not-allowed'
                    )}
                  >
                    {sizeName}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Fabric picker (if present) */}
          {availableFabrics.length > 0 && (
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
                            ? 'bg-white ring-1 ring-amber-200 text-gray-700 hover:ring-indigo-300'
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

          {/* Custom size link */}
          <Link
            href="/services/tailoring"
            className="text-sm text-indigo-700 underline underline-offset-2 hover:text-indigo-900 self-start"
          >
            {t('product.custom_size', 'Custom size available')}
          </Link>

          {/* Quantity stepper */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">
              {t('product.quantity', 'Qty')}
            </span>
            <div className="flex items-center bg-amber-50 ring-1 ring-amber-200 rounded-full overflow-hidden">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label={t('stock.decrease_quantity', 'Decrease')}
                className="p-2.5 hover:bg-amber-100 disabled:opacity-40 transition-colors"
              >
                <Minus className="h-3.5 w-3.5 text-gray-700" />
              </button>
              <span className="w-10 text-center text-sm font-semibold text-gray-900 select-none">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                aria-label={t('stock.increase_quantity', 'Increase')}
                className="p-2.5 hover:bg-amber-100 transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-gray-700" />
              </button>
            </div>
            {selectedVariant && (
              <span className={`text-xs ${selectedVariant.quantity > 0 && selectedVariant.quantity <= 10 ? 'text-amber-700 font-semibold' : 'text-gray-500'}`}>
                {selectedVariant.quantity <= 0
                  ? t('stock.out_of_stock', 'Out of stock')
                  : selectedVariant.quantity <= 10
                    ? t('stock.low_stock', 'Only {{count}} left!', { count: selectedVariant.quantity })
                    : `${selectedVariant.quantity} ${t('stock.available', 'available')}`}
              </span>
            )}
          </div>

          {/* Primary CTA: Add to bag */}
          <button
            type="button"
            onClick={() => {
              if (!shouldDisableButton()) handleAddToCart();
            }}
            disabled={shouldDisableButton()}
            className={cn(
              'w-full rounded-full py-3 flex items-center justify-center gap-2 text-base font-semibold transition-all duration-200',
              shouldDisableButton()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-700 hover:bg-indigo-800 text-white'
            )}
          >
            <ShoppingBag className="h-5 w-5" aria-hidden />
            {(() => {
              if (!product?.variants || product.variants.length === 0) return t('cart.add_to_bag', 'Add to bag');
              if (!selectedVariant) return t('product.select_options', 'Select options');
              if (isOutOfStock(selectedVariant)) return t('stock.out_of_stock', 'Out of stock');
              return t('cart.add_to_bag', 'Add to bag');
            })()}
          </button>

          {/* Secondary CTA: Save (wishlist) */}
          <button
            type="button"
            onClick={handleWishlistToggle}
            className="w-full rounded-full py-3 flex items-center justify-center gap-2 text-sm font-medium bg-white ring-1 ring-gray-300 text-gray-700 hover:ring-indigo-300 hover:text-indigo-700 transition-all duration-200"
          >
            <Heart className={cn('h-4 w-4', wishlisted ? 'fill-indigo-700 text-indigo-700' : '')} aria-hidden />
            {wishlisted ? t('wishlist.saved', 'Saved') : t('wishlist.save', 'Save')}
          </button>

          {/* Trust micro-pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="bg-white ring-1 ring-amber-200 rounded-full px-2.5 py-1 text-xs text-gray-600 inline-flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-amber-600" aria-hidden />
              {t('trust.ships', 'Ships in 3 days')}
            </span>
            <span className="bg-white ring-1 ring-amber-200 rounded-full px-2.5 py-1 text-xs text-gray-600 inline-flex items-center gap-1.5">
              <RotateCcw className="h-3.5 w-3.5 text-amber-600" aria-hidden />
              {t('trust.returns', 'Free returns 14 days')}
            </span>
            <span className="bg-white ring-1 ring-amber-200 rounded-full px-2.5 py-1 text-xs text-gray-600 inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600" aria-hidden />
              {t('trust.authentic', 'Authenticity guaranteed')}
            </span>
          </div>
        </div>
      </section>

      {/* ── 3. Tabs section ── */}
      <section className="px-6 mb-16" aria-label={t('product.tabs', 'Product tabs')}>
        {/* Tab pills */}
        <div className="flex gap-1 border-b border-amber-200 mb-8 overflow-x-auto">
          {(['description', 'specs', 'sizing', 'reviews'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab
                  ? 'text-indigo-700 border-b-2 border-indigo-700 -mb-px'
                  : 'text-gray-500 hover:text-gray-800'
              )}
            >
              {t(`product.tab_${tab}`, tab.charAt(0).toUpperCase() + tab.slice(1))}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="max-w-3xl">
          {activeTab === 'description' && (
            <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
              <p>{product.description}</p>
              {product.description && (
                <p>
                  {t('product.description_secondary', 'Crafted by skilled artisans using traditional methods passed down through generations, this piece represents the finest in Moroccan craftsmanship.')}
                </p>
              )}
              {/* Journal entry link card */}
              <Link
                href={`/journal/${product.category?.toLowerCase() ?? 'crafts'}`}
                className="flex items-center justify-between mt-6 p-4 rounded-2xl bg-amber-50 ring-1 ring-amber-200 hover:ring-amber-300 transition-all group"
              >
                <div>
                  <p className="text-xs uppercase tracking-widest text-amber-700 font-medium mb-1">
                    {t('journal.from_the_journal', 'From the journal')}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {t('product.read_journal', 'Read the journal entry')}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-indigo-700 group-hover:translate-x-0.5 transition-transform rtl:rotate-180" />
              </Link>
            </div>
          )}
          {activeTab === 'specs' && (
            <div className="text-sm text-gray-600 leading-relaxed space-y-3">
              {product.category && (
                <p><span className="font-medium text-gray-900">{t('product.category', 'Category')}:</span> {displayCategory}</p>
              )}
              {selectedVariant?.sku && (
                <p><span className="font-medium text-gray-900">{t('catalog.pdp.sku', 'SKU')}:</span> {selectedVariant.sku}</p>
              )}
              {availableFabrics.length > 0 && (
                <p><span className="font-medium text-gray-900">{t('product.fabric', 'Fabric')}:</span> {availableFabrics.map(f => f.name).join(', ')}</p>
              )}
            </div>
          )}
          {activeTab === 'sizing' && (
            <div className="text-sm text-gray-600 leading-relaxed space-y-3">
              <p>{t('product.sizing_info', 'Please refer to our size guide for accurate measurements. Custom sizing is always available.')}</p>
              <Link href="/services/tailoring" className="text-indigo-700 underline underline-offset-2 hover:text-indigo-900">
                {t('product.custom_sizing', 'Request custom sizing')}
              </Link>
            </div>
          )}
          {activeTab === 'reviews' && (
            <ReviewsSection productId={product.id} productName={product.name} />
          )}
        </div>
      </section>

      {/* ── 4. Bespoke strip (full-bleed) ── */}
      <section className="relative isolate overflow-hidden bg-indigo-900 text-white py-16 px-6 mb-16">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,_#f59e0b_0,_transparent_45%),radial-gradient(circle_at_80%_60%,_#3b3b6d_0,_transparent_50%)]"
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
            className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-8 py-3 text-sm font-semibold text-gray-900 hover:bg-amber-300 transition-colors"
          >
            {t('bespoke.cta', 'Start a tailoring order')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </Link>
        </div>
      </section>

      {/* TODO (brief 3.2): when an AI-curated "complete the look" shelf is added here, prepend
           the Sparkles chip per brief delta 3.2:
           <div className="flex items-center gap-2 mb-4">
             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium ring-1 ring-amber-200">
               <Sparkles size={12} className="shrink-0" />
               {t('pdp.aiStyling', 'AI styled for you')}
             </span>
           </div>
           No shelf exists currently — skipped per conditional rule. */}

      {/* ── 5. You might also like ── */}
      <section className="px-6 mb-16" aria-label={t('product.related', 'You might also like')}>
        <h2
          className="text-2xl font-bold text-gray-900 mb-8"
          style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
        >
          {t('product.you_might_also_like', 'You might also like')}
        </h2>
        <RelatedProducts productId={product.id} limit={4} />
      </section>

      {/* Mobile sticky add-to-bag bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-amber-100 p-4 md:hidden shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <p className="text-base font-bold text-indigo-700">
              {formatPrice((selectedVariant?.price || product.price) * quantity)}
            </p>
            <p className="text-xs text-gray-500">{t('product.total', 'Total')}</p>
          </div>
          <button
            type="button"
            onClick={() => { if (!shouldDisableButton()) handleAddToCart(); }}
            disabled={shouldDisableButton()}
            className={cn(
              'flex-1 rounded-full py-3 flex items-center justify-center gap-1.5 text-sm font-semibold transition-all',
              shouldDisableButton()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-700 text-white hover:bg-indigo-800'
            )}
          >
            <ShoppingBag className="h-4 w-4" aria-hidden />
            {(() => {
              if (!product?.variants || product.variants.length === 0) return t('cart.add_to_bag', 'Add to bag');
              if (!selectedVariant) return t('product.select_options', 'Select options');
              if (isOutOfStock(selectedVariant)) return t('stock.out_of_stock', 'Out of stock');
              return t('cart.add_to_bag', 'Add to bag');
            })()}
          </button>
        </div>
      </div>
    </main>
    </div>
    </>
  );
}
