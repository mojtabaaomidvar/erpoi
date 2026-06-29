// src/shared/hooks/useClickOutside.ts

import { useEffect, RefObject } from'react';

export function useClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  handler: () => void
): void {
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler(); // ✅ تغییر callback به handler
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [ref, handler]); // ✅ تغییر callback به handler
}