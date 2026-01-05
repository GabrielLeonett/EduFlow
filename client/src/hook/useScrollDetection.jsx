import { useEffect } from 'react';

export const useScrollDetection = (callback, threshold) => {
  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop } = document.documentElement;

      if (scrollTop > threshold) {
        callback();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [callback, threshold]);
};