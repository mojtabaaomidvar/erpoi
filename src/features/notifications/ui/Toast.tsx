// src/features/notifications/ui/Toast.tsx

import { Toast as ToastType } from '../types';

interface Props {
  toast: ToastType;
  onClose: () => void;
}

const typeStyles = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800',
    icon: '✅',
    text: 'text-green-900 dark:text-green-100',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
    icon: '❌',
    text: 'text-red-900 dark:text-red-100',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/30',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: '⚠️',
    text: 'text-yellow-900 dark:text-yellow-100',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'ℹ️',
    text: 'text-blue-900 dark:text-blue-100',
  },
};

export function Toast({ toast, onClose }: Props) {
  const style = typeStyles[toast.type];

  return (
    <div className={`${style.bg} ${style.border} border rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px] animate-slide-in`}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{style.icon}</span>
        <div className="flex-1">
          <h4 className={`font-semibold text-sm ${style.text}`}>{toast.title}</h4>
          <p className={`text-xs mt-1 ${style.text} opacity-80`}>{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          ×
        </button>
      </div>
    </div>
  );
}