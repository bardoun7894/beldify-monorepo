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
      const errorMessage = error instanceof Error ? error.message : t('cart.error_adding');
      toast.error(errorMessage);
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
        setError(t('errors.product_load_failed'));
          logger.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-amber-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 pt-6 pb-16">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center gap-2 mb-8">
            <div className="h-3 w-12 rounded-full bg-amber-100/70 animate-pulse" />
            <div className="h-3 w-2 rounded-full bg-amber-100/70 animate-pulse" />
            <div className="h-3 w-20 rounded-full bg-amber-100/70 animate-pulse" />
            <div className="h-3 w-2 rounded-full bg-amber-100/70 animate-pulse" />
            <div className="h-3 w-32 rounded-full bg-amber-100/70 animate-pulse" />
          </div>
          {/* Hero skeleton — 2-col on lg */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Gallery skeleton */}
            <div className="flex flex-col gap-4">
              <div className="w-full aspect-[4/5] rounded-2xl bg-amber-100/70 animate-pulse" />
              <div className="grid grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-amber-100/70 animate-pulse" />
                ))}
              </div>
            </div>
            {/* Info pane skeleton */}
            <div className="bg-white rounded-2xl ring-1 ring-amber-200 p-8 flex flex-col gap-5 shadow-atlas-sm">
              <div className="h-3 w-20 rounded-full bg-amber-100/70 animate-pulse" />
              <div className="space-y-2">
                <div className="h-8 w-3/4 rounded-2xl bg-amber-100/70 animate-pulse" />
                <div className="h-8 w-1/2 rounded-2xl bg-amber-100/70 animate-pulse" />
              </div>
              <div className="h-6 w-28 rounded-full bg-amber-100/70 animate-pulse" />
              <div className="h-4 w-24 rounded-full bg-amber-100/70 animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-full rounded-full bg-amber-100/70 animate-pulse" />
                <div className="h-3.5 w-5/6 rounded-full bg-amber-100/70 animate-pulse" />
              </div>
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 w-10 rounded-full bg-amber-100/70 animate-pulse" />
                ))}
              </div>
              <div className="flex gap-2">
                {['S', 'M', 'L', 'XL'].map((_, i) => (
                  <div key={i} className="h-8 w-14 rounded-full bg-amber-100/70 animate-pulse" />
                ))}
              </div>
              <div className="h-12 w-full rounded-full bg-amber-100/70 animate-pulse mt-2" />
              <div className="h-10 w-full rounded-full bg-amber-100/70 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
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

  return (
    <div className="bg-amber-50 min-h-screen pb-20 md:pb-16">
    <main className="max-w-7xl mx-auto" role="main">
      {/* ── 1. Breadcrumb strip ── */}
      <nav className="px-6 py-4 text-sm text-gray-500" aria-label={t('catalog.pdp.breadcrumb_label', 'Breadcrumb')}>
        <ol className="flex items-center gap-1.5 flex-wrap">
          <li>
            <Link href="/" className="hover:text-indigo-700 transition-colors">
              {t('navigation.home', 'Home')}
            </Link>
          </li>
          <li><span className="text-amber-400 px-0.5">/</span></li>
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
              <li><span className="text-amber-400 px-0.5">/</span></li>
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
          {/* Main image — 4:5 aspect, warm parchment bg, Atlas rounded-2xl */}
          <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden ring-1 ring-amber-200 bg-amber-50 shadow-atlas-sm group">
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
              <span className="lg:hidden absolute top-4 start-4 text-xs uppercase tracking-[0.18em] text-amber-700 font-medium bg-amber-50/95 backdrop-blur-sm ring-1 ring-amber-200 rounded-full px-3 py-1">
                {kickerLabel}
              </span>
            )}

            {/* Wishlist pill top-end (RTL-safe logical positioning) */}
            <button
              onClick={handleWishlistToggle}
              aria-label={wishlisted ? t('wishlist.remove', 'Remove from wishlist') : t('wishlist.add', 'Add to wishlist')}
              className="absolute top-4 end-4 bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-atlas-sm hover:bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
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
                      : 'ring-amber-200 opacity-60 hover:opacity-90 hover:ring-amber-300 focus-visible:ring-indigo-700/50'
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
        <div className="bg-white ring-1 ring-amber-200 rounded-2xl p-7 lg:p-8 flex flex-col gap-5 shadow-atlas-sm">

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
              <span className="text-base text-gray-400 line-through tabular-nums">
                {formatPrice(product.price)}
              </span>
            )}
            {hasDiscount && discountPercentage > 0 && (
              <span className="inline-flex items-center rounded-full bg-rose-700 px-2.5 py-0.5 text-xs font-bold text-white">
                −{discountPercentage}%
              </span>
            )}
          </div>

          {/* Rating row */}
          {product.rating != null && (
            <div className="flex items-center gap-2 text-sm">
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
          )}

          {/* Seller card — rich editorial block */}
          <div className="flex items-center gap-3 bg-amber-50 ring-1 ring-amber-200 rounded-2xl px-4 py-3">
            {/* Shop logo / monogram */}
            <div className="shrink-0 h-10 w-10 rounded-full bg-indigo-700 flex items-center justify-center shadow-atlas-sm">
              {product.shop?.logo ? (
                <Image
                  src={buildImageUrl(product.shop.logo)}
                  alt={product.shop.name ?? 'Shop'}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {(product.shop?.name ?? 'A').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-gray-900 text-sm truncate">
                  {product.shop?.name ?? t('shop.default_name')}
                </span>
                <BadgeCheck className="h-4 w-4 text-indigo-700 shrink-0" aria-label={t('shop.verified', 'Verified')} />
              </div>
              {product.shop?.location && (
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-gray-500 mt-0.5">
                  {product.shop.location} · {t('pdp.artisanMade', 'artisan made')}
                </p>
              )}
            </div>
            {product.shop?.url_name && (
              <Link
                href={`/shops/${product.shop.url_name}`}
                className="shrink-0 text-xs text-indigo-700 hover:text-indigo-900 font-medium underline-offset-2 hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 rounded"
                aria-label={t('shop.visit', 'Visit shop')}
              >
                {t('shop.visit', 'Visit shop')}
              </Link>
            )}
          </div>

          {/* Description — 3 lines, styled */}
          {product.description && (
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 border-s-2 border-amber-300 ps-3">
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
            className="inline-flex items-center gap-1.5 text-sm text-indigo-700 underline underline-offset-2 hover:text-indigo-900 transition-colors self-start focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 rounded"
          >
            {t('product.custom_size', 'Custom size available')}
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
          </Link>

          {/* Divider */}
          <div className="border-t border-amber-100" aria-hidden />

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
              {/* Stock indicator */}
              {selectedVariant && (
                <span className={cn(
                  'text-xs font-medium rounded-full px-2.5 py-1',
                  selectedVariant.quantity > 0
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                )}>
                  {selectedVariant.quantity > 0
                    ? `${selectedVariant.quantity} ${t('stock.available', 'available')}`
                    : t('stock.out_of_stock', 'Out of stock')}
                </span>
              )}
            </div>

            {/* Primary CTA: Add to bag — full-width, large tap target.
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
                'w-full rounded-full py-4 flex items-center justify-center gap-2.5 text-base font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
                shouldDisableButton()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed ring-1 ring-gray-200'
                  : 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-atlas-sm hover:shadow-atlas-md active:scale-[0.98]'
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

            {/* Secondary CTA: Save to wishlist */}
            <button
              type="button"
              onClick={handleWishlistToggle}
              className={cn(
                'w-full rounded-full py-3 flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
                wishlisted
                  ? 'bg-rose-50 ring-1 ring-rose-200 text-rose-700 hover:bg-rose-100'
                  : 'bg-white ring-1 ring-amber-200 text-gray-700 hover:ring-indigo-300 hover:text-indigo-700'
              )}
            >
              <Heart className={cn('h-4 w-4', wishlisted ? 'fill-rose-600 text-rose-600' : '')} aria-hidden />
              {wishlisted ? t('wishlist.saved', 'Saved') : t('wishlist.save', 'Save for later')}
            </button>
          </div>

          {/* Trust strip — 3 micro-pills in a warm row */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="flex flex-col items-center gap-1.5 bg-amber-50/80 ring-1 ring-amber-100 rounded-2xl p-3 text-center">
              <Truck className="h-4 w-4 text-amber-600 shrink-0" aria-hidden />
              <span className="text-[11px] text-gray-600 leading-snug font-medium">
                {t('trust.ships', 'Ships in 3 days')}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5 bg-amber-50/80 ring-1 ring-amber-100 rounded-2xl p-3 text-center">
              <RotateCcw className="h-4 w-4 text-amber-600 shrink-0" aria-hidden />
              <span className="text-[11px] text-gray-600 leading-snug font-medium">
                {t('trust.returns', 'Free returns')}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5 bg-amber-50/80 ring-1 ring-amber-100 rounded-2xl p-3 text-center">
              <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" aria-hidden />
              <span className="text-[11px] text-gray-600 leading-snug font-medium">
                {t('trust.authentic', 'Authentic')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Tabs section ── */}
      <section className="px-6 mb-16" aria-label={t('product.tabs', 'Product tabs')} id="product-tabs">
        {/* Tab pills — horizontal scroll on mobile, sticky feel */}
        <div
          className="flex gap-0 border-b border-amber-200 mb-8 overflow-x-auto scrollbar-none sticky top-0 z-10 bg-amber-50/95 backdrop-blur-sm pt-2"
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
                  : 'text-gray-500 hover:text-gray-800 hover:bg-amber-100/40 rounded-t-xl'
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
              {product.description && (
                <p className="text-gray-500">
                  {t('product.description_secondary', 'Crafted by skilled artisans using traditional methods passed down through generations, this piece represents the finest in Moroccan craftsmanship.')}
                </p>
              )}
              {/* Journal entry link card */}
              <Link
                href={`/journal/${product.category?.toLowerCase() ?? 'crafts'}`}
                className="flex items-center justify-between mt-6 p-5 rounded-2xl bg-white ring-1 ring-amber-200 hover:ring-amber-300 hover:shadow-atlas-sm transition-all duration-200 group"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-1">
                    {t('journal.from_the_journal', 'From the journal')}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {t('product.read_journal', 'Read the craft story')}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-indigo-700 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform rtl:rotate-180 shrink-0" aria-hidden />
              </Link>
            </div>
          </div>

          {/* Specs */}
          <div
            role="tabpanel"
            id="tabpanel-specs"
            aria-labelledby="tab-specs"
            className={activeTab === 'specs' ? '' : 'hidden'}
          >
            <div className="rounded-2xl ring-1 ring-amber-200 overflow-hidden bg-white">
              {product.category && (
                <div className="flex items-center gap-4 px-5 py-3.5 border-b border-amber-100 last:border-b-0">
                  <span className="text-xs uppercase tracking-wider text-gray-500 w-24 shrink-0">{t('product.category', 'Category')}</span>
                  <span className="text-sm font-medium text-gray-900">{displayCategory}</span>
                </div>
              )}
              {selectedVariant?.sku && (
                <div className="flex items-center gap-4 px-5 py-3.5 border-b border-amber-100 last:border-b-0">
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
          </div>

          {/* Sizing */}
          <div
            role="tabpanel"
            id="tabpanel-sizing"
            aria-labelledby="tab-sizing"
            className={activeTab === 'sizing' ? '' : 'hidden'}
          >
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
          </div>

          {/* Reviews */}
          <div
            role="tabpanel"
            id="tabpanel-reviews"
            aria-labelledby="tab-reviews"
            className={activeTab === 'reviews' ? '' : 'hidden'}
          >
            <ReviewsSection productId={product.id} productName={product.name} />
          </div>
        </div>
      </section>

      {/* ── 4. Bespoke strip (full-bleed) ── */}
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
        <RelatedProducts productId={product.id} limit={4} />
      </section>

      {/* Mobile sticky add-to-bag bar — safe-area aware */}
      <div
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-amber-100 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden shadow-atlas-lg"
        role="region"
        aria-label={t('cart.sticky_bar', 'Add to bag')}
      >
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="shrink-0">
            <p className="text-base font-bold text-indigo-700 tabular-nums currency-mad">
              {formatPrice((selectedVariant?.price || product.price) * quantity)}
            </p>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider">{t('product.total', 'Total')}</p>
          </div>
          <button
            type="button"
            onClick={() => { if (!shouldDisableButton()) handleAddToCart(); }}
            disabled={shouldDisableButton()}
            className={cn(
              'flex-1 rounded-full py-3.5 flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
              shouldDisableButton()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed ring-1 ring-gray-200'
                : 'bg-indigo-700 text-white hover:bg-indigo-800 shadow-atlas-sm active:scale-[0.98]'
            )}
          >
            <ShoppingBag className="h-4 w-4" aria-hidden />
            {t('cart.add_to_bag', 'Add to bag')}
          </button>
          <button
            type="button"
            onClick={handleWishlistToggle}
            aria-label={wishlisted ? t('wishlist.remove', 'Remove from wishlist') : t('wishlist.add', 'Add to wishlist')}
            className="shrink-0 h-12 w-12 rounded-full flex items-center justify-center ring-1 ring-amber-200 bg-white hover:bg-amber-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
          >
            <Heart
              className={cn('h-5 w-5 transition-colors', wishlisted ? 'fill-rose-600 text-rose-600' : 'text-gray-500')}
              aria-hidden
            />
          </button>
        </div>
      </div>
    </main>
    </div>
  );
}
