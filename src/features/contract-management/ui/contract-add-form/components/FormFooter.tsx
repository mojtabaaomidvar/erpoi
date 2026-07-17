// src/features/contract-management/ui/contract-add-form/components/FormFooter.tsx

import { Button } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";

interface FormFooterProps {
  currentStep: number;
  totalSteps: number;
  isSaving: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
  isDraft?: boolean;
  isEditMode?: boolean;
}

export function FormFooter({
  currentStep,
  totalSteps,
  isSaving,
  onPrev,
  onNext,
  onSaveDraft,
  onSubmit,
  onDelete,
  isDraft = false,
  isEditMode = false,
}: FormFooterProps) {
  const { isDark } = useTheme();

  const isLastStep = currentStep === totalSteps;
  const isFirstStep = currentStep === 1;

  return (
    <div
      className={`px-6 py-4 border-t ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}
    >
      <div className="flex items-center justify-between">
        {/* دکمه بازگشت */}
        <div>
          {!isFirstStep && (
            <Button variant="ghost" onClick={onPrev} disabled={isSaving}>
              ← Back
            </Button>
          )}
        </div>

        {/* دکمه‌های اکشن */}
        <div className="flex gap-3">
          {isDraft && onDelete && (
            <Button
              variant="outline"
              onClick={onDelete}
              disabled={isSaving}
              className="text-rose-600 border-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
            >
              🗑️ Delete Draft
            </Button>
          )}

          {/* دکمه Save as Draft (فقط در مراحل ۱ تا ۴) */}
          {!isEditMode && !isLastStep && (
            <Button
              variant="outline"
              onClick={onSaveDraft}
              disabled={isSaving}
              className="text-amber-600 border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            >
              {isSaving ? "⏳ Saving..." : "💾 Save as Draft"}
            </Button>
          )}

          {/* دکمه Next یا Submit */}
          {!isLastStep ? (
            <Button onClick={onNext} disabled={isSaving}>
              Next Step →
            </Button>
          ) : (
            <Button
              onClick={onSubmit}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSaving ? "⏳ Submitting..." : "✅ Submit for Approval"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
