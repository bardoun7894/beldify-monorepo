'use client';

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Minus, Plus, Check, AlertTriangle, X } from 'lucide-react';

interface StockStatusProps {
  quantity: number;
  stockQuantity: number;
  onQuantityChange?: (newQuantity: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showControls?: boolean;
  className?: string;
}

export default function StockStatus({
  quantity,
  stockQuantity,
  onQuantityChange,
  size = 'md',
  showControls = true,
  className,
}: StockStatusProps) {
  const { t } = useTranslation();

  const isOutOfStock = stockQuantity === 0;
  const isLowStock = stockQuantity > 0 && stockQuantity <= 10;
  const isInStock = stockQuantity > 10;
  const stockPercentage = Math.min((stockQuantity > 0 ? quantity / stockQuantity : 0) * 100, 100);
  const remainingStock = stockQuantity - quantity;

  const getStockColor = () => {
    if (isOutOfStock) return 'bg-red-500';
    if (quantity >= stockQuantity) return 'bg-red-500';
    if (quantity > stockQuantity * 0.8) return 'bg-amber-500';
    if (isLowStock) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const getStockMessage = () => {
    if (isOutOfStock) return t('stock.out_of_stock');
    if (quantity >= stockQuantity) return t('stock.max_reached', { max: stockQuantity });
    if (isLowStock) return t('stock.low_stock', { count: remainingStock });
    if (stockQuantity > 5) return t('stock.in_stock', { count: stockQuantity });
    return t('stock.in_stock', { count: remainingStock });
  };

  const getStockIcon = () => {
    if (isOutOfStock) return <X className="h-4 w-4" />;
    if (quantity >= stockQuantity) return <AlertTriangle className="h-4 w-4" />;
    if (isLowStock) return <AlertTriangle className="h-4 w-4" />;
    return <Check className="h-4 w-4" />;
  };

  const sizeClasses = {
    sm: 'h-1.5 text-xs',
    md: 'h-2 text-sm',
    lg: 'h-3 text-base',
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Stock Status Badge - Only show for out of stock or low stock */}
      {(isOutOfStock || isLowStock || quantity >= stockQuantity) && (
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg w-fit",
          isOutOfStock ? "bg-red-50 text-red-700" :
          "bg-amber-50 text-amber-700",
          size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
        )}>
          {getStockIcon()}
          <span className="font-medium">{getStockMessage()}</span>
        </div>
      )}

      {/* Stock Progress Bar */}
      {!isOutOfStock && (
        <div className="relative w-full">
          <div className={cn(
            "w-full bg-gray-100 rounded-full overflow-hidden shadow-inner",
            sizeClasses[size]
          )}>
            <div
              className={cn(
                "transition-all duration-300 ease-in-out rounded-full",
                getStockColor(),
                sizeClasses[size]
              )}
              style={{
                width: `${stockPercentage}%`,
                boxShadow: "0 1px 2px rgba(0,0,0,0.1) inset"
              }}
            />
          </div>

          {/* Stock Counter */}
          <div className={cn(
            "flex justify-between items-center mt-1.5",
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}>
            <span className="text-gray-500">
              {t('stock.selected')}: <span className={cn("font-medium", quantity >= stockQuantity ? "text-red-600" : "")}>{quantity}</span>
            </span>
            <span className={cn("text-gray-500", isLowStock ? "text-amber-600 font-medium" : "")}>
              {t('stock.available')}: <span className={cn("font-medium", isLowStock ? "text-amber-600" : "")}>{stockQuantity}</span>
            </span>
          </div>
        </div>
      )}

      {/* Quantity Controls */}
      {showControls && !isOutOfStock && onQuantityChange && (
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => quantity > 1 && onQuantityChange(quantity - 1)}
            disabled={quantity <= 1}
            className={cn(
              "p-2 rounded-xl transition-all duration-200",
              "border border-amber-200 bg-white hover:bg-amber-50 active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700/30"
            )}
            aria-label={t('stock.decrease_quantity')}
          >
            <Minus className="w-4 h-4 text-gray-700" />
          </button>

          <div className="relative">
            <input
              type="number"
              min="1"
              max={stockQuantity}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 1 && val <= stockQuantity) {
                  onQuantityChange(val);
                }
              }}
              className="w-16 text-center font-medium border border-amber-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700"
            />
          </div>

          <button
            onClick={() => quantity < stockQuantity && onQuantityChange(quantity + 1)}
            disabled={quantity >= stockQuantity}
            className={cn(
              "p-2 rounded-xl transition-all duration-200",
              "border border-amber-200 bg-white hover:bg-amber-50 active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700/30"
            )}
            aria-label={t('stock.increase_quantity')}
          >
            <Plus className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      )}
    </div>
  );
}
