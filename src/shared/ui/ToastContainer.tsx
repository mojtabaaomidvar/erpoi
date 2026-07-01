// src/shared/ui/ToastContainer.tsx
import { useState, useEffect, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

let globalAddToast: ((toast: Omit<Toast, 'id'>) => void) | null = null;

export function showToast(type: ToastType, title: string, message?: string) {
  if (globalAddToast) {
    globalAddToast({ type, title, message });
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    globalAddToast = addToast;
    return () => { globalAddToast = null; };
  }, [addToast]);

  const typeStyles: Record<ToastType, string> = {
    success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100',
    error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100',
    warning: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100',
    info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
  };

  const icons: Record<ToastType, string> = {
    success: '✅',
    error: '❌',
    warning: '️',
    info: 'ℹ️',
  };

  return (
    <>
      {children}
      <div className="fixed top-20 right-4 z-[300] space-y-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${typeStyles[toast.type]} border rounded-lg shadow-lg p-4 animate-slide-in`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{icons[toast.type]}</span>
              <div className="flex-1">
                <div className="font-semibold text-sm">{toast.title}</div>
                {toast.message && (
                  <div className="text-xs mt-1 opacity-80">{toast.message}</div>
                )}
              </div>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}