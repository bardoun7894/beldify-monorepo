import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPinIcon, PhoneIcon, EnvelopeIcon, ClockIcon, LanguageIcon, CreditCardIcon, CalendarDaysIcon, ChatBubbleLeftRightIcon, GlobeAltIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/20/solid'; // Use solid star for rating

// TODO: Import necessary components (e.g., ImageGallery)

interface TailorDetailsPageProps {
  params: { id: string };
}

const TailorDetailsPage = async ({ params }: TailorDetailsPageProps) => {
  const tailorId = params.id;

  // TODO: Fetch tailor data based on tailorId
  // Example: const tailor = await getTailorById(tailorId);

  // Mock services offered (placeholder data)
  const services = [
    { id: 1, name: 'Custom Garment Design', price: '1500 - 3000 MAD', duration: '2-3 weeks' },
    { id: 2, name: 'Alterations', price: '200 - 500 MAD', duration: '2-5 days' },
    { id: 3, name: 'Wedding Attire', price: '5000+ MAD', duration: '4-8 weeks' },
    { id: 4, name: 'Traditional Moroccan Wear', price: '2000 - 4000 MAD', duration: '3-4 weeks' },
  ];

  // Mock reviews (placeholder data)
  const reviews = [
    { id: 1, author: 'Mohammed A.', rating: 5, date: '2025-01-15', comment: 'Exceptional craftsmanship and attention to detail.' },
    { id: 2, author: 'Leila B.', rating: 4, date: '2024-12-20', comment: 'Great quality work and professional service.' },
  ];

  // Placeholder data for demonstration
  const tailor = {
    id: tailorId,
    name: `Atelier ${tailorId}`,
    specialty: 'Bespoke Suits & Traditional Wear',
    location: 'Casablanca, Anfa District',
    description: 'With over 15 years of experience, we specialize in creating bespoke garments that perfectly fit your style and physique. Our commitment to quality and traditional techniques ensures every piece is a masterpiece.',
    rating: 4.8,
    reviews: 42,
    phone: '+212 5 22 00 11 22',
    email: `contact@atelier${tailorId}.ma`,
    website: `https://atelier${tailorId}.ma`,
    address: '123 Rue Mohammed V, Quartier Anfa, Casablanca',
    workingHours: 'Mon-Fri: 9:00 - 18:00, Sat: 10:00 - 16:00',
    languages: ['Arabic', 'French', 'English'],
    paymentMethods: ['Cash', 'Credit Card', 'Bank Transfer'],
    imageUrl: '/placeholder.png', // Main image for hero?
    portfolioImages: [
      '/placeholder.png',
      '/placeholder.png',
      '/placeholder.png',
      '/placeholder.png',
    ],
    social: {
      instagram: `https://instagram.com/atelier${tailorId}`,
      facebook: `https://facebook.com/atelier${tailorId}`,
    },
    coordinates: { lat: 33.589 , lng: -7.611 }
  };

  if (!tailor) {
    notFound();
  }

  return (
    <div className="bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 min-h-screen pb-20">
      {/* Hero Section - Enhanced with parallax effect */}
      <div
        className="relative bg-cover bg-center h-80 md:h-96 lg:h-[28rem] overflow-hidden"
        style={{ backgroundImage: `url(${tailor.imageUrl || '/images/banners/tailoring.jpg'})` }}
      >
        {/* Enhanced overlay with more depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-primary-900/40 to-black/20 backdrop-blur-[2px]"></div>

        {/* Floating specialty badge */}
        <div className="absolute top-6 right-6 bg-secondary-500/90 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm shadow-lg">
          {tailor.specialty}
        </div>

        <div className="absolute inset-0 flex items-end pb-12 md:pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumbs with improved styling */}
            <div className="mb-4 text-sm text-white/80 flex flex-wrap items-center gap-1">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span className="text-white/50">/</span>
              <Link href="/services/tailoring" className="hover:text-white transition-colors">Tailoring</Link>
              <span className="text-white/50">/</span>
              <Link href="/services/tailoring/tailors" className="hover:text-white transition-colors">Tailors</Link>
              <span className="text-white/50">/</span>
              <span className="text-white font-medium">{tailor.name}</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              {tailor.name}
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-3 text-white">
              {/* Rating with improved visual */}
              <div className="flex items-center bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className={`w-5 h-5 ${i < Math.floor(tailor.rating) ? 'text-yellow-400' : 'text-white/20'}`} />
                  ))}
                </div>
                <span className="ml-2 font-medium text-base">{tailor.rating.toFixed(1)}</span>
                <span className="ml-1.5 text-white/80 text-sm">({tailor.reviews} reviews)</span>
              </div>

              {/* Location with improved visual */}
              <div className="flex items-center bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <MapPinIcon className="w-5 h-5 mr-1.5 text-secondary-400" />
                <span className="text-sm">{tailor.location}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Improved layout and spacing */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-12 md:-mt-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview Card - Enhanced styling */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-700 overflow-hidden transform transition-all hover:shadow-2xl">
              <div className="p-6 md:p-8">
                <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-5 flex items-center">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 mr-2 text-primary-500"/>
                  About {tailor.name}
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed text-lg">
                  {tailor.description}
                </p>

                {/* Social media links */}
                <div className="flex gap-3 mb-8">
                  {tailor.social.instagram && (
                    <a
                      href={tailor.social.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gradient-to-br from-purple-600 to-pink-500 text-white p-2 rounded-full hover:scale-110 transition-transform"
                      aria-label="Instagram"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                  )}
                  {tailor.social.facebook && (
                    <a
                      href={tailor.social.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white p-2 rounded-full hover:scale-110 transition-transform"
                      aria-label="Facebook"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                      </svg>
                    </a>
                  )}
                  {tailor.website && (
                    <a
                      href={tailor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 p-2 rounded-full hover:scale-110 transition-transform"
                      aria-label="Website"
                    >
                      <GlobeAltIcon className="w-5 h-5" />
                    </a>
                  )}
                </div>

                {/* Info Grid - Enhanced with cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8 border-t border-neutral-200 dark:border-neutral-700 pt-6">
                  <div className="bg-neutral-50 dark:bg-neutral-700/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-600">
                    <div className="flex items-start">
                      <LanguageIcon className="w-6 h-6 text-primary-500 mr-3 mt-1 flex-shrink-0"/>
                      <div>
                        <h3 className="font-medium text-neutral-700 dark:text-neutral-300 mb-2">Languages Spoken</h3>
                        <div className="flex flex-wrap gap-2">
                          {tailor.languages.map((lang, index) => (
                            <span key={index} className="text-sm bg-white dark:bg-neutral-600 text-neutral-700 dark:text-neutral-300 px-2.5 py-1 rounded-full border border-neutral-200 dark:border-neutral-500 shadow-sm">
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-50 dark:bg-neutral-700/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-600">
                    <div className="flex items-start">
                      <ClockIcon className="w-6 h-6 text-primary-500 mr-3 mt-1 flex-shrink-0"/>
                      <div>
                        <h3 className="font-medium text-neutral-700 dark:text-neutral-300 mb-2">Working Hours</h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">{tailor.workingHours}</p>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 bg-neutral-50 dark:bg-neutral-700/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-600">
                    <div className="flex items-start">
                      <CreditCardIcon className="w-6 h-6 text-primary-500 mr-3 mt-1 flex-shrink-0"/>
                      <div>
                        <h3 className="font-medium text-neutral-700 dark:text-neutral-300 mb-2">Payment Methods</h3>
                        <div className="flex flex-wrap gap-2">
                          {tailor.paymentMethods.map((method, index) => (
                            <span key={index} className="text-sm bg-white dark:bg-neutral-600 text-neutral-700 dark:text-neutral-300 px-2.5 py-1 rounded-full border border-neutral-200 dark:border-neutral-500 shadow-sm">
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

            {/* Services Offered - Enhanced card and table styling */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-700 overflow-hidden transform transition-all hover:shadow-2xl">
              <div className="p-6 md:p-8">
                <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Services Offered
                </h2>
                <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-inner">
                  <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                    <thead className="bg-neutral-50 dark:bg-neutral-700/50">
                      <tr>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Service</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Price Range</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Estimated Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                      {services.map((service) => (
                        <tr key={service.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-700/40 transition-colors duration-150">
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{service.name}</div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">{service.price}</div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
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

            {/* Portfolio/Gallery - Enhanced with lightbox effect */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-700 overflow-hidden transform transition-all hover:shadow-2xl">
              <div className="p-6 md:p-8">
                <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Portfolio
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {tailor.portfolioImages.map((img, index) => (
                    <div key={index} className="aspect-square bg-neutral-100 dark:bg-neutral-700 rounded-xl overflow-hidden group relative border border-neutral-200 dark:border-neutral-600 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <img
                        src={img}
                        alt={`Portfolio image ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                      />
                      {/* Enhanced overlay with zoom icon */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-full">
                          <ArrowTopRightOnSquareIcon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reviews Section - New addition */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-700 overflow-hidden transform transition-all hover:shadow-2xl">
              <div className="p-6 md:p-8">
                <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Customer Reviews
                </h2>

                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-neutral-50 dark:bg-neutral-700/30 p-5 rounded-xl border border-neutral-200 dark:border-neutral-600">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-neutral-800 dark:text-neutral-200">{review.author}</h3>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">{review.date}</p>
                        </div>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-neutral-300 dark:text-neutral-600'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-300 text-sm">{review.comment}</p>
                    </div>
                  ))}

                  <div className="text-center pt-4">
                    <button className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                      View all {tailor.reviews} reviews
                      <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Column - Enhanced with better styling */}
          <div className="lg:col-span-1">
            {/* Contact Info Card - Enhanced styling */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-700 overflow-hidden sticky top-8 transform transition-all hover:shadow-2xl">
              <div className="p-6">
                <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-5 border-b border-neutral-200 dark:border-neutral-700 pb-3">Contact Information</h2>

                <div className="space-y-5">
                  {/* Phone */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-0.5 p-2 bg-primary-50 dark:bg-primary-900/30 rounded-full shadow-sm">
                      <PhoneIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Phone</p>
                      <a href={`tel:${tailor.phone}`} className="text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        {tailor.phone}
                      </a>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start">
                     <div className="flex-shrink-0 mt-0.5 p-2 bg-primary-50 dark:bg-primary-900/30 rounded-full shadow-sm">
                      <EnvelopeIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Email</p>
                      <a href={`mailto:${tailor.email}`} className="text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors break-all">
                        {tailor.email}
                      </a>
                    </div>
                  </div>

                  {/* Website - New addition */}
                  {tailor.website && (
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-0.5 p-2 bg-primary-50 dark:bg-primary-900/30 rounded-full shadow-sm">
                        <GlobeAltIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Website</p>
                        <a
                          href={tailor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center"
                        >
                          Visit Website
                          <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 ml-1" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  <div className="flex items-start">
                     <div className="flex-shrink-0 mt-0.5 p-2 bg-primary-50 dark:bg-primary-900/30 rounded-full shadow-sm">
                      <MapPinIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Address</p>
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {tailor.address}
                      </p>
                      {/* Enhanced Map Link */}
                      {tailor.coordinates && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${tailor.coordinates.lat},${tailor.coordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium bg-primary-50 dark:bg-primary-900/20 px-2.5 py-1.5 rounded-full"
                        >
                          <MapPinIcon className="w-3.5 h-3.5 mr-1" />
                          View on Google Maps
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Enhanced with better styling and animations */}
                <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700 space-y-4">
                  <button className="w-full flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white font-medium py-3.5 px-4 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-neutral-800 shadow-md hover:shadow-xl transform hover:-translate-y-1">
                    <CalendarDaysIcon className="w-5 h-5 mr-2" />
                    Book an Appointment
                  </button>

                  <a
                    href={`https://wa.me/${tailor.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-medium py-3.5 px-4 rounded-xl transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1"
                  >
                    <svg className="w-5 h-5 mr-2 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    Contact via WhatsApp
                  </a>

                  {/* New: Call button */}
                  <a
                    href={`tel:${tailor.phone}`}
                    className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 px-4 rounded-xl transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1"
                  >
                    <PhoneIcon className="w-5 h-5 mr-2" />
                    Call Directly
                  </a>
                </div>

                {/* New: Social media links */}
                {(tailor.social.instagram || tailor.social.facebook) && (
                  <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Follow on Social Media</p>
                    <div className="flex space-x-3">
                      {tailor.social.instagram && (
                        <a
                          href={tailor.social.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 bg-gradient-to-br from-purple-600 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                          aria-label="Instagram"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </a>
                      )}
                      {tailor.social.facebook && (
                        <a
                          href={tailor.social.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 bg-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                          aria-label="Facebook"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                          </svg>
                        </a>
                      )}
                      {tailor.website && (
                        <a
                          href={tailor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                          aria-label="Website"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* New: Business hours card */}
              <div className="mt-6 p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-b-xl border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center mb-3">
                  <ClockIcon className="w-5 h-5 text-primary-500 mr-2" />
                  <h3 className="font-medium text-neutral-800 dark:text-neutral-200">Business Hours</h3>
                </div>
                <div className="space-y-1.5 text-sm text-neutral-600 dark:text-neutral-400">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span className="font-medium">9:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span className="font-medium">10:00 - 16:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span className="font-medium text-red-500">Closed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* New: Map card */}
            <div className="mt-6 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-100 dark:border-neutral-700 overflow-hidden">
              <div className="p-4">
                <h3 className="font-medium text-neutral-800 dark:text-neutral-200 mb-2 flex items-center">
                  <MapPinIcon className="w-5 h-5 text-primary-500 mr-2" />
                  Location
                </h3>
                <div className="aspect-video bg-neutral-100 dark:bg-neutral-700 rounded-lg overflow-hidden">
                  {/* Placeholder for map - in a real app, you'd use a map component */}
                  <div className="w-full h-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-700">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${tailor.coordinates.lat},${tailor.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center"
                    >
                      <MapPinIcon className="w-5 h-5 mr-1.5" />
                      View on Google Maps
                    </a>
                  </div>
                </div>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                  {tailor.address}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New: Floating action button for mobile */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <div className="flex flex-col space-y-3">
          <a
            href={`tel:${tailor.phone}`}
            className="p-3.5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            aria-label="Call"
          >
            <PhoneIcon className="w-6 h-6" />
          </a>
          <a
            href={`https://wa.me/${tailor.phone.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-colors"
            aria-label="WhatsApp"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          </a>
          <button
            className="p-3.5 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors"
            aria-label="Book Appointment"
          >
            <CalendarDaysIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TailorDetailsPage;
