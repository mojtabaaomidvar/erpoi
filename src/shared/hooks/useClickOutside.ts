// src/shared/hooks/useClickOutside.ts
import { useEffect, RefObject } from 'react';

/**
 * Hook برای تشخیص کلیک بیرون از یک عنصر
 * @param ref - Reference به عنصر DOM
 * @param handler - تابعی که وقتی کلیک بیرون اتفاق بیفته صدا زده میشه
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void
): void {
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler(); // ✅ تغییر callback به handler
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [ref, handler]); // ✅ تغییر callback به handler در dependency array
}