'use client';

import { useState, useEffect } from 'react';

const LOADING_MESSAGE = "جاري تحميل تجربتك.";
const SESSION_STORAGE_KEY = 'hasShownInitialLoader';

const InitialLoadingScreen = () => {
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    let hasShown = false;
    try {
      hasShown = sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
    } catch {
      /* sessionStorage unavailable (private-mode / sandboxed iframe) */
    }
    if (!hasShown) {
      setShowLoader(true);
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
      } catch {
        /* ignore */
      }
      const id = setTimeout(() => setShowLoader(false), 3000);
      return () => clearTimeout(id);
    }
  }, []);

  if (!showLoader) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <p className="text-3xl text-black">{LOADING_MESSAGE}</p>
    </div>
  );
};

export default InitialLoadingScreen;
