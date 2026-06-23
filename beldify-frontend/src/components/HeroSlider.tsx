'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
        setError(t('heroSlider.loadError', 'Error loading banner data'));
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [i18n.language, t]);

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
    }, 5000);

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
        <div className="relative h-[300px] xs:h-[350px] sm:h-[400px] md:h-[500px] lg:h-[600px] w-full rounded-2xl mx-auto max-w-[1920px] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
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
        <div className="relative h-[400px] sm:h-[450px] md:h-[500px] lg:h-[600px] w-full rounded-2xl mx-auto max-w-[1440px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-rose-700 font-medium mb-4">{error}</p>
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
        className="relative h-[300px] xs:h-[350px] sm:h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden w-full rounded-2xl mx-auto max-w-[1920px]"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {/* Slide Background */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
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
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.style.background = 'linear-gradient(135deg, #4338ca, #312e81)';
                }
              }}
            />

            {/* Subtle dark overlay for text readability */}
            <div className="absolute inset-0 bg-black/10"></div>
          </motion.div>
        </AnimatePresence>

        {/* Content Container */}
        <div className="relative w-full h-full flex items-center">
          <div className="container mx-auto px-4 sm:px-8 md:px-12 w-full">
            {/* Text Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`content-${currentSlide}`}
                initial={{ opacity: 0, x: currentSlideData.textPosition === 'right' ? 50 : -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: currentSlideData.textPosition === 'right' ? -50 : 50 }}
                transition={{ duration: 0.45, ease: [0.33, 1, 0.68, 1], delay: 0.1 }}
                className={`
                  ${currentSlideData.textColor}
                  flex flex-col justify-center
                  relative z-10
                  p-4 sm:p-6
                  rounded-2xl
                  backdrop-blur-sm
                  bg-black/50 sm:bg-black/40 lg:bg-black/30
                  max-w-[260px] xs:max-w-[280px] sm:max-w-[320px] md:max-w-[380px]
                  ${currentSlideData.textPosition === 'right' ? 'ml-auto mr-0' : 'mr-auto ml-0'}
                `}
              >
                {/* Subtitle */}
                {currentSlideData.subtitle && (
                  <motion.p
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, delay: 0.2, ease: [0.33, 1, 0.68, 1] }}
                    className="text-xs uppercase tracking-[0.18em] font-medium mb-2 text-amber-300 drop-shadow-md"
                  >
                    {currentSlideData.subtitle}
                  </motion.p>
                )}

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.25, ease: [0.33, 1, 0.68, 1] }}
                  className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 leading-tight drop-shadow-lg tracking-tight [text-shadow:_0_2px_10px_rgba(0,0,0,0.3)]"
                  style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                >
                  {currentSlideData.title}
                </motion.h1>

                {/* Description */}
                {currentSlideData.description && (
                  <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.3, ease: [0.33, 1, 0.68, 1] }}
                    className="text-sm sm:text-base mb-3 text-white/90 leading-relaxed drop-shadow-sm line-clamp-2 [text-shadow:_0_1px_2px_rgba(0,0,0,0.1)]"
                  >
                    {currentSlideData.description}
                  </motion.p>
                )}

                {/* CTA Button */}
                {currentSlideData.buttonText && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.35, ease: [0.33, 1, 0.68, 1] }}
                    className="mt-2 sm:mt-3"
                  >
                    <Link
                      href={currentSlideData.buttonLink}
                      className="inline-flex items-center justify-center bg-indigo-700 hover:bg-indigo-800 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-medium text-sm transition-all duration-[220ms] ease-[cubic-bezier(0.33,1,0.68,1)] shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 group w-full sm:w-auto"
                    >
                      <span>{currentSlideData.buttonText}</span>
                      <ChevronRight
                        className={`w-4 h-4 ${isRTL ? 'mr-1 rotate-180' : 'ml-1'} group-hover:translate-x-1 transition-transform duration-[220ms]`}
                      />
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation Arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              aria-label={t('heroSlider.prevSlide', 'Previous slide')}
              className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-2 sm:right-4 md:right-8' : 'left-2 sm:left-4 md:left-8'} z-10 bg-white/20 hover:bg-white/35 backdrop-blur-sm p-2 sm:p-3 rounded-full border border-white/30 text-white transition-all duration-[220ms] ease-[cubic-bezier(0.33,1,0.68,1)] focus:outline-none focus:ring-2 focus:ring-white/50 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center`}
            >
              <ChevronLeft className={`w-5 h-5 sm:w-6 sm:h-6 ${isRTL ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={goToNext}
              aria-label={t('heroSlider.nextSlide', 'Next slide')}
              className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-2 sm:left-4 md:left-8' : 'right-2 sm:right-4 md:right-8'} z-10 bg-white/20 hover:bg-white/35 backdrop-blur-sm p-2 sm:p-3 rounded-full border border-white/30 text-white transition-all duration-[220ms] ease-[cubic-bezier(0.33,1,0.68,1)] focus:outline-none focus:ring-2 focus:ring-white/50 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center`}
            >
              <ChevronRight className={`w-5 h-5 sm:w-6 sm:h-6 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          </>
        )}

        {/* Slide Indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                aria-label={t('heroSlider.goToSlide', `Go to slide ${index + 1}`)}
                className={`w-3 h-3 rounded-full transition-all duration-[220ms] ease-[cubic-bezier(0.33,1,0.68,1)] focus:outline-none focus:ring-2 focus:ring-white/50 ${
                  index === currentSlide
                    ? 'bg-white shadow-lg scale-110'
                    : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}

        {/* Progress Bar */}
        {slides.length > 1 && isAutoPlaying && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <motion.div
              key={currentSlide}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 5, ease: 'linear' }}
              className="h-full bg-amber-400/70"
            />
          </div>
        )}
      </div>
    </section>
  );
}
