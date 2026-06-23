'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ImageIcon, X, Wallet, Clock, Send, AlertCircle } from 'lucide-react';
import { CommunityResponseFormData } from '@/types/community';
import { useDirection } from '@/hooks/useDirection';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ProposalAiDraft, ProposalAiDraftData } from './ProposalAiDraft';
import logger from '@/utils/consoleLogger';

interface ResponseFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  /** When provided, shows the "Draft with AI" button for the given post */
  postId?: number;
}

export default function ResponseForm({ onSubmit, onCancel, isLoading, postId }: ResponseFormProps) {
  const { t } = useTranslation();
  const { isRTL } = useDirection();

  const [formData, setFormData] = useState<CommunityResponseFormData>({
    description: '',
    images: [],
    price: 0,
    currency: 'MAD',
    delivery_days: undefined,
    sellerSkills: [],
    productSpecifications: [],
  });

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  /** Apply AI-drafted values to the form fields — seller edits before submitting */
  const handleApplyAiDraft = (draft: ProposalAiDraftData) => {
    setFormData(prev => ({
      ...prev,
      description: draft.pitch,
      price: draft.suggested_price_range.min,
      delivery_days: draft.suggested_delivery_days,
    }));
  };

  const msgMax = 1000;
  const msgLen = formData.description.length;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleDeliveryDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setFormData(prev => ({ ...prev, delivery_days: isNaN(value) ? undefined : value }));
  };

  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
        .split(',')
        .map(item => item.trim())
        .filter(item => item),
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newPreviewImages = filesArray.map(file => URL.createObjectURL(file));
      setPreviewImages(prev => [...prev, ...newPreviewImages]);
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...filesArray],
      }));
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewImages[index]);
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!formData.description.trim()) {
        throw new Error(t('community.error_description_required', 'Cover message is required'));
      }
      if (formData.price !== undefined && formData.price < 0) {
        throw new Error(t('community.error_invalid_price', 'Price must be a positive number'));
      }

      const dataToSubmit = new FormData();
      dataToSubmit.append('description', formData.description);

      if (formData.price !== undefined && formData.price > 0) {
        dataToSubmit.append('price', formData.price.toString());
        dataToSubmit.append('currency', formData.currency || 'MAD');
      }

      if (formData.delivery_days != null && formData.delivery_days > 0) {
        dataToSubmit.append('delivery_days', String(formData.delivery_days));
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
    } catch (err) {
      logger.error('Error submitting response:', err);
      setError(
        err instanceof Error
          ? err.message
          : t('community.error_submitting_response', 'Failed to submit proposal')
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
      className="overflow-hidden"
    >
      {/* Form header */}
      <div className="px-5 py-4 bg-indigo-950 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white text-sm">
            {t('community.submit_proposal', 'Submit Your Proposal')}
          </h3>
          <p className="text-xs text-indigo-300 mt-0.5">
            {t('community.proposal_subtitle', 'Make a compelling offer to the buyer')}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-indigo-300 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-indigo-800"
          aria-label={t('common.cancel', 'Cancel')}
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-5 bg-white">
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-start gap-2.5 bg-rose-50 ring-1 ring-rose-200 text-rose-700 p-3.5 rounded-xl mb-5 text-sm"
          >
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ── AI draft assist — shown only when postId is provided ── */}
          {postId != null && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">
                {t('opensoukAi.draft_prelude', 'Need a head start?')}
              </span>
              <ProposalAiDraft
                postId={postId}
                onApplyDraft={handleApplyAiDraft}
                isRTL={isRTL}
              />
            </div>
          )}

          {/* ── Bid panel: price + delivery in a highlighted card ── */}
          <div className="bg-gray-50 rounded-2xl ring-1 ring-gray-200 p-4">
            <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-3">
              {t('community.your_bid', 'Your Bid')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-xs font-medium text-gray-700 mb-1.5">
                  {t('community.price_offer', 'Proposed price')}
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                      <Wallet size={13} className="text-amber-600" />
                    </div>
                    <input
                      type="number"
                      name="price"
                      id="price"
                      min="0"
                      step="1"
                      value={formData.price || ''}
                      onChange={handleNumberChange}
                      className="ps-9 block w-full border border-gray-200 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 text-sm font-semibold transition-all duration-200 bg-white"
                      placeholder="0"
                    />
                  </div>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-20 border border-gray-200 rounded-xl py-2.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 text-sm transition-all duration-200 bg-white"
                  >
                    <option value="MAD">MAD</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              {/* Delivery days */}
              <div>
                <label
                  htmlFor="delivery_days"
                  className="block text-xs font-medium text-gray-700 mb-1.5"
                >
                  {t('community.delivery_days_label', 'Delivery (days)')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                    <Clock size={13} className="text-indigo-500" />
                  </div>
                  <input
                    type="number"
                    id="delivery_days"
                    name="delivery_days"
                    min="1"
                    max="365"
                    step="1"
                    value={formData.delivery_days ?? ''}
                    onChange={handleDeliveryDaysChange}
                    className="ps-9 block w-full border border-gray-200 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 text-sm font-semibold transition-all duration-200 bg-white"
                    placeholder={t('community.delivery_days_placeholder', 'e.g. 14')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Cover message ─────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-gray-900"
              >
                {t('community.response_description', 'Cover message')}
                <span className="text-rose-600 ms-0.5" aria-hidden="true">*</span>
              </label>
              <span
                className={`text-[11px] font-mono ${
                  msgLen > msgMax * 0.9 ? 'text-rose-600' : 'text-gray-400'
                }`}
              >
                {msgLen}/{msgMax}
              </span>
            </div>
            <textarea
              id="description"
              name="description"
              rows={5}
              maxLength={msgMax}
              value={formData.description}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 transition-all duration-200 resize-none text-sm leading-relaxed ${
                isRTL ? 'text-right' : 'text-left'
              }`}
              placeholder={t(
                'community.response_description_placeholder',
                'Explain your approach, experience, and why you\'re the right fit for this request…'
              )}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>

          {/* ── Seller skills ──────────────────────────────────────── */}
          <div>
            <label
              htmlFor="sellerSkills"
              className="block text-sm font-semibold text-gray-900 mb-1.5"
            >
              {t('community.seller_skills_label', 'Relevant skills')}
              <span className="ms-1 text-[11px] font-normal text-gray-400">
                {t('common.optional', '(optional)')}
              </span>
            </label>
            <input
              type="text"
              name="sellerSkills"
              id="sellerSkills"
              placeholder={t(
                'community.seller_skills_placeholder',
                'e.g., Embroidery, Tailoring, Design'
              )}
              className={`block w-full border border-gray-200 rounded-2xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 text-sm transition-all duration-200 ${
                isRTL ? 'text-right' : 'text-left'
              }`}
              value={(formData.sellerSkills || []).join(', ')}
              onChange={handleArrayChange}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            <p className="mt-1 text-[11px] text-gray-400">
              {t('community.skills_comma_hint', 'Separate with commas')}
            </p>
          </div>

          {/* ── Reference image upload ─────────────────────────────── */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              {t('community.response_images', 'Portfolio / reference images')}
              <span className="ms-1 text-[11px] font-normal text-gray-400">
                {t('common.optional', '(optional)')}
              </span>
            </label>

            <label
              htmlFor="response-images"
              className="flex flex-col items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-gray-200 rounded-2xl py-6 px-4 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-full bg-amber-50 ring-1 ring-amber-200 flex items-center justify-center">
                <ImageIcon size={18} className="text-amber-500" />
              </div>
              <span className="text-sm font-medium text-indigo-700">
                {t('common.upload_images', 'Upload images')}
              </span>
              <span className="text-xs text-gray-400">PNG, JPG, GIF — up to 10 MB</span>
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

            {previewImages.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {previewImages.map((src, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square w-full overflow-hidden rounded-xl bg-amber-50 ring-1 ring-amber-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`${t('community.preview', 'Preview')} ${index + 1}`}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1.5 -end-1.5 bg-rose-700 text-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity min-h-[22px] min-w-[22px] flex items-center justify-center"
                      aria-label={t('common.remove_image', 'Remove image')}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Form actions ─────────────────────────────────────────── */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-5 py-2.5 min-h-[44px] border border-gray-200 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 transition-colors duration-200"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.description.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 min-h-[44px] rounded-full text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 transition-colors duration-200 disabled:opacity-60 shadow-sm"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner className="h-4 w-4" />
                  {t('common.submitting', 'Submitting…')}
                </>
              ) : (
                <>
                  <Send size={14} />
                  {t('community.submit_response', 'Submit Proposal')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
