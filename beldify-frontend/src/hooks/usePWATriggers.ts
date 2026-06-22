'use client';

import { useEnhancedPWA } from '@/contexts/EnhancedPWAContext';
import logger from '@/utils/consoleLogger';

export const usePWATriggers = () => {
  const { triggerInstallOnAction } = useEnhancedPWA();

  const triggerOnCartAdd = () => {
    triggerInstallOnAction('cart');
  };

  const triggerOnCheckout = () => {
    triggerInstallOnAction('checkout');
  };

  const triggerOnOrderComplete = () => {
    triggerInstallOnAction('order-complete');
  };

  const triggerOnWishlist = () => {
    triggerInstallOnAction('wishlist');
  };

  return {
    triggerOnCartAdd,
    triggerOnCheckout,
    triggerOnOrderComplete,
    triggerOnWishlist,
  };
};

// Usage example functions that you can import in your components:

export const useCartPWATrigger = () => {
  const { triggerOnCartAdd } = usePWATriggers();
  
  // Call this when user adds item to cart
  const addToCartWithPWAPrompt = (productData: any) => {
    // Your existing add to cart logic here
    logger.log('Adding to cart:', productData);
    
    // Trigger PWA prompt based on user engagement
    triggerOnCartAdd();
  };

  return { addToCartWithPWAPrompt };
};

export const useCheckoutPWATrigger = () => {
  const { triggerOnCheckout } = usePWATriggers();
  
  // Call this when user goes to checkout
  const proceedToCheckoutWithPWAPrompt = () => {
    // Your existing checkout logic here
    logger.log('Proceeding to checkout');
    
    // Trigger PWA prompt for engaged users
    triggerOnCheckout();
  };

  return { proceedToCheckoutWithPWAPrompt };
};

export const useOrderCompletePWATrigger = () => {
  const { triggerOnOrderComplete } = usePWATriggers();
  
  // Call this when order is completed successfully
  const completeOrderWithPWAPrompt = (orderData: any) => {
    // Your existing order completion logic here
    logger.log('Order completed:', orderData);
    
    // This is the best time to show PWA prompt (high conversion)
    triggerOnOrderComplete();
  };

  return { completeOrderWithPWAPrompt };
}; 