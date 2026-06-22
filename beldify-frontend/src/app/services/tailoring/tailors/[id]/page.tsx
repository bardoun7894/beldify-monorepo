'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Languages,
  CreditCard,
  Calendar,
  Globe,
  Star,
  ExternalLink,
  CheckSquare,
  MessageCircle,
  ImageIcon,
} from 'lucide-react';

interface TailorDetailsPageProps {
  params: { id: string };
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${cls} ${i <= Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  );
}

const TailorDetailsPage = ({ params }: TailorDetailsPageProps) => {
  const { t } = useTranslation();
  const tailorId = params.id;

  // TODO: Replace with API fetch: const tailor = await getTailorById(tailorId);
  const services = [
    {
      id: 1,
      name: t('content.tailorDetail.service1Name', 'Custom Garment Design'),
      price: '1500 - 3000 MAD',
      duration: '2-3 weeks',
    },
    {
      id: 2,
      name: t('content.tailorDetail.service2Name', 'Alterations'),
      price: '200 - 500 MAD',
      duration: '2-5 days',
    },
    {
      id: 3,
      name: t('content.tailorDetail.service3Name', 'Wedding Attire'),
      price: '5000+ MAD',
      duration: '4-8 weeks',
    },
    {
      id: 4,
      name: t('content.tailorDetail.service4Name', 'Traditional Moroccan Wear'),
      price: '2000 - 4000 MAD',
      duration: '3-4 weeks',
    },
  ];

  const reviews = [
    {
      id: 1,
      author: 'Mohammed A.',
      rating: 5,
      date: '2025-01-15',
      comment: t(
        'content.tailorDetail.review1Comment',
        'Exceptional craftsmanship and attention to detail.'
      ),
    },
    {
      id: 2,
      author: 'Leila B.',
      rating: 4,
      date: '2024-12-20',
      comment: t(
        'content.tailorDetail.review2Comment',
        'Great quality work and professional service.'
      ),
    },
  ];

  const tailor = {
    id: tailorId,
    name: `Atelier ${tailorId}`,
    specialty: t('content.tailorDetail.specialty', 'Bespoke Suits & Traditional Wear'),
    location: t('content.tailorDetail.location', 'Casablanca, Anfa District'),
    description: t(
      'content.tailorDetail.description',
      'With over 15 years of experience, we specialize in creating bespoke garments that perfectly fit your style and physique. Our commitment to quality and traditional techniques ensures every piece is a masterpiece.'
    ),
    rating: 4.8,
    reviews: 42,
    phone: '+212 5 22 00 11 22',
    email: `contact@atelier${tailorId}.ma`,
    website: `https://atelier${tailorId}.ma`,
    address: t('content.tailorDetail.address', '123 Rue Mohammed V, Quartier Anfa, Casablanca'),
    workingHoursValue: t('content.tailorDetail.workingHoursValue', 'Mon-Fri: 9:00 - 18:00, Sat: 10:00 - 16:00'),
    languages: [
      t('content.tailorDetail.langArabic', 'Arabic'),
      t('content.tailorDetail.langFrench', 'French'),
      t('content.tailorDetail.langEnglish', 'English'),
    ],
    paymentMethods: [
      t('content.tailorDetail.paymentCash', 'Cash'),
      t('content.tailorDetail.paymentCard', 'Credit Card'),
      t('content.tailorDetail.paymentTransfer', 'Bank Transfer'),
    ],
    imageUrl: '/placeholder.png',
    portfolioImages: ['/placeholder.png', '/placeholder.png', '/placeholder.png', '/placeholder.png'],
    social: {
      instagram: `https://instagram.com/atelier${tailorId}`,
      facebook: `https://facebook.com/atelier${tailorId}`,
    },
    coordinates: { lat: 33.589, lng: -7.611 },
  };

  if (!tailor) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Atlas editorial hero strip */}
      <div className="relative bg-indigo-900 overflow-hidden">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 15%, #f59e0b 0, transparent 45%), radial-gradient(circle at 85% 60%, #6366f1 0, transparent 50%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-14 sm:py-16">
          {/* Breadcrumbs */}
          <nav
            aria-label={t('content.tailorDetail.breadcrumbLabel', 'Breadcrumb')}
            className="mb-6 text-sm text-indigo-300 flex flex-wrap items-center gap-1.5"
          >
            <Link href="/" className="hover:text-white transition-colors">
              {t('content.tailorDetail.breadcrumbHome', 'Home')}
            </Link>
            <span className="text-indigo-500">/</span>
            <Link href="/services/tailoring" className="hover:text-white transition-colors">
              {t('content.tailorDetail.breadcrumbTailoring', 'Tailoring')}
            </Link>
            <span className="text-indigo-500">/</span>
            <Link href="/services/tailoring/tailors" className="hover:text-white transition-colors">
              {t('content.tailorDetail.breadcrumbTailors', 'Tailors')}
            </Link>
            <span className="text-indigo-500">/</span>
            <span className="text-white font-medium">{tailor.name}</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-end gap-6">
            <div>
              <span className="inline-flex items-center rounded-full bg-amber-400/20 ring-1 ring-amber-400/40 px-3 py-1 text-xs font-semibold text-amber-300 mb-4">
                {tailor.specialty}
              </span>
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {tailor.name}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <StarRating rating={tailor.rating} size="md" />
                  <span className="text-white font-semibold text-sm">{tailor.rating.toFixed(1)}</span>
                  <span className="text-indigo-300 text-sm">
                    ({tailor.reviews} {t('content.tailorDetail.reviews', 'reviews')})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <MapPin className="h-4 w-4 text-amber-400" />
                  <span className="text-white text-sm">{tailor.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <div className="rounded-2xl ring-1 ring-amber-200/60 bg-white shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <h2
                  className="text-2xl font-bold text-indigo-900 mb-5 flex items-center gap-2"
                  style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                >
                  <MessageCircle className="h-6 w-6 text-amber-600" />
                  {t('content.tailorDetail.aboutHeading', 'About')} {tailor.name}
                </h2>
                <p className="text-gray-700 leading-relaxed text-base">{tailor.description}</p>

                {/* Social links */}
                <div className="flex gap-3 mt-6">
                  {tailor.social.instagram && (
                    <a
                      href={tailor.social.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 text-white px-4 py-1.5 text-xs font-semibold hover:opacity-90 transition"
                      aria-label={t('content.tailorDetail.instagram', 'Instagram')}
                    >
                      {t('content.tailorDetail.instagram', 'Instagram')}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {tailor.social.facebook && (
                    <a
                      href={tailor.social.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 text-white px-4 py-1.5 text-xs font-semibold hover:opacity-90 transition"
                      aria-label={t('content.tailorDetail.facebook', 'Facebook')}
                    >
                      {t('content.tailorDetail.facebook', 'Facebook')}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {tailor.website && (
                    <a
                      href={tailor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full ring-1 ring-amber-200 text-indigo-700 px-4 py-1.5 text-xs font-semibold hover:bg-amber-50 transition"
                      aria-label={t('content.tailorDetail.website', 'Website')}
                    >
                      <Globe className="h-3 w-3" />
                      {t('content.tailorDetail.website', 'Website')}
                    </a>
                  )}
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-6 border-t border-amber-100">
                  <div className="rounded-2xl bg-amber-50 ring-1 ring-amber-200/60 p-4">
                    <div className="flex items-start gap-3">
                      <Languages className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-semibold text-indigo-900 mb-2">
                          {t('content.tailorDetail.languagesSpoken', 'Languages Spoken')}
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {tailor.languages.map((lang, i) => (
                            <span
                              key={i}
                              className="text-xs bg-white text-indigo-700 px-2.5 py-1 rounded-full ring-1 ring-indigo-200/60"
                            >
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-amber-50 ring-1 ring-amber-200/60 p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-semibold text-indigo-900 mb-1">
                          {t('content.tailorDetail.workingHours', 'Working Hours')}
                        </h3>
                        <p className="text-sm text-gray-600">{tailor.workingHoursValue}</p>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 rounded-2xl bg-amber-50 ring-1 ring-amber-200/60 p-4">
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-semibold text-indigo-900 mb-2">
                          {t('content.tailorDetail.paymentMethods', 'Payment Methods')}
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {tailor.paymentMethods.map((method, i) => (
                            <span
                              key={i}
                              className="text-xs bg-white text-indigo-700 px-2.5 py-1 rounded-full ring-1 ring-indigo-200/60"
                            >
                              {method}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="rounded-2xl ring-1 ring-amber-200/60 bg-white shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <h2
                  className="text-2xl font-bold text-indigo-900 mb-6 flex items-center gap-2"
                  style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                >
                  <CheckSquare className="h-6 w-6 text-amber-600" />
                  {t('content.tailorDetail.servicesOffered', 'Services Offered')}
                </h2>
                <div className="overflow-x-auto rounded-xl ring-1 ring-amber-200/60">
                  <table className="min-w-full divide-y divide-amber-100">
                    <thead className="bg-amber-50/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wide">
                          {t('content.tailorDetail.tableService', 'Service')}
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wide">
                          {t('content.tailorDetail.tablePriceRange', 'Price Range')}
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wide">
                          {t('content.tailorDetail.tableEstTime', 'Estimated Time')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-amber-50">
                      {services.map((service) => (
                        <tr key={service.id} className="transition hover:bg-amber-50/30">
                          <td className="px-6 py-4 text-sm font-medium text-indigo-900">{service.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{service.price}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200/60">
                              {service.duration}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Portfolio */}
            <div className="rounded-2xl ring-1 ring-amber-200/60 bg-white shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <h2
                  className="text-2xl font-bold text-indigo-900 mb-6 flex items-center gap-2"
                  style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                >
                  <ImageIcon className="h-6 w-6 text-amber-600" />
                  {t('content.tailorDetail.portfolio', 'Portfolio')}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {tailor.portfolioImages.map((img, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-2xl overflow-hidden ring-1 ring-amber-200/60 group relative"
                    >
                      <Image
                        src={img}
                        alt={`${t('content.tailorDetail.portfolioAlt', 'Portfolio image')} ${index + 1}`}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <ExternalLink className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="rounded-2xl ring-1 ring-amber-200/60 bg-white shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <h2
                  className="text-2xl font-bold text-indigo-900 mb-6 flex items-center gap-2"
                  style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                >
                  <Star className="h-6 w-6 text-amber-600" />
                  {t('content.tailorDetail.customerReviews', 'Customer Reviews')}
                </h2>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-2xl bg-amber-50 ring-1 ring-amber-200/60 p-5"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-indigo-900">{review.author}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">{review.date}</p>
                        </div>
                        <StarRating rating={review.rating} />
                      </div>
                      <p className="text-sm text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                  <div className="text-center pt-4">
                    <button className="inline-flex items-center gap-1.5 text-indigo-700 hover:text-indigo-900 text-sm font-medium transition">
                      {t('content.tailorDetail.viewAllReviews', 'View all')} {tailor.reviews}{' '}
                      {t('content.tailorDetail.reviews', 'reviews')}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl ring-1 ring-amber-200/60 bg-white shadow-sm overflow-hidden sticky top-8">
              <div className="p-6">
                <h2 className="text-lg font-bold text-indigo-900 mb-5 pb-4 border-b border-amber-100">
                  {t('content.tailorDetail.contactInformation', 'Contact Information')}
                </h2>
                <div className="space-y-4">
                  {/* Phone */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 rounded-xl bg-amber-50 ring-1 ring-amber-200/60">
                      <Phone className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {t('content.tailorDetail.phone', 'Phone')}
                      </p>
                      <a
                        href={`tel:${tailor.phone}`}
                        className="text-sm font-medium text-indigo-900 hover:text-indigo-600 transition-colors"
                      >
                        {tailor.phone}
                      </a>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 rounded-xl bg-amber-50 ring-1 ring-amber-200/60">
                      <Mail className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {t('content.tailorDetail.emailLabel', 'Email')}
                      </p>
                      <a
                        href={`mailto:${tailor.email}`}
                        className="text-sm font-medium text-indigo-900 hover:text-indigo-600 transition-colors break-all"
                      >
                        {tailor.email}
                      </a>
                    </div>
                  </div>

                  {/* Website */}
                  {tailor.website && (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 p-2 rounded-xl bg-amber-50 ring-1 ring-amber-200/60">
                        <Globe className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          {t('content.tailorDetail.websiteLabel', 'Website')}
                        </p>
                        <a
                          href={tailor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-indigo-900 hover:text-indigo-600 transition-colors flex items-center gap-1"
                        >
                          {t('content.tailorDetail.visitWebsite', 'Visit Website')}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 rounded-xl bg-amber-50 ring-1 ring-amber-200/60">
                      <MapPin className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {t('content.tailorDetail.addressLabel', 'Address')}
                      </p>
                      <p className="text-sm font-medium text-indigo-900">{tailor.address}</p>
                      {tailor.coordinates && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${tailor.coordinates.lat},${tailor.coordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1.5 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition"
                        >
                          <MapPin className="h-3 w-3" />
                          {t('content.tailorDetail.viewOnMaps', 'View on Google Maps')}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* CTAs */}
                <div className="mt-6 pt-5 border-t border-amber-100 space-y-3">
                  <button className="w-full flex items-center justify-center gap-2 rounded-full bg-indigo-700 hover:bg-indigo-800 text-white font-semibold py-3 px-4 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <Calendar className="h-4 w-4" />
                    {t('content.tailorDetail.bookAppointment', 'Book an Appointment')}
                  </button>

                  <a
                    href={`https://wa.me/${tailor.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 transition"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    {t('content.tailorDetail.contactWhatsApp', 'Contact via WhatsApp')}
                  </a>

                  <a
                    href={`tel:${tailor.phone}`}
                    className="w-full flex items-center justify-center gap-2 rounded-full ring-1 ring-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold py-3 px-4 transition"
                  >
                    <Phone className="h-4 w-4" />
                    {t('content.tailorDetail.callDirectly', 'Call Directly')}
                  </a>
                </div>
              </div>

              {/* Business hours */}
              <div className="p-6 bg-amber-50 border-t border-amber-100">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <h3 className="text-sm font-semibold text-indigo-900">
                    {t('content.tailorDetail.businessHours', 'Business Hours')}
                  </h3>
                </div>
                <div className="space-y-1.5 text-sm">
                  {[
                    {
                      label: t('content.tailorDetail.monFri', 'Monday - Friday'),
                      value: '9:00 - 18:00',
                    },
                    {
                      label: t('content.tailorDetail.saturday', 'Saturday'),
                      value: '10:00 - 16:00',
                    },
                    {
                      label: t('content.tailorDetail.sunday', 'Sunday'),
                      value: t('content.tailorDetail.closed', 'Closed'),
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-gray-600">{label}</span>
                      <span
                        className={`font-medium ${
                          value === t('content.tailorDetail.closed', 'Closed')
                            ? 'text-gray-400'
                            : 'text-indigo-900'
                        }`}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map placeholder */}
              <div className="p-6 border-t border-amber-100">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-amber-600" />
                  <h3 className="text-sm font-semibold text-indigo-900">
                    {t('content.tailorDetail.locationLabel', 'Location')}
                  </h3>
                </div>
                <div className="aspect-video rounded-2xl bg-indigo-50 ring-1 ring-amber-200/60 flex items-center justify-center">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${tailor.coordinates.lat},${tailor.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-indigo-700 hover:text-indigo-900 font-medium transition"
                  >
                    <MapPin className="h-4 w-4" />
                    {t('content.tailorDetail.viewOnMaps', 'View on Google Maps')}
                  </a>
                </div>
                <p className="mt-2 text-xs text-gray-500">{tailor.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile floating actions */}
      <div className="lg:hidden fixed bottom-6 right-6 rtl:right-auto rtl:left-6 z-50 flex flex-col gap-3">
        <a
          href={`tel:${tailor.phone}`}
          className="p-3.5 bg-indigo-700 text-white rounded-full shadow-lg hover:bg-indigo-800 transition-colors"
          aria-label={t('content.tailorDetail.mobileCallLabel', 'Call')}
        >
          <Phone className="h-5 w-5" />
        </a>
        <a
          href={`https://wa.me/${tailor.phone.replace(/[^0-9]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3.5 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-colors"
          aria-label={t('content.tailorDetail.mobileWhatsAppLabel', 'WhatsApp')}
        >
          <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </a>
        <button
          className="p-3.5 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-600 transition-colors"
          aria-label={t('content.tailorDetail.mobileBookLabel', 'Book Appointment')}
        >
          <Calendar className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default TailorDetailsPage;
