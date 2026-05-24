// 'use client';

// import { useForm } from 'react-hook-form';
// import { useAuth } from '@/contexts/AuthContext';
// import { useState } from 'react';
// import { useTranslation } from 'react-i18next';
// import Link from 'next/link';
// import { toast } from 'react-hot-toast';
// import Image from 'next/image';

// type RegisterFormData = {
//   [key: string]: string;
//   username: string;
//   email: string;
//   password: string;
//   password_confirmation: string;
//   contact_number: string;
// };

// export default function RegisterForm() {
//   const { register: registerUser } = useAuth();
//   const { t, i18n } = useTranslation();
//   const [error, setError] = useState<string>('');
//   const [isLoading, setIsLoading] = useState(false);
//   const locale = i18n.language;

//   const {
//     register,
//     handleSubmit,
//     watch,
//     formState: { errors },
//   } = useForm<RegisterFormData>();

//   const password = watch('password');

//   const onSubmit = async (data: RegisterFormData) => {
//     try {
//       setIsLoading(true);
//       setError('');

//       const response = await registerUser(data);
//       if (response.success) {
//         toast.success(t('auth.registration_successful'));
//         // Optionally redirect to login or dashboard
//         window.location.href = '/login';
//       }
//     } catch (err: any) {
//       console.error('Registration error:', err);
//       if (err.errors) {
//         // Handle field-specific validation errors
//         Object.entries(err.errors).forEach(([field, messages]) => {
//           const message = Array.isArray(messages) ? messages[0] : messages;
//           setError(prevError => prevError + (prevError ? '\n' : '') + message);
//         });
//       } else {
//         setError(err.message || t('auth.registration_failed'));
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="tw-min-h-screen tw-bg-gray-50 tw-flex tw-flex-col md:tw-flex-row">
//       {/* Left Side - Banner */}
//       <div className="tw-hidden md:tw-flex md:tw-w-1/2 tw-bg-gradient-to-br tw-from-blue-600 tw-to-blue-800 tw-p-12 tw-items-center tw-justify-center">
//         <div className="tw-max-w-lg tw-text-white">
//           <h1 className="tw-text-4xl tw-font-bold tw-mb-8">{t('auth.create_your_account')}</h1>
//           <p className="tw-text-xl tw-mb-8">{t('auth.join_our_community')}</p>
//           <div className="tw-space-y-6">
//             <div className="tw-flex tw-items-center">
//               <svg className="tw-w-6 tw-h-6 tw-mr-4" fill="currentColor" viewBox="0 0 20 20">
//                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
//               </svg>
//               <span>{t('auth.exclusive_member_benefits')}</span>
//             </div>
//             <div className="tw-flex tw-items-center">
//               <svg className="tw-w-6 tw-h-6 tw-mr-4" fill="currentColor" viewBox="0 0 20 20">
//                 <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
//               </svg>
//               <span>{t('auth.fast_checkout')}</span>
//             </div>
//             <div className="tw-flex tw-items-center">
//               <svg className="tw-w-6 tw-h-6 tw-mr-4" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
//               </svg>
//               <span>{t('auth.personalized_recommendations')}</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Right Side - Registration Form */}
//       <div className="tw-flex-1 tw-flex tw-flex-col tw-justify-center tw-px-4 tw-py-12 sm:tw-px-6 lg:tw-flex-none lg:tw-px-20 xl:tw-px-24">
//         <div className="tw-mx-auto tw-w-full tw-max-w-sm lg:tw-w-96">
//           <div className="tw-text-center tw-mb-8">
//             <Image
//               src="/logo.png"
//               alt="Logo"
//               width={120}
//               height={40}
//               className="tw-mx-auto tw-mb-4"
//             />
//             <h2 className="tw-text-3xl tw-font-bold tw-text-gray-900">{t('auth.create_account')}</h2>
//             <p className="tw-mt-2 tw-text-sm tw-text-gray-600">
//               {t('auth.already_have_account')}{' '}
//               <Link href="/login" className="tw-font-medium tw-text-blue-600 hover:tw-text-blue-500">
//                 {t('auth.sign_in')}
//               </Link>
//             </p>
//           </div>

//           <form onSubmit={handleSubmit(onSubmit)} className="tw-space-y-6">
//             {error && (
//               <div className="tw-p-4 tw-text-sm tw-text-red-800 tw-rounded-lg tw-bg-red-50" role="alert">
//                 {error}
//               </div>
//             )}

