'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { bannerService, Banner } from '../services/api/bannerService';

interface SlideData {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  backgroundImage: string;
  textColor: string;
  accentColor: string;
  textPosition: 'left' | 'right';
}

export default function HeroSlider() {
  const { t, i18n } = useTranslation();
  // Check for Arabic language code (both 'ar' and 'ma' if that's used in your system)
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';

  // State for API data
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch banners from API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        const data = await bannerService.getHeroBanners();
        setBanners(data);
      } catch (err) {
        console.error('Error fetching banners:', err);
        setError('Error loading banner data');
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [i18n.language]);

  // Map API data to slide format or use fallback slides
  const slides: SlideData[] = useMemo(() => {
    if (banners.length === 0) {
      // Fallback slides if no banners available
      return [
        {
          id: 1,
          title: t('hero.slide1.title', 'تجربة تسوق متكاملة'),
          subtitle: t('hero.slide1.subtitle', 'اكتشف أحدث صيحات الموضة'),
          description: t('hero.slide1.description', 'مجموعة واسعة من المنتجات عالية الجودة بأفضل الأسعار'),
          buttonText: t('hero.slide1.button', 'تسوق الآن'),
          buttonLink: '/products',
          backgroundImage: '/images/hero-bg-1.jpg',
          textColor: 'text-white',
          accentColor: 'amber',
          textPosition: 'left'
        }
      ];
    }
    
    // Filter banners by current language if needed
    const languageBanners = banners.filter(banner => {
      // If the banner has a language property and it doesn't match current language, filter it out
      if (banner.language && banner.language !== i18n.language) {
        return false;
      }
      return true;
    });

    // If no banners for current language, use all banners
    const displayBanners = languageBanners.length > 0 ? languageBanners : banners;
    
    return displayBanners.map(banner => ({
      id: banner.id,
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      description: '',
      buttonText: banner.button_text || '',
      buttonLink: banner.button_link || '#',
      backgroundImage: banner.image_url,
      textColor: 'text-white',
      accentColor: 'amber',
      textPosition: banner.text_position || 'left'
    }));
  }, [banners, i18n.language, t]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-slide functionality
  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [slides.length, isAutoPlaying]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToNext = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  // Show loading state
  if (loading && banners.length === 0) {
    return (
      <section className="py-4 md:py-6 px-4">
        <div className="relative h-[300px] xs:h-[350px] sm:h-[400px] md:h-[500px] lg:h-[600px] w-full rounded-lg sm:rounded-xl md:rounded-2xl mx-auto max-w-[1920px] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600 mb-4"></div>
            <p className="text-gray-600 font-medium">{t('common.loading', 'Loading...')}</p>
          </div>
        </div>
      </section>
    );
  }

  // Show error state
  if (error && banners.length === 0) {
    return (
      <section className="py-4 md:py-6 px-4">
        <div className="relative h-[400px] sm:h-[450px] md:h-[500px] lg:h-[600px] w-full rounded-xl md:rounded-2xl mx-auto max-w-[1440px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <p className="text-gray-600">{t('common.tryAgain', 'Please try again later')}</p>
          </div>
        </div>
      </section>
    );
  }

  // If no slides available after loading
  if (slides.length === 0) {
    return null;
  }

  const currentSlideData = slides[currentSlide];

  return (
    <section className="py-4 md:py-6 px-4">
      <div 
        className="relative h-[300px] xs:h-[350px] sm:h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden w-full rounded-lg sm:rounded-xl md:rounded-2xl mx-auto max-w-[1920px]"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
      {/* Slide Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 overflow-hidden"
        >
          {/* Background Image */}
          <Image
            src={currentSlideData.backgroundImage}
            alt={currentSlideData.title}
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover' }}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to a solid color background on error
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.style.background = 'linear-gradient(135deg, #6366f1, #8b5cf6)';
              }
            }}
          />
          
          {/* Background Image Overlay - subtle dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/10"></div>
        </motion.div>
      </AnimatePresence>

      {/* Content Container */}
      <div className="relative w-full h-full flex items-center">
        <div className="container mx-auto px-4 sm:px-8 md:px-12 w-full">
          {/* Text Content - Positioned based on banner data */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${currentSlide}`}
              initial={{ opacity: 0, x: currentSlideData.textPosition === 'right' ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: currentSlideData.textPosition === 'right' ? -50 : 50 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              className={`
                ${currentSlideData.textColor} 
                flex flex-col justify-center
                relative z-10
                lg:bg-transparent
                p-4 sm:p-6
                rounded-xl
                backdrop-blur-sm
                bg-black/50 sm:bg-black/40 lg:bg-black/30
                max-w-[260px] xs:max-w-[280px] sm:max-w-[320px] md:max-w-[380px]
                ${currentSlideData.textPosition === 'right' ? 'ml-auto mr-0' : 'mr-auto ml-0'}
              `}
            >
              {/* Subtitle - Moved above title */}
              {currentSlideData.subtitle && (
                <motion.h2 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="
                    text-sm sm:text-base
                    font-medium mb-1 sm:mb-2 
                    text-white/90 
                    drop-shadow-md
                    tracking-wide
                  "
                >
                  {currentSlideData.subtitle}
                </motion.h2>
              )}

              {/* Title */}
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="
                  text-lg sm:text-xl md:text-2xl lg:text-3xl
                  font-bold
                  mb-2 sm:mb-3
                  leading-tight 
                  drop-shadow-lg
                  tracking-tight
                  [text-shadow:_0_2px_10px_rgba(0,0,0,0.3)]
                "
              >
                {currentSlideData.title}
              </motion.h1>

              {/* Description - Only show if available */}
              {currentSlideData.description && (
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="
                    text-sm sm:text-base
                    mb-3
                    text-white/90 
                    leading-relaxed 
                    drop-shadow-sm
                    line-clamp-2
                    [text-shadow:_0_1px_2px_rgba(0,0,0,0.1)]
                  "
                >
                  {currentSlideData.description}
                </motion.p>
              )}

              {/* CTA Button - Only show if button text is available */}
              {currentSlideData.buttonText && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="mt-2 sm:mt-3"
                >
                  <Link
                    href={currentSlideData.buttonLink}
                    className="
                      inline-flex items-center justify-center 
                      bg-gradient-to-r from-indigo-600 to-purple-600 
                      hover:from-indigo-700 hover:to-purple-700 
                      text-white 
                      px-4 sm:px-5
                      py-2 sm:py-2.5
                      rounded-lg
                      font-medium
                      text-sm
                      transition-all duration-300 
                      shadow-lg hover:shadow-xl 
                      transform hover:scale-105 
                      focus:outline-none focus:ring-2 focus:ring-indigo-500/30 
                      group
                      relative
                      overflow-hidden
                      w-full sm:w-auto
                    "
                  >
                    <span className="relative z-10">{currentSlideData.buttonText}</span>
                    <ChevronRightIcon 
                      className={`
                        w-4 h-4
                        ${isRTL ? 'mr-1 rotate-180' : 'ml-1'} 
                        group-hover:translate-x-1 
                        transition-transform duration-200
                        relative z-10
                      `} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right side content area - kept empty for better layout */}
      <div className={`hidden lg:block ${isRTL ? 'lg:order-1' : 'lg:order-2'}`}></div>

      {/* Navigation Arrows - Only show if more than one slide */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-2 sm:right-4 md:right-8' : 'left-2 sm:left-4 md:left-8'} z-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 sm:p-3 rounded-full border border-white/30 text-white hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 touch-manipulation`}
          >
            <ChevronLeftIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${isRTL ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={goToNext}
            className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-2 sm:left-4 md:left-8' : 'right-2 sm:right-4 md:right-8'} z-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 sm:p-3 rounded-full border border-white/30 text-white hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 touch-manipulation`}
          >
            <ChevronRightIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
        </>
      )}

      {/* Slide Indicators - Only show if more than one slide */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                index === currentSlide
                  ? 'bg-white shadow-lg scale-110'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* Progress Bar - Only show if more than one slide and auto-playing */}
      {slides.length > 1 && isAutoPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <motion.div
            key={currentSlide}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 5, ease: "linear" }}
            className="h-full bg-white/60"
          />
        </div>
      )}
      </div>
    </section>
  );
}
