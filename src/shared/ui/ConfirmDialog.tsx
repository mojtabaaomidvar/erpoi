// src/shared/ui/ConfirmDialog.tsx

import { useEffect, useState } from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmDialogState {
  isOpen: boolean;
  options: ConfirmOptions | null;
}

// 🔧 FIX: حذف globalResolve (استفاده نمی‌شد)
let globalSetter: ((state: ConfirmDialogState) => void) | null = null;

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (globalSetter) {
      // ذخیره resolve در state
      globalSetter({ 
        isOpen: true, 
        options,
      });
      
      // 🔧 FIX: ذخیره resolve در یک متغیر موقت
      (window as any).__confirmDialogResolve = resolve;
    } else {
      // اگه Provider نبود، فورا true برگردون
      console.warn('[ConfirmDialog] Provider not mounted. Auto-resolving to true.');
      resolve(true);
    }
  });
}

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmDialogState>({
    isOpen: false,
    options: null,
  });

  useEffect(() => {
    globalSetter = setState;
    return () => { globalSetter = null; };
  }, []);

  const handleConfirm = () => {
    // 🔧 FIX: صدا زدن resolve ذخیره شده
    const resolve = (window as any).__confirmDialogResolve;
    if (resolve) {
      resolve(true);
      delete (window as any).__confirmDialogResolve;
    }
    setState({ isOpen: false, options: null });
  };

  const handleCancel = () => {
    // 🔧 FIX: صدا زدن resolve ذخیره شده
    const resolve = (window as any).__confirmDialogResolve;
    if (resolve) {
      resolve(false);
      delete (window as any).__confirmDialogResolve;
    }
    setState({ isOpen: false, options: null });
  };

  if (!state.isOpen || !state.options) return <>{children}</>;

  const variantStyles = {
    danger: 'border-red-500',
    warning: 'border-yellow-500',
    info: 'border-blue-500',
  };

  const iconMap = {
    danger: '🚨',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <>
      {children}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4 backdrop-blur-sm">
        <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-md w-full border-t-4 ${variantStyles[state.options.variant || 'info']} animate-in fade-in zoom-in-95 duration-200`}>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <span className="text-3xl">{iconMap[state.options.variant || 'info']}</span>
              <div className="flex-1">
                {state.options.title && (
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                    {state.options.title}
                  </h3>
                )}
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                  {state.options.message}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 rounded-b-lg">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium"
            >
              {state.options.cancelText || 'Cancel'}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                state.options.variant === 'danger'
                  ? 'bg-red-600 hover:bg-red-700'
                  : state.options.variant === 'warning'
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {state.options.confirmText || 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}