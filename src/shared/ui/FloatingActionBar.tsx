// src/shared/ui/FloatingActionBar.tsx

import { useState } from 'react';
import { useTheme } from '@app/providers/ThemeProvider';
import { confirmDialog } from './ConfirmDialog';
import { showToast } from './ToastContainer';

interface FloatingActionBarProps {
  onSave: () => Promise<void> | void;
  onCancel: () => void;
  hasChanges?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  saving?: boolean;
}

export function FloatingActionBar({
  onSave,
  onCancel,
  hasChanges = true,
  saveLabel = 'Save Changes',
  cancelLabel = 'Cancel',
  saving = false,
}: FloatingActionBarProps) {
  const { isDark } = useTheme();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const confirmed = await confirmDialog({
      title: 'Confirm Save',
      message: 'Are you sure you want to save these changes?\nThis action cannot be undone.',
      confirmText: 'Yes, Save',
      cancelText: 'Cancel',
      variant: 'info',
    });

    if (!confirmed) return;

    setIsSaving(true);
    try {
      await onSave();
      showToast('success', 'Saved Successfully', 'Your changes have been saved');
    } catch (error: any) {
      showToast('error', 'Save Failed', error.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    if (hasChanges) {
      const confirmed = await confirmDialog({
        title: 'Discard Changes?',
        message: 'You have unsaved changes.\nAre you sure you want to discard them?',
        confirmText: 'Yes, Discard',
        cancelText: 'Keep Editing',
        variant: 'warning',
      });

      if (!confirmed) return;
    }

    onCancel();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`
        flex items-center gap-3 px-4 py-2.5 rounded-full
        backdrop-blur-xl border shadow-2xl
        transition-all duration-300
        ${isDark 
          ? 'bg-slate-900/70 border-slate-700/50 shadow-black/40' 
          : 'bg-white/70 border-slate-200/50 shadow-black/10'
        }
      `}>
        {/* Status Indicator */}
        <div className="flex items-center gap-2 px-2">
          {hasChanges ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className={`text-xs font-medium whitespace-nowrap ${
                isDark ? 'text-amber-300' : 'text-amber-700'
              }`}>
                Unsaved
              </span>
            </>
          ) : (
            <>
              <span className="text-emerald-500 text-sm">✓</span>
              <span className={`text-xs font-medium whitespace-nowrap ${
                isDark ? 'text-emerald-300' : 'text-emerald-700'
              }`}>
                Saved
              </span>
            </>
          )}
        </div>

        {/* Divider */}
        <div className={`h-5 w-px ${isDark ? 'bg-slate-600/50' : 'bg-slate-300/50'}`} />

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className={`
              px-4 py-1.5 rounded-full text-xs font-medium
              transition-all duration-200
              ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
              ${isDark 
                ? 'text-slate-200 hover:bg-slate-800' 
                : 'text-slate-700 hover:bg-slate-100'
              }
            `}
          >
            {cancelLabel}
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || saving || !hasChanges}
            className={`
              px-5 py-1.5 rounded-full text-xs font-semibold
              transition-all duration-200
              flex items-center gap-1.5
              ${isSaving || saving || !hasChanges 
                ? isDark
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/50 hover:-translate-y-0.5'
              }
            `}
          >
            {isSaving || saving ? (
              <>
                <span className="animate-spin text-xs">⏳</span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>{saveLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}