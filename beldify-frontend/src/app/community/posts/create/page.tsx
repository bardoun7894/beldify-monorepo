'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ImageIcon,
  X,
  Tag,
  Wallet,
  Clock,
  FileText,
  Sparkles,
  Share2,
  Info,
  CheckCircle
} from 'lucide-react';
import { createCommunityPost } from '@/services/communityService';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/utils/consoleLogger';
import { CommunityPostFormData } from '@/types/community';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Link from 'next/link';
import { categoryService } from '@/services/categoryService';
import { Category } from '@/types/category';
import { useDirection } from '@/hooks/useDirection';
import { motion } from 'framer-motion';

export default function CreatePostPage() {
  const { t } = useTranslation();
  const { isRTL } = useDirection();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  // Helper for managing tag inputs
  const [inputValues, setInputValues] = useState({});

  // State for validation errors
  const [validationErrors, setValidationErrors] = useState<{
    title?: string;
    description?: string;
    categoryId?: string;
    budget?: string;
    images?: string;
    general?: string;
  }>({});

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    categoryId: string;
    timelineValue?: string;
    timelineUnit?: 'days' | 'weeks' | 'months';
    timeline?: string;
    budget?: {
      min: number;
      max: number;
      currency: string;
    };
    images?: File[];
  }>({
    title: '',
    description: '',
    categoryId: '',
    timeline: '1 weeks',
    timelineValue: '1',
    timelineUnit: 'weeks',
    budget: {
      min: 0,
      max: 0,
      currency: 'MAD'
    }
  });

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/community/posts/create');
    }
  }, [isAuthenticated, router]);

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const categoriesData = await categoryService.getAllCategories();
        setCategories(categoriesData);
      } catch (error) {
        logger.error('Error fetching categories:', error);
        setError(t('community.error_loading_categories') || 'Error loading categories');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [t]);

  const prefillProductId = searchParams.get('productId');
  const prefillProductName = searchParams.get('productName');
  const prefillProductImage = searchParams.get('productImage');

  // Pre-fill form with product data if provided via search params
  useEffect(() => {
    if (prefillProductId && prefillProductName) {
      setFormData(prev => ({
        ...prev,
        title: `Custom ${prefillProductName} - Similar Design Requested`,
        description: `I'm looking for a custom product similar to the ${prefillProductName} (Product ID: ${prefillProductId}). ${prefillProductImage ? 'Please see the reference image for the style I prefer.' : 'I can provide more details about the design I have in mind.'}\n\nPlease let me know if you can create something similar with custom modifications.`
      }));
    }
  }, [prefillProductId, prefillProductName, prefillProductImage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      budget: {
        ...prev.budget!,
        [name]: name === 'min' || name === 'max' ? parseFloat(value) : value
      }
    }));
  };

  // Custom file validation and handling
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  
  // Process selected files (from drag or input)
  const processFiles = useCallback((files: File[]) => {
    // Clear previous validation errors
    setValidationErrors(prev => ({ ...prev, images: '' }));
    
    // Validate image files (size < 5MB, types: jpg, png, gif, webp)
    const validFiles: File[] = [];
    const invalidFiles: { name: string; reason: string }[] = [];
    
    files.forEach(file => {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        invalidFiles.push({ name: file.name, reason: 'size' });
        return;
      }
      
      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        invalidFiles.push({ name: file.name, reason: 'type' });
        return;
      }
      
      validFiles.push(file);
    });
    
    // If there are invalid files, show error
    if (invalidFiles.length > 0) {
      // If it's a size issue
      if (invalidFiles.some(file => file.reason === 'size')) {
        setValidationErrors(prev => ({ 
          ...prev, 
          images: t('community.error_image_size')
        }));
      }
      // If it's a type issue
      else if (invalidFiles.some(file => file.reason === 'type')) {
        setValidationErrors(prev => ({ 
          ...prev, 
          images: t('community.error_image_type') 
        }));
      }
      
      // If there are no valid files, don't proceed
      if (validFiles.length === 0) return;
    }
    
    // Add valid files to form data
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), ...validFiles]
    }));
    
    // Generate preview URLs
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => [...prev, ...newPreviewUrls]);
  }, [t]);
  
  // Handle file drop events
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragActive) setIsDragActive(true);
  }, [isDragActive]);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    processFiles(files);
  }, [processFiles]);
  
  // Open file input dialog
  const openFileDialog = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);
  
  // Handle file selection from input
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processFiles(Array.from(files));
  };

  const removeImage = (index: number) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(previewImages[index]);
    
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }));
    
    // Clear image validation error if it exists and we have no images
    if (validationErrors.images && previewImages.length <= 1) {
      setValidationErrors(prev => ({ ...prev, images: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: {
      title?: string;
      description?: string;
      categoryId?: string;
      budget?: string;
      images?: string;
      general?: string;
    } = {};
    
    // Validate title (min 5 characters)
    if (!formData.title || formData.title.trim().length < 5) {
      errors.title = t('community.error_title_min_length', 'Title must be at least 5 characters');
    }
    
    // Validate description (min 20 characters)
    if (!formData.description || formData.description.trim().length < 20) {
      errors.description = t('community.error_description_min_length', 'Description must be at least 20 characters');
    }
    
    // Validate category
    if (!formData.categoryId) {
      errors.categoryId = t('community.error_category_required', 'Please select a category');
    }
    
    // Validate budget
    if (formData.budget) {
      if (formData.budget.min > formData.budget.max) {
        errors.budget = t('community.error_invalid_budget', 'Minimum budget cannot be greater than maximum');
      }
    }
    
    // Set validation errors
    setValidationErrors(errors);
    
    // Return true if no errors
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    // Validate form before submission
    if (!validateForm()) {
      // Scroll to the first error
      const firstErrorField = document.querySelector('.error-field');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create FormData for API
      const dataToSubmit = new FormData();
      dataToSubmit.append('title', formData.title);
      dataToSubmit.append('description', formData.description);
      dataToSubmit.append('category_id', formData.categoryId);
      
      // Add budget and timeline
      dataToSubmit.append('timeline', formData.timeline || '1 weeks');
      
      // Add budget data if it exists
      if (formData.budget) {
        dataToSubmit.append('budget', JSON.stringify(formData.budget));
        dataToSubmit.append('budget_min', formData.budget.min.toString());
        dataToSubmit.append('budget_max', formData.budget.max.toString());
        dataToSubmit.append('budget_currency', formData.budget.currency);
      } else {
        // Default budget values
        dataToSubmit.append('budget_min', '0');
        dataToSubmit.append('budget_max', '0');
        dataToSubmit.append('budget_currency', 'MAD');
      }
      
      // Add timeline
      dataToSubmit.append('timeline_value', formData.timelineValue || '1');
      dataToSubmit.append('timeline_unit', formData.timelineUnit || 'weeks');
      
      // Add images
      formData.images?.forEach((image, index) => {
        dataToSubmit.append(`images[${index}]`, image);
      });

      // Create post
      await createCommunityPost(dataToSubmit);
      
      // Redirect to community page on success
      router.push('/community');
      
    } catch (err: any) {
      logger.error('Error creating post:', err);
      
      // Handle validation errors from server
      if (err.response?.data?.errors) {
        const serverErrors = err.response.data.errors;
        const mappedErrors: any = {};
        
        // Map server error fields to our form fields
        if (serverErrors.title) mappedErrors.title = serverErrors.title[0];
        if (serverErrors.description) mappedErrors.description = serverErrors.description[0];
        if (serverErrors.category_id) mappedErrors.categoryId = serverErrors.category_id[0];
        
        setValidationErrors(mappedErrors);
        
        // Scroll to the first error
        const firstErrorField = document.querySelector('.error-field');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        setError(t('community.error_creating_post', 'Error creating post'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Editorial Hero Band */}
      <section className="bg-indigo-700 text-white py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/community"
            className="inline-flex items-center gap-1.5 text-indigo-200 hover:text-white text-sm font-medium mb-4 transition-colors duration-200"
          >
            <ArrowLeft size={16} />
            {t('common.back_to', 'Back to')} {t('openSouk.brand', 'Open Souk')}
          </Link>
          <p className="text-amber-300 text-xs uppercase tracking-[0.18em] font-medium mb-2">
            {t('openSouk.eyebrow', 'OPEN SOUK')}
          </p>
          <h1
            className="text-2xl sm:text-3xl font-bold leading-tight mb-2"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('community.create_request', 'Post a Bespoke Request')}
          </h1>
          {/* Customer-side AI chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs font-medium">
              <Sparkles size={11} className="shrink-0" />
              {t('ai.chip.suggestedMeasurements', 'AI suggested measurements')}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs font-medium">
              <Sparkles size={11} className="shrink-0" />
              {t('openSouk.aiTranslateChip', 'AI translates your brief to AR · EN · FR')}
            </span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Create Post Card */}
        <div className="bg-amber-50/40 rounded-2xl ring-1 ring-amber-200 overflow-hidden">
          {/* Form header */}
          <div className="p-6 border-b border-amber-200">
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-10 h-10 bg-indigo-700 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.full_name_en?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
                <h2 className="text-base sm:text-lg font-medium text-gray-900">
                  {t('community.what_is_custom_request', 'What is your custom request?')}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600">
                  {t('community.create_request_step2', 'Give your request a title and description')}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-0">
            {/* Image Upload Section */}
            <div className="p-6 border-b border-amber-200">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-1 flex items-center gap-1.5">
                  <ImageIcon size={16} className="text-indigo-700" />
                  {t('community.create_request_step3', 'Add photos to help sellers understand')}
                </h3>
                <p className="text-xs text-gray-600">
                  {t('community.photos_catch_attention', 'Photos help explain your request better')}
                </p>
              </div>

              {/* Drag & Drop Area */}
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`
                  relative group cursor-pointer flex flex-col justify-center items-center p-6 border-2 border-dashed
                  rounded-2xl transition-all duration-200 bg-white
                  ${isDragActive ? 'border-indigo-500 bg-amber-50/40' : 'border-amber-200 hover:border-amber-300'}
                  ${validationErrors.images ? 'border-rose-300 bg-rose-50' : ''}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  multiple
                  onChange={handleImageChange}
                  onClick={(e) => {
                    (e.target as HTMLInputElement).value = '';
                  }}
                />

                <div className="mb-3 rounded-full bg-amber-50 ring-1 ring-amber-200 p-3">
                  <ImageIcon size={28} className="text-amber-400" />
                </div>

                <p className="text-sm font-medium text-indigo-700 mb-1">
                  {isDragActive ? t('community.drag_photos_here') : t('community.drag_drop_images')}
                </p>
                <p className="text-xs text-gray-500 text-center mb-4">
                  {t('community.or_click_to_select')}
                </p>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openFileDialog();
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-indigo-700 rounded-full hover:bg-indigo-800 transition-colors duration-200"
                >
                  <ImageIcon size={14} />
                  {t('community.select_files')}
                </button>

                <p className="text-xs text-gray-400 mt-3 text-center">
                  {t('community.image_formats')}
                </p>
              </div>

              {/* Image Error Message */}
              {validationErrors.images && (
                <div className="mt-4 p-3 bg-rose-50 ring-1 ring-rose-200 rounded-2xl">
                  <p className="text-sm font-medium text-rose-700">{t('community.please_fix_errors')}</p>
                  <p className="text-sm text-rose-700">{validationErrors.images}</p>
                </div>
              )}

              {/* Image Previews */}
              {previewImages.length > 0 && (
                <div className="mt-5">
                  <h4 className="text-xs font-medium text-gray-700 mb-3 font-mono tracking-[0.15em] uppercase">
                    {t('community.uploaded_images', 'Uploaded Images')} ({previewImages.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {previewImages.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-2xl ring-1 ring-amber-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-7 h-7 bg-rose-700 text-white rounded-full flex items-center justify-center hover:bg-rose-800 transition-colors shadow-md"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Title and Description Section */}
            <div className="p-6 border-b border-amber-200">
              {/* Title Field */}
              <div className="mb-5">
                <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-1.5">
                  {t('common.title', 'Title')}
                </label>
                <input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder={t('community.create_request_step2', 'Give your request a title')}
                  maxLength={100}
                  className={`
                    w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-amber-300 focus:border-indigo-500 transition-all duration-200 text-sm
                    ${validationErrors.title ? 'border-rose-300 bg-rose-50' : 'border-gray-300'}
                    ${isRTL ? 'text-right' : 'text-left'}
                  `}
                />
                {validationErrors.title && (
                  <p className="mt-1 text-xs text-rose-700">{validationErrors.title}</p>
                )}
                <div className="mt-1 text-xs text-right text-gray-400">
                  {formData.title.length}/100
                </div>
              </div>

              {/* Description Field */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-1.5">
                  {t('community.description', 'Description')}
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder={t('community.custom_request_explanation', 'Describe what you need in detail')}
                  rows={5}
                  className={`
                    w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-amber-300 focus:border-indigo-500 transition-all duration-200 text-sm resize-none
                    ${validationErrors.description ? 'border-rose-300 bg-rose-50' : 'border-gray-300'}
                    ${isRTL ? 'text-right' : 'text-left'}
                  `}
                />
                {validationErrors.description && (
                  <p className="mt-1 text-xs text-rose-700">{validationErrors.description}</p>
                )}
                <div className="mt-1 text-xs text-right text-gray-400">
                  {formData.description.length}/500
                </div>
              </div>
            </div>

            {/* Category Section */}
            <div className="p-6 border-b border-amber-200">
              <div className="mb-3">
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-900 mb-1 flex items-center gap-1.5">
                  <Tag size={15} className="text-indigo-700" />
                  {t('community.category_name', 'Category')}
                </label>
                <p className="text-xs text-gray-600">
                  {t('community.pick_category', 'Select a category that best matches your request')}
                </p>
              </div>

              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                className={`
                  w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-amber-300 focus:border-indigo-500 transition-all duration-200 text-sm bg-white
                  ${validationErrors.categoryId ? 'border-rose-300 bg-rose-50' : 'border-gray-300'}
                  ${isRTL ? 'text-right' : 'text-left'}
                `}
              >
                <option value="">{t('community.select_category', 'اختار الصنف')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {isRTL ? category.name_ar : category.name}
                  </option>
                ))}
              </select>
              {validationErrors.categoryId && (
                <p className="mt-2 text-xs text-rose-700">{validationErrors.categoryId}</p>
              )}
            </div>

            {/* Budget Section */}
            <div className="p-6 border-b border-amber-200">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-900 mb-1 flex items-center gap-1.5">
                  <Wallet size={15} className="text-indigo-700" />
                  {t('community.budget_section')}
                </label>
                <p className="text-xs text-gray-600">
                  {t('community.budget_guidance')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="min" className="block text-sm font-medium text-gray-900 mb-1.5">
                    {t('community.from_price', 'Min')}
                  </label>
                  <input
                    type="number"
                    id="min"
                    name="min"
                    value={formData.budget?.min || ''}
                    onChange={handleBudgetChange}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-amber-300 focus:border-indigo-500 transition-all duration-200 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="max" className="block text-sm font-medium text-gray-900 mb-1.5">
                    {t('community.to_price', 'Max')}
                  </label>
                  <input
                    type="number"
                    id="max"
                    name="max"
                    value={formData.budget?.max || ''}
                    onChange={handleBudgetChange}
                    placeholder="1000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-amber-300 focus:border-indigo-500 transition-all duration-200 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-900 mb-1.5">
                    {t('community.currency', 'Currency')}
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.budget?.currency || 'MAD'}
                    onChange={handleBudgetChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-amber-300 focus:border-indigo-500 transition-all duration-200 text-sm"
                  >
                    <option value="MAD">{t('common.currency_mad', 'MAD')}</option>
                    <option value="USD">{t('common.currency_usd', 'USD')}</option>
                    <option value="EUR">{t('common.currency_eur', 'EUR')}</option>
                  </select>
                </div>
              </div>
              {validationErrors.budget && (
                <p className="mt-2 text-xs text-rose-700">{validationErrors.budget}</p>
              )}
              {/* Amber hint for positive budget signals */}
              <p className="mt-2 text-xs text-amber-700 font-medium">
                {t('community.budget_hint', 'Setting a clear budget attracts more focused bids.')}
              </p>
            </div>

            {/* Timeline Section */}
            <div className="p-6 border-b border-amber-200">
              <div className="mb-3">
                <label htmlFor="timelineValue" className="block text-sm font-medium text-gray-900 mb-1 flex items-center gap-1.5">
                  <Clock size={15} className="text-indigo-700" />
                  {t('community.timeline_section', 'الوقت اللي كتحتاجو فيه')}
                </label>
                <p className="text-xs text-gray-600">
                  {t('community.timeline_estimate', 'شحال من وقت محتاج باش يتكمل؟')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  id="timelineValue"
                  name="timelineValue"
                  value={formData.timelineValue || ''}
                  onChange={handleInputChange}
                  placeholder="1"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-amber-300 focus:border-indigo-500 transition-all duration-200 text-sm"
                />
                <select
                  id="timelineUnit"
                  name="timelineUnit"
                  value={formData.timelineUnit || 'weeks'}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-amber-300 focus:border-indigo-500 transition-all duration-200 text-sm"
                >
                  <option value="days">{t('community.timeline_days', 'أيام')}</option>
                  <option value="weeks">{t('community.timeline_weeks', 'أسابيع')}</option>
                  <option value="months">{t('community.timeline_months', 'شهور')}</option>
                </select>
              </div>
            </div>
            
            {/* Submit Section */}
            <div className="p-6">
              <div className="text-center mb-5">
                <p className="text-xs font-medium text-gray-700 flex items-center justify-center gap-1.5 mb-1">
                  <Share2 size={14} className="text-indigo-700" />
                  {t('community.share_request', 'نشر الطلب')}
                </p>
                <p className="text-xs text-gray-600">
                  {t('community.sellers_will_contact', 'البايعين غادي يتواصلو معاك')}
                </p>
              </div>

              {error && (
                <div className="mb-5 p-4 bg-rose-50 ring-1 ring-rose-200 rounded-2xl">
                  <p className="text-sm text-rose-700">{error}</p>
                </div>
              )}

              <div className="flex justify-center">
                {isLoading ? (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] bg-gray-300 text-white rounded-full text-sm font-semibold"
                  >
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('common.submitting', 'Submitting...')}
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] bg-indigo-700 hover:bg-indigo-800 text-white rounded-full text-sm font-semibold transition-colors duration-200"
                  >
                    {t('community.submit_request', 'نشر الطلب')}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
