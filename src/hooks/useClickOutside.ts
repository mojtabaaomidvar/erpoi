// src/hooks/useClickOutside.ts
import { useEffect, RefObject } from 'react';

/**
 * Hook برای تشخیص کلیک بیرون از یک عنصر
 * @param ref - Reference به عنصر DOM
 * @param callback - تابعی که وقتی کلیک بیرون اتفاق بیفته صدا زده میشه
 * 
 * @example
 * const dropdownRef = useRef<HTMLDivElement>(null);
 * useClickOutside(dropdownRef, () => setIsOpen(false));
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  callback: () => void
): void {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    // اضافه کردن event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, callback]);
}