//             <div className="tw-space-y-6">
//               <div>
//                 <label htmlFor="full_name" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
//                   {t('auth.full_name')}
//                 </label>
//                 <div className="tw-mt-1">
//                   <input
//                     {...register(`full_name_${locale}`, {
//                       required: t('auth.full_name_required'),
//                     })}
//                     type="text"
//                     id="full_name"
//                     dir={locale === 'en' ? 'ltr' : 'rtl'}
//                     className="tw-appearance-none tw-block tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm placeholder-gray-400 focus:tw-outline-none focus:tw-ring-blue-500 focus:tw-border-blue-500"
//                   />
//                   {errors[`full_name_${locale}`] && (
//                     <p className="tw-mt-1 tw-text-sm tw-text-red-600">
//                       {errors[`full_name_${locale}`].message}
//                     </p>
//                   )}
//                 </div>
//               </div>

//               <div>
//                 <label htmlFor="username" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
//                   {t('auth.username')}
//                 </label>
//                 <div className="tw-mt-1">
//                   <input
//                     {...register('username', {
//                       required: t('auth.username_required'),
//                       minLength: {
//                         value: 3,
//                         message: t('auth.username_min_length'),
//                       },
//                     })}
//                     type="text"
//                     id="username"
//                     className="tw-appearance-none tw-block tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm placeholder-gray-400 focus:tw-outline-none focus:tw-ring-blue-500 focus:tw-border-blue-500"
//                   />
//                   {errors.username && (
//                     <p className="tw-mt-1 tw-text-sm tw-text-red-600">{errors.username.message}</p>
//                   )}
//                 </div>
//               </div>

//               <div>
//                 <label htmlFor="email" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
//                   {t('auth.email_address')}
//                 </label>
//                 <div className="tw-mt-1">
//                   <input
//                     {...register('email', {
//                       required: t('auth.email_required'),
//                       pattern: {
//                         value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
//                         message: t('auth.invalid_email'),
//                       },
//                     })}
//                     type="email"
//                     id="email"
//                     className="tw-appearance-none tw-block tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm placeholder-gray-400 focus:tw-outline-none focus:tw-ring-blue-500 focus:tw-border-blue-500"
//                   />
//                   {errors.email && (
//                     <p className="tw-mt-1 tw-text-sm tw-text-red-600">{errors.email.message}</p>
//                   )}
//                 </div>
//               </div>

//               <div>
//                 <label htmlFor="contact_number" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
//                   {t('auth.contact_number')}
//                 </label>
//                 <div className="tw-mt-1">
//                   <input
//                     {...register('contact_number')}
//                     type="tel"
//                     id="contact_number"
//                     className="tw-appearance-none tw-block tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm placeholder-gray-400 focus:tw-outline-none focus:tw-ring-blue-500 focus:tw-border-blue-500"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label htmlFor="password" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
//                   {t('auth.password')}
//                 </label>
//                 <div className="tw-mt-1">
//                   <input
//                     {...register('password', {
//                       required: t('auth.password_required'),
//                       minLength: {
//                         value: 8,
//                         message: t('auth.password_min_length'),
//                       },
//                     })}
//                     type="password"
//                     id="password"
//                     className="tw-appearance-none tw-block tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm placeholder-gray-400 focus:tw-outline-none focus:tw-ring-blue-500 focus:tw-border-blue-500"
//                   />
//                   {errors.password && (
//                     <p className="tw-mt-1 tw-text-sm tw-text-red-600">{errors.password.message}</p>
//                   )}
//                 </div>
//               </div>

//               <div>
//                 <label htmlFor="password_confirmation" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
//                   {t('auth.confirm_password')}
//                 </label>
//                 <div className="tw-mt-1">
//                   <input
//                     {...register('password_confirmation', {
//                       required: t('auth.password_required'),
//                       validate: value =>
//                         value === password || t('auth.passwords_must_match'),
//                     })}
//                     type="password"
//                     id="password_confirmation"
//                     className="tw-appearance-none tw-block tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm placeholder-gray-400 focus:tw-outline-none focus:tw-ring-blue-500 focus:tw-border-blue-500"
//                   />
//                   {errors.password_confirmation && (
//                     <p className="tw-mt-1 tw-text-sm tw-text-red-600">
//                       {errors.password_confirmation.message}
//                     </p>
//                   )}
//                 </div>
//               </div>
//             </div>

//             <div>
//               <button
//                 type="submit"
//                 disabled={isLoading}
//                 className="tw-w-full tw-flex tw-justify-center tw-py-2 tw-px-4 tw-border tw-border-transparent tw-rounded-md tw-shadow-sm tw-text-sm tw-font-medium tw-text-white tw-bg-blue-600 hover:tw-bg-blue-700 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-blue-500 disabled:tw-opacity-50"
//               >
//                 {isLoading ? t('common.loading') : t('auth.register')}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }
