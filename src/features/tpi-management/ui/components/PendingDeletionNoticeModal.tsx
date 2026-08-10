import { Clock3, LockKeyhole } from "lucide-react";
import { Button, Modal } from "@design-system";

interface PendingDeletionNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PendingDeletionNoticeModal({
  isOpen,
  onClose,
}: PendingDeletionNoticeModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Deletion Request Pending"
      size="sm"
    >
      <div className="space-y-4 p-5">
        <div className="flex gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="space-y-2">
            <p className="text-sm font-semibold">
              This inspection package is locked.
            </p>
            <p className="text-sm leading-5">
              A deletion request has been submitted for this inspection, and the
              manager has not made a decision yet. No action can be taken until
              the request is approved or rejected.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Clock3 className="h-4 w-4" aria-hidden="true" />
          Waiting for managerial review
        </div>

        <div className="flex justify-end">
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
