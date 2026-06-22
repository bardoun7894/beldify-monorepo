'use client';

import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, MapPin, Calendar, Clock, MessageCircle, BadgeCheck } from 'lucide-react';
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
  const tailorFetchTokenRef = useRef(0);
  const slotsFetchTokenRef = useRef(0);

  const loadTailorData = useCallback(async () => {
    const token = ++tailorFetchTokenRef.current;
    try {
      const response = await tailorService.getTailor(params.id);
      if (token !== tailorFetchTokenRef.current) return;
      setTailor(response.data);
    } catch (error: any) {
      if (token !== tailorFetchTokenRef.current) return;
      toast.error(t('tailoring.errors.load_tailor_failed', 'Failed to load tailor data'));
    } finally {
      if (token === tailorFetchTokenRef.current) setLoading(false);
    }
  }, [params.id, t]);

  const loadTimeSlots = useCallback(async () => {
    if (!selectedDate) return;
    const token = ++slotsFetchTokenRef.current;
    try {
      const response = await tailorService.getTimeSlots(params.id, selectedDate);
      if (token !== slotsFetchTokenRef.current) return;
      setTimeSlots(response.data);
    } catch (error: any) {
      if (token !== slotsFetchTokenRef.current) return;
      toast.error(t('tailoring.errors.load_slots_failed', 'Failed to load time slots'));
    }
  }, [params.id, selectedDate, t]);

  useEffect(() => {
    loadTailorData();
  }, [loadTailorData]);

  useEffect(() => {
    if (!selectedDate) {
      setTimeSlots([]);
      setSelectedTimeSlot(null);
      return;
    }
    loadTimeSlots();
  }, [selectedDate, loadTimeSlots]);

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
      toast.error(t('tailoring.booking.error', 'Failed to confirm booking. Please try again.'));
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!tailor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">{t('common.not_found')}</h1>
          <p className="text-gray-600">{t('tailoring.profile.not_found')}</p>
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
      duration: '2-3 hours',
    },
    {
      id: 'alterations',
      name: t('tailoring.services.alterations.title'),
      price: t('tailoring.services.alterations.price'),
      duration: '1 hour',
    },
  ];

  const reviews: Review[] = [
    {
      id: '1',
      author: 'Karim Alami',
      rating: 5,
      comment: 'Excellent craftsmanship! My wedding suit was perfect.',
      date: '2024-12-15',
      service: 'Custom Suit',
    },
    {
      id: '2',
      author: 'Youssef Benjelloun',
      rating: 4,
      comment: 'Great attention to detail. Very professional service.',
      date: '2024-12-10',
      service: 'Alterations',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-indigo-900 py-20">
        <div className="absolute inset-0 bg-[url('/images/moroccan-pattern.png')] opacity-10" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white">
              <Image
                src={tailor.profile_image}
                alt={tailor.business_name}
                fill
                className="object-cover"
              />
            </div>
            <div className="text-white text-center md:text-left">
              <h1 className="text-3xl font-bold tracking-tight mb-2">{tailor.business_name}</h1>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                <div className="flex">{renderStars(tailor.rating)}</div>
                <span className="text-gray-300">
                  ({tailor.total_reviews} {t('tailoring.tailors.reviews')})
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  {tailor.user.city}
                </div>
                <div className="flex items-center">
                  <BadgeCheck className="w-5 h-5 mr-2" />
                  {tailor.experience_years} {t('tailoring.tailors.years')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <section className="bg-white rounded-2xl ring-1 ring-amber-200/60 p-6 shadow-sm">
              <h2 className="text-2xl font-semibold text-indigo-800 mb-4">
                {t('tailoring.profile.about')}
              </h2>
              <p className="text-gray-700">{tailor.bio}</p>
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('tailoring.profile.specialties')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tailor.specializations.map((specialty) => (
                    <span
                      key={specialty}
                      className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* Portfolio Section */}
            <section className="bg-white rounded-2xl ring-1 ring-amber-200/60 p-6 shadow-sm">
              <h2 className="text-2xl font-semibold text-indigo-800 mb-4">
                {t('tailoring.profile.portfolio')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {tailor.portfolio_images.map((image, index) => (
                  <div key={index} className="relative aspect-square rounded-2xl overflow-hidden ring-1 ring-amber-200/60">
                    <Image
                      src={image}
                      alt={`Portfolio ${index + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Reviews Section */}
            <section className="bg-white rounded-2xl ring-1 ring-amber-200/60 p-6 shadow-sm">
              <h2 className="text-2xl font-semibold text-indigo-800 mb-4">
                {t('tailoring.profile.reviews')}
              </h2>
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b border-gray-200 last:border-0 pb-6 last:pb-0"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{review.author}</h3>
                        <div className="flex items-center gap-2">
                          <div className="flex">{renderStars(review.rating)}</div>
                          <span className="text-sm text-gray-500">{review.service}</span>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{review.date}</span>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl ring-1 ring-amber-200/60 p-6 shadow-sm sticky top-4">
              <h2 className="text-xl font-semibold text-indigo-800 mb-4">
                {t('tailoring.booking.title')}
              </h2>

              {/* Service Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('tailoring.booking.select_service')}
                </label>
                <select
                  className="w-full px-4 py-2 border border-amber-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
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
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('tailoring.booking.select_date')}
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-amber-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Time Slots */}
              {selectedDate && timeSlots.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('tailoring.booking.select_time')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.time}
                        className={`px-4 py-2 rounded-lg text-sm ${
                          slot.available
                            ? selectedTimeSlot === slot.time
                              ? 'bg-indigo-700 text-white'
                              : 'ring-1 ring-amber-200 hover:ring-indigo-400'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
                className={`w-full px-4 py-2 rounded-full transition-colors ${
                  !selectedService || !selectedDate || !selectedTimeSlot
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-700 hover:bg-indigo-800 text-white'
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

      {/* Booking Confirmation Modal */}
      <Dialog
        open={isBookingModalOpen}
        onClose={() => !bookingLoading && setIsBookingModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-2xl p-6 max-w-md w-full">
            <Dialog.Title className="text-xl font-semibold text-indigo-800 mb-4">
              {t('tailoring.booking.confirm_title')}
            </Dialog.Title>
            <div className="space-y-4">
              <p className="text-gray-700">
                {t('tailoring.booking.confirm_message')} {tailor.business_name}?
              </p>
              <div className="flex justify-end gap-4">
                <button
                  className="px-4 py-2 ring-2 ring-indigo-600 text-indigo-700 hover:bg-indigo-50 rounded-full disabled:opacity-50"
                  onClick={() => setIsBookingModalOpen(false)}
                  disabled={bookingLoading}
                >
                  {t('common.cancel')}
                </button>
                <button
                  className={`px-4 py-2 bg-indigo-700 text-white rounded-full ${
                    bookingLoading ? 'opacity-50 cursor-wait' : 'hover:bg-indigo-700'
                  }`}
                  onClick={handleBooking}
                  disabled={bookingLoading}
                >
                  {bookingLoading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
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
