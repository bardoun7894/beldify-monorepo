'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface LoadingManagerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'card';
  title?: string;
  message?: string;
  fullScreen?: boolean;
  theme?: 'default' | 'orders' | 'profile' | 'product';
  className?: string;
}

const LoadingManager: React.FC<LoadingManagerProps> = ({
  size = 'md',
  variant = 'spinner',
  title,
  message,
  fullScreen = false,
  theme = 'default',
  className = '',
}) => {
  const getThemeColors = () => {
    const themes = {
      default: {
        gradient: 'from-indigo-600 to-purple-600',
        bgGradient: 'from-indigo-50 to-white',
        border: 'border-indigo-100',
        spinner: 'border-indigo-100 border-t-indigo-600',
        text: 'from-indigo-600 to-purple-600',
      },
      orders: {
        gradient: 'from-indigo-600 to-purple-600',
        bgGradient: 'from-indigo-50 to-white',
        border: 'border-indigo-100',
        spinner: 'border-indigo-100 border-t-indigo-600',
        text: 'from-indigo-600 to-purple-600',
      },
      profile: {
        gradient: 'from-purple-600 to-pink-600',
        bgGradient: 'from-purple-50 to-white',
        border: 'border-purple-100',
        spinner: 'border-purple-100 border-t-purple-600',
        text: 'from-purple-600 to-pink-600',
      },
      product: {
        gradient: 'from-amber-600 to-orange-600',
        bgGradient: 'from-amber-50 to-white',
        border: 'border-amber-100',
        spinner: 'border-amber-100 border-t-amber-600',
        text: 'from-amber-600 to-orange-600',
      },
    };
    return themes[theme];
  };

  const getSizeClasses = () => {
    const sizes = {
      sm: { spinner: 'w-6 h-6', container: 'p-4', text: 'text-sm' },
      md: { spinner: 'w-8 h-8', container: 'p-6', text: 'text-base' },
      lg: { spinner: 'w-12 h-12', container: 'p-8', text: 'text-lg' },
      xl: { spinner: 'w-16 h-16', container: 'p-12', text: 'text-xl' },
    };
    return sizes[size];
  };

  const colors = getThemeColors();
  const sizeClasses = getSizeClasses();

  const SpinnerVariant = () => (
    <div className="flex justify-center">
      <div
        className={`${sizeClasses.spinner} border-4 ${colors.spinner} rounded-full animate-spin`}
      />
    </div>
  );

  const DotsVariant = () => (
    <div className="flex justify-center space-x-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`w-3 h-3 bg-gradient-to-r ${colors.gradient} rounded-full`}
          animate={{ y: [0, -10, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );

  const PulseVariant = () => (
    <div className="flex justify-center">
      <motion.div
        className={`${sizeClasses.spinner} bg-gradient-to-r ${colors.gradient} rounded-full`}
        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );

  const CardVariant = () => (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`bg-white rounded-xl shadow-lg border ${colors.border} ${sizeClasses.container} text-center`}
    >
      <SpinnerVariant />
      {title && (
        <h2 className={`${sizeClasses.text} font-semibold text-transparent bg-clip-text bg-gradient-to-r ${colors.text} mt-6 mb-2`}>
          {title}
        </h2>
      )}
      {message && (
        <p className="text-gray-600">{message}</p>
      )}
    </motion.div>
  );

  const renderVariant = () => {
    switch (variant) {
      case 'dots':
        return <DotsVariant />;
      case 'pulse':
        return <PulseVariant />;
      case 'card':
        return <CardVariant />;
      default:
        return <SpinnerVariant />;
    }
  };

  if (fullScreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`fixed inset-0 bg-gradient-to-b ${colors.bgGradient} flex items-center justify-center z-50 ${className}`}
      >
        {variant === 'card' ? (
          <div className="max-w-md mx-auto px-4">
            <CardVariant />
          </div>
        ) : (
          <div className={`${sizeClasses.container}`}>
            {renderVariant()}
            {title && (
              <h2 className={`${sizeClasses.text} font-semibold text-transparent bg-clip-text bg-gradient-to-r ${colors.text} mt-6 mb-2 text-center`}>
                {title}
              </h2>
            )}
            {message && (
              <p className="text-gray-600 text-center">{message}</p>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {renderVariant()}
    </div>
  );
};

export default LoadingManager;

// Named exports for specific use cases
export const OrdersLoading: React.FC<Omit<LoadingManagerProps, 'theme'>> = (props) => (
  <LoadingManager {...props} theme="orders" />
);

export const ProfileLoading: React.FC<Omit<LoadingManagerProps, 'theme'>> = (props) => (
  <LoadingManager {...props} theme="profile" />
);

export const ProductLoading: React.FC<Omit<LoadingManagerProps, 'theme'>> = (props) => (
  <LoadingManager {...props} theme="product" />
);

// Full screen variants
export const OrdersLoadingScreen: React.FC<{
  title?: string;
  message?: string;
}> = ({ title, message }) => (
  <OrdersLoading
    variant="card"
    fullScreen
    size="lg"
    title={title}
    message={message}
  />
);

export const ProfileLoadingScreen: React.FC<{
  title?: string;
  message?: string;
}> = ({ title, message }) => (
  <ProfileLoading
    variant="card"
    fullScreen
    size="lg"
    title={title}
    message={message}
  />
);

export const ProductLoadingScreen: React.FC<{
  title?: string;
  message?: string;
}> = ({ title, message }) => (
  <ProductLoading
    variant="card"
    fullScreen
    size="lg"
    title={title}
    message={message}
  />
);
