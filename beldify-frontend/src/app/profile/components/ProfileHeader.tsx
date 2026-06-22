'use client';

import { motion } from 'framer-motion';
import { User } from '@/types/auth';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { FiEdit2, FiMail, FiCalendar, FiUserCheck } from 'react-icons/fi';

interface ProfileHeaderProps {
  user: User;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  const { t, i18n } = useTranslation(['profile', 'common']);

  const getInitial = (name: string | undefined | null) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const dateLocaleMap: Record<string, string> = {
    en: 'en-US',
    fr: 'fr-FR',
    ar: 'ar-MA',
    ma: 'ar-MA',
    es: 'es-ES',
  };
  const dateLocale = dateLocaleMap[i18n.language] || 'fr-MA';

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(dateLocale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="relative overflow-hidden">
      {/* Premium gradient background with subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-indigo-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-20"></div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden opacity-10">
          <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-amber-400 blur-3xl"></div>
          <div className="absolute top-[60%] -left-[10%] w-[30%] h-[30%] rounded-full bg-indigo-300 blur-3xl"></div>
        </div>
      </div>
      
      <div className="relative z-10 px-6 py-8 sm:px-8">
        <div className="flex flex-col md:flex-row items-center gap-6 max-w-6xl mx-auto">
          {/* Avatar with gradient border */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full -inset-0.5 opacity-80 group-hover:opacity-100 transition-all duration-300">
              <div className="absolute inset-0 rounded-full bg-amber-300 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
            </div>
            
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
              {user?.image ? (
                <Image
                  src={user.image}
                  alt={user.full_name_en || t('default_user_name')}
                  fill
                  className="object-cover"
                  sizes="112px"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-3xl font-bold">
                  {getInitial(user?.full_name_en)}
                </div>
              )}
            </div>
            
            <button className="absolute -bottom-2 right-0 bg-white text-indigo-600 p-2 rounded-full shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 hover:bg-amber-50 border border-white/20">
              <FiEdit2 className="w-4 h-4" />
            </button>
          </motion.div>

          {/* User info */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-center md:text-left flex-1"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  {user?.full_name_en || t('default_user_name')}
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-2 mt-1 text-amber-100">
                  <FiMail className="w-4 h-4" />
                  <span>{user?.email || t('no_email')}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center gap-2 mt-4 sm:mt-0">
                {user?.created_at && (
                  <motion.span 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 text-white text-sm rounded-full border border-white/20 hover:bg-white/20 transition-colors"
                  >
                    <FiCalendar className="w-3.5 h-3.5 text-indigo-400" />
                    {t('member_since')} {new Date(user.created_at).getFullYear()}
                  </motion.span>
                )}
                {user?.user_type_id === 2 && (
                  <motion.span 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 text-white text-sm rounded-full border border-white/20 hover:bg-white/20 transition-colors"
                  >
                    <FiUserCheck className="w-3.5 h-3.5 text-amber-400" />
                    {t('roles.vip')}
                  </motion.span>
                )}
              </div>
            </div>
            
            {joinDate && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-indigo-100 text-sm mt-3 opacity-90"
              >
                {t('joined_on', { date: joinDate, defaultValue: `Joined on ${joinDate}` })}
              </motion.p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
