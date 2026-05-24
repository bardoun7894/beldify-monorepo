import React from 'react';
import Link from 'next/link';
// TODO: Import necessary components and hooks (e.g., useTailors hook)
// TODO: Fetch tailors data

// Placeholder data for demonstration
const placeholderTailors = [
  {
    id: '1',
    name: 'Ahmed Tailoring',
    specialty: 'Kaftans & Djellabas',
    location: 'Marrakech',
    imageUrl: '/placeholder.png',
    rating: 4.9,
    reviews: 124,
    featured: true
  },
  {
    id: '2',
    name: 'Fatima Couture',
    specialty: 'Wedding Dresses',
    location: 'Casablanca',
    imageUrl: '/placeholder.png',
    rating: 4.7,
    reviews: 87,
    featured: false
  },
  {
    id: '3',
    name: 'Youssef Stitches',
    specialty: 'Men\'s Suits',
    location: 'Rabat',
    imageUrl: '/placeholder.png',
    rating: 4.8,
    reviews: 56,
    featured: true
  },
  {
    id: '4',
    name: 'Moroccan Fashion',
    specialty: 'Traditional Wear',
    location: 'Fes',
    imageUrl: '/placeholder.png',
    rating: 4.6,
    reviews: 42,
    featured: false
  },
];

