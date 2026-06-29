import { useState, useEffect } from 'react';
import { loadFromStorage, saveToStorage } from '@shared/lib/storage';

export function usePersistedState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    return loadFromStorage(key, initialValue);
  });

  useEffect(() => {
    saveToStorage(key, state);
  }, [key, state]);

  return [state, setState] as const;
}




