'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageIcon, X, Wallet, Sparkles } from 'lucide-react';
import { CommunityResponseFormData } from '@/types/community';
import { useDirection } from '@/hooks/useDirection';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface ResponseFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export default function ResponseForm({ onSubmit, onCancel, isLoading }: ResponseFormProps) {
  const { t } = useTranslation();
  const { isRTL } = useDirection();

  const [formData, setFormData] = useState<CommunityResponseFormData>({
    description: '',
    images: [],
    price: 0,
    currency: 'MAD',
    sellerSkills: [],
    productSpecifications: []
  });

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.split(',').map(item => item.trim()).filter(item => item)
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newPreviewImages = filesArray.map(file => URL.createObjectURL(file));
      setPreviewImages(prev => [...prev, ...newPreviewImages]);
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...filesArray]
      }));
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewImages[index]);
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!formData.description.trim()) {
        throw new Error(t('community.error_description_required'));
      }
      if (formData.price !== undefined && formData.price < 0) {
        throw new Error(t('community.error_invalid_price'));
      }

      const dataToSubmit = new FormData();
      dataToSubmit.append('description', formData.description);

      if (formData.price !== undefined && formData.price > 0) {
        dataToSubmit.append('price', formData.price.toString());
        dataToSubmit.append('currency', formData.currency || 'MAD');
      }

      (formData.images || []).forEach(file => {
        dataToSubmit.append('images[]', file);
      });
      (formData.sellerSkills || []).forEach(skill => {
        dataToSubmit.append('seller_skills[]', skill);
      });
      (formData.productSpecifications || []).forEach(spec => {
        dataToSubmit.append('product_specifications[]', spec);
      });

      await onSubmit(dataToSubmit);
    } catch (err: any) {
      console.error('Error submitting response:', err);
      setError(err.message || t('community.error_submitting_response'));
    }
  };

  return (
    <div className="bg-amber-50/40 rounded-2xl ring-1 ring-amber-200 overflow-hidden">
      <div className="p-6">
        {/* Seller-side AI chip header */}
        <div className="flex items-center gap-2 mb-5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-700 text-white text-xs font-medium">
            <Sparkles size={12} className="shrink-0" />
            {t('ai.chip.photoEnhance', 'AI photo enhance for your portfolio')}
          </span>
        </div>

        {error && (
          <div className="bg-rose-50 ring-1 ring-rose-200 text-rose-700 p-4 rounded-2xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-1">
              {t('community.response_description')} <span className="text-rose-700">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-amber-300 focus:border-indigo-500 transition-all duration-200 resize-y ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={t('community.response_description_placeholder')}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-900 mb-1">
              {t('community.price_offer')}
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Wallet size={16} className="text-gray-400" />
                </div>
                <input
                  type="number"
                  name="price"
                  id="price"
                  min="0"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={handleNumberChange}
                  className="pl-10 block w-full border border-gray-300 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-indigo-500 text-sm transition-all duration-200"
                  placeholder="0.00"
                />
              </div>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="block w-24 border border-gray-300 rounded-2xl py-3 px-3 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-indigo-500 text-sm transition-all duration-200"
              >
                <option value="MAD">MAD</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          {/* Seller Skills */}
          <div>
            <label htmlFor="sellerSkills" className="block text-sm font-medium text-gray-900 mb-1">
              {t('community.seller_skills_label', 'Your Skills (comma-separated)')}
            </label>
            <input
              type="text"
              name="sellerSkills"
              id="sellerSkills"
              placeholder={t('community.seller_skills_placeholder', 'e.g., Embroidery, Tailoring, Design')}
              className={`mt-1 block w-full border border-gray-300 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-indigo-500 text-sm transition-all duration-200 ${isRTL ? 'text-right' : 'text-left'}`}
              value={(formData.sellerSkills || []).join(', ')}
              onChange={handleArrayChange}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Product Specifications */}
          <div>
            <label htmlFor="productSpecifications" className="block text-sm font-medium text-gray-900 mb-1">
              {t('community.product_specifications_label', 'Product Specifications (comma-separated)')}
            </label>
            <input
              type="text"
              name="productSpecifications"
              id="productSpecifications"
              placeholder={t('community.product_specifications_placeholder', 'e.g., Silk, Hand-stitched, Custom size')}
              className={`mt-1 block w-full border border-gray-300 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-indigo-500 text-sm transition-all duration-200 ${isRTL ? 'text-right' : 'text-left'}`}
              value={(formData.productSpecifications || []).join(', ')}
              onChange={handleArrayChange}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {t('community.response_images')}
            </label>

            {/* Upload zone */}
            <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-amber-200 border-dashed rounded-2xl hover:border-amber-300 transition-colors duration-200">
              <div className="space-y-1 text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-amber-300" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="response-images" className="relative cursor-pointer bg-transparent rounded-md font-medium text-indigo-700 hover:text-indigo-800 focus-within:outline-none">
                    <span>{t('common.upload_images')}</span>
                    <input
                      id="response-images"
                      name="images"
                      type="file"
                      multiple
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImageChange}
                    />
                  </label>
                  <p className="pl-1">{t('common.or_drag_drop')}</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>

            {/* Image Previews */}
            {previewImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {previewImages.map((src, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square w-full overflow-hidden rounded-2xl bg-amber-50 ring-1 ring-amber-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Preview ${index + 1}`} className="h-full w-full object-cover object-center" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-rose-700 text-white rounded-full p-1 shadow-md opacity-90 hover:opacity-100 transition-opacity min-h-[24px] min-w-[24px]"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-amber-100">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2.5 min-h-[44px] border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-300 transition-colors duration-200"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-full text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-300 transition-colors duration-200 disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner className="h-4 w-4" />
                  {t('common.submitting')}
                </>
              ) : (
                t('community.submit_response')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
