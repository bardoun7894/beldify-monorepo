import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { Product } from '@/types/product';
import { traditionalWearService } from '@/services/traditionalWearService';
import ProductCard from '../products/ProductCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';

interface TraditionalWearSectionProps {
  category: 'men' | 'women' | 'children';
  title?: string;
}

const TraditionalWearSection: React.FC<TraditionalWearSectionProps> = ({ 
  category,
  title
}) => {
  const { t } = useTranslation('common');
  const { currentLanguage } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      switch (category) {
        case 'men':
          response = await traditionalWearService.getMensTraditionalWear(currentLanguage);
          break;
        case 'women':
          response = await traditionalWearService.getWomensTraditionalWear(currentLanguage);
          break;
        case 'children':
          response = await traditionalWearService.getChildrensTraditionalWear(currentLanguage);
          break;
        default:
          throw new Error('Invalid category');
      }
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setProducts(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProducts();
  }, [category, currentLanguage]);

  // Generate section title if not provided
  const sectionTitle = title || (
    category === 'men' 
      ? t('mens_traditional_wear')
      : category === 'women'
        ? t('womens_traditional_wear')
        : t('childrens_traditional_wear')
  );

  const viewAllText = t('view_all');
  const fastDeliveryText = t('fast_delivery');
  const noImageText = t('no_image_available');

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{sectionTitle}</h2>
          <a href={`/category/${category}`} className="text-primary hover:underline">
            {viewAllText}
          </a>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <ErrorMessage message={error} action={{
            label: t('common.actions.tryAgain'),
            onClick: () => fetchProducts()
          }} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                fastDeliveryText={fastDeliveryText}
                noImageText={noImageText}
              />
            ))}
            
            {products.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p>{t('no_products_found')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default TraditionalWearSection;
