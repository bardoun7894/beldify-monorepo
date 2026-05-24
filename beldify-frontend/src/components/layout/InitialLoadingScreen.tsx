'use client';

import { useState, useEffect } from 'react';

const LOADING_MESSAGE = "جاري تحميل تجربتك.";
const SESSION_STORAGE_KEY = 'hasShownInitialLoader';

const InitialLoadingScreen = () => {
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const hasShown = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!hasShown) {
      setShowLoader(true);
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
      setTimeout(() => setShowLoader(false), 3000);
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