const TailorsPage = () => {
  // TODO: Replace with actual fetching logic
  const tailors = placeholderTailors;
  const isLoading = false; // Replace with actual loading state
  const error = null; // Replace with actual error state

  // TODO: Handle loading and error states properly
  if (isLoading) return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-10 w-40 bg-primary-200 rounded mb-4"></div>
        <div className="h-4 w-60 bg-neutral-200 rounded"></div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="bg-red-50 border-l-4 border-red-500 p-4 max-w-2xl">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              Error loading tailors. Please try again later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-b from-amber-50/50 to-white dark:from-neutral-900 dark:to-neutral-800 min-h-screen">
      {/* Hero Section with improved gradient */}
      <div
        className="relative bg-cover bg-center h-72 md:h-96 overflow-hidden"
        style={{ backgroundImage: "url('/images/banners/tailoring.jpg')" }}
      >
        {/* Enhanced overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/70 via-primary-800/60 to-secondary-900/50 backdrop-blur-[2px]"></div>

        {/* Texture overlay */}
        <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIj48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNjY2MiPjwvcmVjdD4KPC9zdmc+')]"></div>

        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-500/20 border border-primary-300/30 text-white text-xs font-medium mb-4 backdrop-blur-sm">
            Professional Services
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg tracking-tight leading-tight">
            Expert Tailors
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow leading-relaxed">
            Discover our network of master tailors who create bespoke garments with precision and artistry
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 relative -mt-10">
        {/* Filter/Search Section with improved styling */}
        <div className="mb-12 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-100 dark:border-neutral-700 p-5">
            <div className="text-neutral-800 dark:text-neutral-200 font-medium flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter by:
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 rounded-full text-sm font-medium border border-primary-200 hover:bg-primary-100 dark:hover:bg-primary-800/40 transition shadow-sm">
                All Tailors
              </button>
              <button className="px-4 py-2 bg-white text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300 rounded-full text-sm font-medium border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 dark:hover:bg-neutral-600 transition shadow-sm">
                Traditional
              </button>
              <button className="px-4 py-2 bg-white text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300 rounded-full text-sm font-medium border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 dark:hover:bg-neutral-600 transition shadow-sm">
                Modern
              </button>
              <button className="px-4 py-2 bg-white text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300 rounded-full text-sm font-medium border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 dark:hover:bg-neutral-600 transition shadow-sm">
                Wedding
              </button>
            </div>
            <div className="relative mt-2 md:mt-0">
              <input
                type="text"
                placeholder="Search tailors..."
                className="pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-full text-sm text-neutral-800 dark:text-neutral-200 focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-neutral-800 w-full shadow-sm"
              />
              <svg className="w-5 h-5 text-neutral-400 dark:text-neutral-500 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Featured Tailors Section with improved styling */}
        {tailors.some(tailor => tailor.featured) && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-8 flex items-center">
              <span className="text-primary-500 mr-2.5 bg-primary-100 p-1.5 rounded-full">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </span>
              Featured Tailors
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {tailors.filter(tailor => tailor.featured).map((tailor) => (
                <div
                  key={tailor.id}
                  className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-100 dark:border-neutral-700 overflow-hidden transition-all duration-300 hover:shadow-xl group"
                >
                  <div className="flex flex-col md:flex-row h-full">
                    <div className="md:w-2/5 relative overflow-hidden">
                      {/* TODO: Replace with Next/Image */}
                      <img
                        src={tailor.imageUrl || '/placeholder.png'}
                        alt={tailor.name}
                        className="w-full h-56 md:h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 bg-primary-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-md backdrop-blur-sm border border-primary-400/50">
                        Featured
                      </div>
                      {/* Dark overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                    </div>
                    <div className="md:w-3/5 p-6 md:p-8 flex flex-col justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-primary-700 dark:text-primary-300 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-200 transition-colors">
                          {tailor.name}
                        </h2>
                        <div className="flex items-center mb-3">
                          <div className="flex text-secondary-500">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} className={`w-4 h-4 ${i < Math.floor(tailor.rating) ? 'text-secondary-500' : 'text-neutral-300 dark:text-neutral-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                            ({tailor.reviews} reviews)
                          </span>
                        </div>
                        <p className="text-neutral-600 dark:text-neutral-400 mb-1 flex items-center">
                          <span className="inline-block w-5 h-5 mr-2 text-primary-500">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </span>
                          <span className="font-medium text-neutral-700 dark:text-neutral-300">Specialty:</span> {tailor.specialty}
                        </p>
                        <p className="text-neutral-600 dark:text-neutral-400 mb-4 flex items-center">
                          <span className="inline-block w-5 h-5 mr-2 text-primary-500">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </span>
                          <span className="font-medium text-neutral-700 dark:text-neutral-300">Location:</span> {tailor.location}
                        </p>
                      </div>
                      <Link
                        href={`/services/tailoring/tailors/${tailor.id}`}
                        className="group inline-flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg"
                      >
                        View Profile
                        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Tailors Section with improved styling */}
        <div className="relative">
          {/* Section Heading with decorative elements */}
          <div className="flex items-center mb-8">
            <div className="h-0.5 w-6 bg-primary-500 mr-2"></div>
            <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
              All Expert Tailors
            </h2>
            <div className="h-0.5 bg-neutral-200 dark:bg-neutral-700 flex-grow ml-4"></div>
          </div>

          {tailors.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-100 dark:border-neutral-700">
              <svg className="w-16 h-16 mx-auto text-neutral-300 dark:text-neutral-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-medium text-neutral-700 dark:text-neutral-300 mb-2">No Results Found</h3>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">No tailors found matching your criteria.</p>
              <button className="mt-5 px-5 py-2.5 bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 rounded-lg text-sm font-medium hover:bg-primary-200 dark:hover:bg-primary-800/40 transition border border-primary-200 dark:border-primary-700 shadow-sm">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {tailors.map((tailor) => (
                <div
                  key={tailor.id}
                  className="bg-white dark:bg-neutral-800 rounded-xl shadow-md border border-neutral-100 dark:border-neutral-700 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-700 group flex flex-col"
                >
                  <div className="relative overflow-hidden">
                    {/* TODO: Replace with Next/Image */}
                    <img
                      src={tailor.imageUrl || '/placeholder.png'}
                      alt={tailor.name}
                      className="w-full h-56 object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                    />
                    {tailor.featured && (
                      <div className="absolute top-3 right-3 bg-primary-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-md backdrop-blur-sm border border-primary-400/50">
                        Featured
                      </div>
                    )}
                    {/* Dark overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-50 group-hover:opacity-80 transition-opacity"></div>

                    {/* Hover Action Button */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      <Link
                        href={`/services/tailoring/tailors/${tailor.id}`}
                        className="bg-white/90 backdrop-blur-sm hover:bg-white text-primary-700 font-medium px-4 py-2 rounded-lg shadow-lg border border-white/20 transition-all duration-200"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h2 className="text-xl font-bold text-primary-700 dark:text-primary-300 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-200 transition-colors">
                      {tailor.name}
                    </h2>
                    <div className="flex items-center mb-3">
                      <div className="flex text-secondary-500">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`w-4 h-4 ${i < Math.floor(tailor.rating) ? 'text-secondary-500' : 'text-neutral-300 dark:text-neutral-600'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                        ({tailor.reviews})
                      </span>
                    </div>
                    <div className="space-y-2 mb-5">
                      <p className="text-neutral-600 dark:text-neutral-400 flex items-center text-sm">
                        <span className="inline-block w-5 h-5 mr-2 text-primary-500">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </span>
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">Specialty:</span>
                        <span className="ml-1">{tailor.specialty}</span>
                      </p>
                      <p className="text-neutral-600 dark:text-neutral-400 flex items-center text-sm">
                        <span className="inline-block w-5 h-5 mr-2 text-primary-500">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </span>
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">Location:</span>
                        <span className="ml-1">{tailor.location}</span>
                      </p>
                    </div>
                    <div className="mt-auto pt-3 border-t border-neutral-100 dark:border-neutral-700">
                      <Link
                        href={`/services/tailoring/tailors/${tailor.id}`}
                        className="group inline-flex items-center justify-center w-full bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-primary-700 dark:text-primary-300 font-medium py-2.5 px-5 rounded-lg transition-colors duration-200 border border-neutral-200 dark:border-neutral-600 hover:border-primary-200 dark:hover:border-primary-700"
                      >
                        View Profile
                        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination with improved styling */}
        <div className="mt-16">
          <div className="flex items-center justify-center">
            {/* Decorative line */}
            <div className="hidden sm:block h-0.5 bg-neutral-200 dark:bg-neutral-700 w-full max-w-[100px] mr-6"></div>

            <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <a href="#" className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </a>

              <a href="#" aria-current="page" className="z-10 bg-primary-50 dark:bg-primary-900/30 border-primary-500 dark:border-primary-500 text-primary-600 dark:text-primary-300 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                1
              </a>

              <a href="#" className="bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                2
              </a>
              <a href="#" className="bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 hidden md:inline-flex relative items-center px-4 py-2 border text-sm font-medium">
                3
              </a>
              <span className="relative inline-flex items-center px-4 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                ...
              </span>
              <a href="#" className="bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 hidden md:inline-flex relative items-center px-4 py-2 border text-sm font-medium">
                8
              </a>
              <a href="#" className="bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                9
              </a>
              <a href="#" className="bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                10
              </a>
              <a href="#" className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </a>
            </nav>

            {/* Decorative line */}
            <div className="hidden sm:block h-0.5 bg-neutral-200 dark:bg-neutral-700 w-full max-w-[100px] ml-6"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TailorsPage;
