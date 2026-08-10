import { useEffect, useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button, Modal } from "@design-system";

interface DeletionReasonModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  minLength: number;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
}

export function DeletionReasonModal({
  isOpen,
  title,
  description,
  confirmLabel,
  minLength,
  isSubmitting = false,
  onClose,
  onConfirm,
}: DeletionReasonModalProps) {
  const [reason, setReason] = useState("");
  const normalizedReason = reason.trim();

  useEffect(() => {
    if (!isOpen) setReason("");
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnBackdrop={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <div className="space-y-4 p-5">
        <div className="flex gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0"
            aria-hidden="true"
          />
          <p className="text-sm leading-5">{description}</p>
        </div>

        <div>
          <label
            htmlFor="deletion-reason"
            className="mb-1.5 block text-xs font-semibold"
          >
            Reason
          </label>
          <textarea
            id="deletion-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            disabled={isSubmitting}
            className="input-themed w-full resize-y rounded-md px-3 py-2 text-sm"
            placeholder="Provide a clear reason for this action"
          />
          <p className="mt-1 text-xs text-slate-500">
            Minimum {minLength} characters
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => onConfirm(normalizedReason)}
            disabled={isSubmitting || normalizedReason.length < minLength}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? "Submitting..." : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
