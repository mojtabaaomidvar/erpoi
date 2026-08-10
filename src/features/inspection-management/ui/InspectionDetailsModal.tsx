//We need to apply the suggested edit to the original code. The original code is just a comment line: `// src/features/inspection-management/ui/InspectionDetailsModal.tsx`. The suggested edit is the full file content. So the modified file should be exactly the suggested edit content. We must output only code, no explanation. We should ensure to preserve existing comments (the original comment is replaced? Actually the suggested edit includes the same comment line at top, so it's fine). Output the complete modified file as per suggested edit.```
// src/features/inspection-management/ui/InspectionDetailsModal.tsx

import { TPIDetailsModal } from "@/features/tpi-management/ui/TPIDetailsModal";
import type { TPIRequest } from "@/features/tpi-management";
import { Modal } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";

interface InspectionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspectionRequest: TPIRequest | null;
  onEdit: (request: TPIRequest) => void;
}

/**
 * Router / Dispatcher for inspection details.
 *
 * Reads the inspection's `category` field and delegates to the
 * appropriate type-specific details modal:
 *
 * - "TPI"  → TPIDetailsModal
 * - "MWS"  → placeholder (MWSDetailsModal in future phase)
 */
export function InspectionDetailsModal({
  isOpen,
  onClose,
  inspectionRequest,
  onEdit,
}: InspectionDetailsModalProps) {
  const { isDark } = useTheme();

  if (!inspectionRequest) return null;

  // ── TPI ──────────────────────────────────────────
  if (inspectionRequest.category === "TPI") {
    return (
      <TPIDetailsModal
        isOpen={isOpen}
        onClose={onClose}
        request={inspectionRequest}
        onEdit={onEdit}
      />
    );
  }

  // ── MWS ──────────────────────────────────────────
  if (inspectionRequest.category === "MWS") {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="MWS Request Details"
        size="xl"
      >
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">🚢</div>
          <h3
            className={`text-lg font-bold mb-2 ${isDark ? "text-slate-200" : "text-slate-800"}`}
          >
            Marine Warranty Survey
          </h3>
          <p
            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            MWS details module is under development and will be available soon.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 text-left text-xs">
            {inspectionRequest.stages?.map((stage, i) => (
              <span
                key={i}
                className={`px-3 py-2 rounded-lg ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}`}
              >
                ⚓ {stage}
              </span>
            ))}
          </div>
        </div>
      </Modal>
    );
  }

  // ── Fallback ─────────────────────────────────────
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Inspection Details"
      size="xl"
    >
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-3">❓</div>
        <p className="text-sm text-slate-500">
          Unknown inspection category: {inspectionRequest.category}
        </p>
      </div>
    </Modal>
  );
}
