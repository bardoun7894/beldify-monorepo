'use client';

import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, MapPin, Calendar, Clock, MessageCircle, BadgeCheck, Ruler } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import tailorService, { Tailor, TimeSlot } from '@/services/tailorService';
import toast from '@/utils/toast';

interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
  service: string;
}

interface Service {
  id: string;
  name: string;
  price: string;
  duration: string;
}

export default function TailorProfilePage({ params }: { params: { id: string } }) {
  const { t } = useTranslation();
  const [tailor, setTailor] = useState<Tailor | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    loadTailorData();
  }, [loadTailorData]);

  useEffect(() => {
    loadTimeSlots();
  }, [loadTimeSlots]);

  const loadTailorData = async () => {
    try {
      const response = await tailorService.getTailor(params.id);
      setTailor(response.data);
    } catch (error: any) {
      toast.error(error.message || t('tailoring.profile.load_error'));
    } finally {
      setLoading(false);
    }
  };

  const loadTimeSlots = async () => {
    if (!selectedDate) return;

    try {
      const response = await tailorService.getTimeSlots(params.id, selectedDate);
      setTimeSlots(response.data);
    } catch (error: any) {
      toast.error(error.message || t('tailoring.booking.slots_load_error'));
    }
  };

  const handleBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTimeSlot) return;

    setBookingLoading(true);
    try {
      await tailorService.createBooking(params.id, {
        service_id: parseInt(selectedService),
        date: selectedDate,
        time: selectedTimeSlot,
      });

      toast.success(t('tailoring.booking.success'));
      setIsBookingModalOpen(false);

      // Reset form
      setSelectedService(null);
      setSelectedDate(null);
      setSelectedTimeSlot(null);
    } catch (error: any) {
      toast.error(error.message || t('tailoring.booking.error'));
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50/40 flex items-center justify-center">
        {/* Atlas-styled loading skeleton */}
        <div className="w-full max-w-3xl px-6 space-y-6 animate-pulse">
          <div className="h-48 rounded-2xl bg-indigo-950/80" />
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 h-48 rounded-2xl bg-amber-100/70" />
            <div className="h-48 rounded-2xl bg-amber-100/70" />
          </div>
          <div className="h-6 w-1/2 rounded-full bg-amber-100/70" />
          <div className="h-4 w-3/4 rounded-full bg-amber-100/50" />
        </div>
      </div>
    );
  }

  if (!tailor) {
    return (
      <div className="min-h-screen bg-amber-50/40 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 ring-1 ring-amber-200/60">
            <Ruler className="h-8 w-8 text-indigo-400" />
          </div>
          <h1
            className="text-2xl font-bold text-indigo-900 mb-2"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('common.not_found')}
          </h1>
          <p className="text-gray-600 text-sm">{t('tailoring.profile.not_found')}</p>
        </div>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`w-5 h-5 ${index < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
      />
    ));
  };

  const services: Service[] = [
    {
      id: 'custom-suit',
      name: t('tailoring.services.custom_suits.title'),
      price: t('tailoring.services.custom_suits.price'),
      duration: t('tailoring.services.custom_suits.duration'),
    },
    {
      id: 'alterations',
      name: t('tailoring.services.alterations.title'),
      price: t('tailoring.services.alterations.price'),
      duration: t('tailoring.services.alterations.duration'),
    },
  ];

  const reviews: Review[] = [
    {
      id: '1',
      author: 'Karim Alami',
      rating: 5,
      comment: t('tailoring.reviews.mock.1.comment'),
      date: '2024-12-15',
      service: t('tailoring.reviews.mock.1.service'),
    },
    {
      id: '2',
      author: 'Youssef Benjelloun',
      rating: 4,
      comment: t('tailoring.reviews.mock.2.comment'),
      date: '2024-12-10',
      service: t('tailoring.reviews.mock.2.service'),
    },
  ];

  return (
    <div className="min-h-screen bg-amber-50/40">
      {/* Hero Section — Atlas §6.4 editorial dark strip + §13.2 zellige motif */}
      <section className="relative isolate overflow-hidden bg-indigo-950 py-16 sm:py-20">
        {/* Zellige motif overlay */}
        <div aria-hidden className="absolute inset-0 pointer-events-none bg-motif-zellige" />
        <div
          aria-hidden
          className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,_#f59e0b_0,_transparent_45%),radial-gradient(circle_at_80%_60%,_#6366f1_0,_transparent_50%)]"
        />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden ring-4 ring-white/20 shadow-atlas-lg flex-shrink-0">
              <Image
                src={tailor.profile_image}
                alt={tailor.business_name}
                fill
                className="object-cover"
              />
            </div>
            <div className="text-white text-center sm:text-start">
              <h1
                className="text-3xl sm:text-4xl font-bold tracking-tight mb-2"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {tailor.business_name}
              </h1>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-4">
                <div className="flex">{renderStars(tailor.rating)}</div>
                <span className="text-indigo-200 text-sm">
                  ({tailor.total_reviews} {t('tailoring.tailors.reviews')})
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-sm">{tailor.user.city}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <BadgeCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-sm">{tailor.experience_years} {t('tailoring.tailors.years')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <section className="bg-white rounded-2xl ring-1 ring-amber-200/60 p-6 shadow-atlas-sm">
              <h2
                className="text-2xl font-bold text-indigo-900 mb-4"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {t('tailoring.profile.about')}
              </h2>
              <p className="text-gray-700 leading-relaxed">{tailor.bio}</p>
              <div className="mt-6 pt-5 border-t border-amber-100">
                <h3 className="text-sm font-semibold text-indigo-900 mb-3 uppercase tracking-[0.1em]">
                  {t('tailoring.profile.specialties')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tailor.specializations.map((specialty) => (
                    <span
                      key={specialty}
                      className="bg-amber-50 text-amber-800 px-3 py-1 rounded-full text-xs font-medium ring-1 ring-amber-200"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* Portfolio Section */}
            <section className="bg-white rounded-2xl ring-1 ring-amber-200/60 p-6 shadow-atlas-sm">
              <h2
                className="text-2xl font-bold text-indigo-900 mb-4"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {t('tailoring.profile.portfolio')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {tailor.portfolio_images.map((image, index) => (
                  <div key={index} className="relative aspect-square rounded-2xl overflow-hidden ring-1 ring-amber-200/60">
                    <Image
                      src={image}
                      alt={t('tailoring.profile.portfolio_image_alt', { index: index + 1 })}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Reviews Section */}
            <section className="bg-white rounded-2xl ring-1 ring-amber-200/60 p-6 shadow-atlas-sm">
              <h2
                className="text-2xl font-bold text-indigo-900 mb-4"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {t('tailoring.profile.reviews')}
              </h2>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl bg-amber-50 ring-1 ring-amber-200/60 p-5"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-sm text-indigo-900">{review.author}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex">{renderStars(review.rating)}</div>
                          <span className="text-xs text-gray-500">{review.service}</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{review.date}</span>
                    </div>
                    <p className="text-sm text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl ring-1 ring-amber-200/60 p-6 shadow-atlas-sm sticky top-8">
              <h2
                className="text-xl font-bold text-indigo-900 mb-5 pb-4 border-b border-amber-100"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {t('tailoring.booking.title')}
              </h2>

              {/* Service Selection */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-indigo-900 mb-2">
                  {t('tailoring.booking.select_service')}
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-amber-200 rounded-2xl text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 focus:outline-none transition-colors"
                  value={selectedService || ''}
                  onChange={(e) => setSelectedService(e.target.value)}
                >
                  <option value="">{t('tailoring.booking.choose_service')}</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {service.price}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-indigo-900 mb-2">
                  {t('tailoring.booking.select_date')}
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 border border-amber-200 rounded-2xl text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 focus:outline-none transition-colors"
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Time Slots */}
              {selectedDate && timeSlots.length > 0 && (
                <div className="mb-5">
                  <label className="block text-sm font-medium text-indigo-900 mb-2">
                    {t('tailoring.booking.select_time')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.time}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                          slot.available
                            ? selectedTimeSlot === slot.time
                              ? 'bg-indigo-700 text-white shadow-atlas-sm'
                              : 'ring-1 ring-amber-200 text-indigo-900 hover:ring-indigo-400 hover:bg-amber-50'
                            : 'bg-amber-100/70 text-gray-400 cursor-not-allowed'
                        }`}
                        onClick={() => setSelectedTimeSlot(slot.time)}
                        disabled={!slot.available}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                className={`w-full px-4 py-3 rounded-full font-semibold text-sm transition-all duration-150 mt-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700 ${
                  !selectedService || !selectedDate || !selectedTimeSlot
                    ? 'bg-amber-100/70 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-atlas-sm'
                }`}
                onClick={() => setIsBookingModalOpen(true)}
                disabled={!selectedService || !selectedDate || !selectedTimeSlot}
              >
                {t('tailoring.booking.book_now')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Confirmation Modal — Atlas §shadow-atlas-xl */}
      <Dialog
        open={isBookingModalOpen}
        onClose={() => !bookingLoading && setIsBookingModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-2xl p-6 max-w-md w-full shadow-atlas-xl ring-1 ring-amber-200/40">
            <Dialog.Title
              className="text-xl font-bold text-indigo-900 mb-4 pb-4 border-b border-amber-100"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('tailoring.booking.confirm_title')}
            </Dialog.Title>
            <div className="space-y-4">
              <p className="text-gray-700 text-sm leading-relaxed">
                {t('tailoring.booking.confirm_message')} {tailor.business_name}?
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  className="px-5 py-2.5 ring-1 ring-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-full text-sm font-medium transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-700"
                  onClick={() => setIsBookingModalOpen(false)}
                  disabled={bookingLoading}
                >
                  {t('common.cancel')}
                </button>
                <button
                  className={`px-5 py-2.5 bg-indigo-700 text-white rounded-full text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700 ${
                    bookingLoading ? 'opacity-60 cursor-wait' : 'hover:bg-indigo-800'
                  }`}
                  onClick={handleBooking}
                  disabled={bookingLoading}
                >
                  {bookingLoading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4 text-white flex-shrink-0"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {t('common.processing')}
                    </span>
                  ) : (
                    t('tailoring.booking.confirm')
                  )}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
