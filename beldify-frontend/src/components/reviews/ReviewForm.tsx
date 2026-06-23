import React, { useState, ChangeEvent, FormEvent, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CreateReviewRequest } from '@/types/review';
import { CameraIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/classNames';
import logger from '@/utils/consoleLogger';

interface ReviewFormProps {
  productId: string;
  onSubmitSuccess: (newReview: any) => void; // Callback after successful submission
  onCancel?: () => void;
  // Service to create review, could be mock or real
  createReviewService: (productId: string, data: CreateReviewRequest, files?: File[]) => Promise<any>;
}

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE_MB = 5;

export const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  onSubmitSuccess,
  onCancel,
  createReviewService,
}) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Track current previews via ref so the unmount cleanup sees the latest list
  // without re-running on every change (the previous [imagePreviews] dep array
  // revoked URLs from the prior render, breaking thumbnails after a 2nd image).
  const imagePreviewsRef = useRef<string[]>([]);
  useEffect(() => {
    imagePreviewsRef.current = imagePreviews;
  }, [imagePreviews]);

  useEffect(() => {
    return () => {
      imagePreviewsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    if (formError && newRating > 0) setFormError(null); 
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const newImages: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      if (images.length + newImages.length >= MAX_IMAGES) {
        setError(t('reviews.form.max_images_reached', { count: MAX_IMAGES }));
        break;
      }
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        setError(t('reviews.form.image_too_large', { size: MAX_IMAGE_SIZE_MB }));
        continue;
      }
      newImages.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setImages(prev => [...prev, ...newImages]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    if (images.length -1 < MAX_IMAGES) setError(null); 
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (rating === 0) {
      setFormError(t('reviews.form.rating_required'));
      return;
    }
    if (!content.trim()) {
      setFormError(t('reviews.form.content_required'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // The real backend uploads the image File[] as multipart and derives the
      // author from the authenticated session — so we pass the files through.
      const reviewData: CreateReviewRequest = {
        productId,
        rating,
        title,
        content,
      };

      const newReview = await createReviewService(productId, reviewData, images);
      onSubmitSuccess(newReview);
      // Reset form
      setRating(0);
      setTitle('');
      setContent('');
      setImages([]);
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      setImagePreviews([]);
    } catch (err) {
      logger.error('Review submission error:', err);
      setError(t('reviews.form.submit_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 md:p-8 rounded-2xl shadow-sm ring-1 ring-gray-200 relative overflow-hidden">
      
      <div>
        <Label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-2">
          {t('reviews.form.your_rating')} <span className="text-red-500">*</span>
        </Label>
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => handleRatingChange(star)}
              className={cn(
                "focus:outline-none transition-transform hover:scale-110",
                (hoverRating || rating) >= star ? "text-amber-400" : "text-gray-300"
              )}
              aria-label={`${star} star rating`}
            >
              {(hoverRating || rating) >= star ? (
                <StarIcon className="h-9 w-9 drop-shadow-md" />
              ) : (
                <StarIconOutline className="h-9 w-9" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="review-title" className="block text-sm font-medium text-gray-700 mb-1">
          {t('reviews.form.title_label')}
        </Label>
        <Input
          id="review-title"
          type="text"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          placeholder={t('reviews.form.title_placeholder')}
          className="mt-1 w-full border-gray-300 focus:border-indigo-400 focus:ring-indigo-300 shadow-sm"
          maxLength={100}
        />
      </div>

      <div>
        <Label htmlFor="review-content" className="block text-sm font-medium text-gray-700 mb-1">
          {t('reviews.form.content_label')} <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="review-content"
          value={content}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
          placeholder={t('reviews.form.content_placeholder')}
          className="mt-1 w-full border-gray-300 focus:border-indigo-400 focus:ring-indigo-300 shadow-sm"
          rows={4}
          required
        />
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">
          {t('reviews.form.add_photos_label')} ({images.length}/{MAX_IMAGES})
        </Label>
        <div className="mt-2 flex items-center flex-wrap gap-4">
          {imagePreviews.map((previewUrl, index) => (
            <div key={index} className="relative w-24 h-24 border border-gray-200 rounded-lg overflow-hidden group shadow-md transition-all duration-200 hover:shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element -- blob: objectURL from URL.createObjectURL; next/image cannot handle blob URLs */}
              <img src={previewUrl} alt={t('reviews.review_image')} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full p-0.5 hover:bg-opacity-80 transition-all opacity-0 group-hover:opacity-100"
                aria-label={t('common.remove')}
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <label htmlFor="review-images" className="cursor-pointer w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-amber-400 transition-all duration-200 text-gray-500 hover:text-amber-700 hover:shadow-md">
              <CameraIcon className="h-8 w-8" />
              <span className="mt-1 text-xs text-center">{t('reviews.form.upload_image')}</span>
              <input
                id="review-images"
                type="file"
                multiple
                accept="image/jpeg, image/png, image/webp"
                onChange={handleImageChange}
                className="sr-only"
                disabled={images.length >= MAX_IMAGES}
              />
            </label>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>}
      </div>

      {formError && <p className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded-md">{formError}</p>}

      <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-3 pt-4 border-t border-gray-100">
        {onCancel && (
          <Button 
            type="button" 
            onClick={onCancel} 
            disabled={isSubmitting}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-none"
          >
            {t('common.cancel')}
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isSubmitting} 
          className={cn(
            "w-full sm:w-auto transition-all duration-300",
            isSubmitting
              ? "bg-gray-400"
              : "bg-indigo-700 hover:bg-indigo-800 text-white shadow-sm"
          )}
        >
          {isSubmitting ? t('reviews.uploading') : t('reviews.form.submit_review')}
        </Button>
      </div>
    </form>
  );
};
