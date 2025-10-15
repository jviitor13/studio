/**
 * Google OAuth Script Loader Component
 */

'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    google: any;
  }
}

export function GoogleOAuthScript() {
  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google) {
        return; // Already loaded
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google OAuth script loaded');
      };
      script.onerror = () => {
        console.error('Failed to load Google OAuth script');
      };
      
      document.head.appendChild(script);
    };

    loadGoogleScript();
  }, []);

  return null;
}
