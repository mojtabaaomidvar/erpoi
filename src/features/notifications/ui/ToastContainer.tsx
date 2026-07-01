// src/features/notifications/ui/ToastContainer.tsx

import { Toast } from './Toast';
import { Toast as ToastType } from '../types';

interface Props {
  toasts: ToastType[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => onClose(toast.id)} />
      ))}
    </div>
  );
}