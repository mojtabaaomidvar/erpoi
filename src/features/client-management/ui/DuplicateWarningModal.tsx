// src/features/client-management/ui/DuplicateWarningModal.tsx

import { Button, Badge, Modal, Avatar } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type { DuplicateClientInfo } from "../domain/models/Client";
import { useDuplicateWarning } from "../hooks/useDuplicateWarning";

interface DuplicateWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveContact: (contact: any) => void;
  duplicateClient: DuplicateClientInfo | null;
  currentDepartment: string;
  isSameDepartmentDuplicate?: boolean;
}

export function DuplicateWarningModal({
  isOpen,
  onClose,
  onSaveContact,
  duplicateClient,
  currentDepartment,
  isSameDepartmentDuplicate = false,
}: DuplicateWarningModalProps) {
  const { isDark } = useTheme();
  const isLegal = duplicateClient?.type === "LEGAL";
  const deptNames = duplicateClient?._resolvedDepartmentNames || [];
  const deptNamesString =
    deptNames.length > 0 ? deptNames.join(", ") : "Unknown Unit";

  // ✅ تمام منطق فرم در هوک مدیریت می‌شود
  const { newContact, contactErrors, setContactField, handleConfirm } =
    useDuplicateWarning(
      isOpen,
      duplicateClient,
      isLegal,
      currentDepartment,
      onSaveContact,
      onClose,
    );

  if (!duplicateClient) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isLegal ? "Existing Legal Entity" : "Existing Individual Client"}
      size="lg"
    >
      <div className="space-y-5">
        {/* پیام متفاوت اگر در همان واحد است */}
        {isSameDepartmentDuplicate ? (
          <div
            className={`rounded-lg border p-4 ${isDark ? "border-rose-700 bg-rose-900/20" : "border-rose-200 bg-rose-50"}`}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">🚫</div>
              <div className="flex-1">
                <h3
                  className={`text-sm font-semibold mb-1 ${isDark ? "text-rose-200" : "text-rose-900"}`}
                >
                  Client Already Exists in Your Department
                </h3>
                <p
                  className={`text-xs leading-relaxed ${isDark ? "text-rose-300" : "text-rose-800"}`}
                >
                  This client is already registered in your department.
                  <br />
                  <span className="font-semibold">
                    No action is needed. You can find this client in your client
                    list.
                  </span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`rounded-lg border p-4 ${isDark ? "border-amber-700 bg-amber-900/20" : "border-amber-200 bg-amber-50"}`}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <h3
                  className={`text-sm font-semibold mb-1 ${isDark ? "text-amber-200" : "text-amber-900"}`}
                >
                  This client already exists in the system
                </h3>
                <p
                  className={`text-xs leading-relaxed ${isDark ? "text-amber-300" : "text-amber-800"}`}
                >
                  {isLegal
                    ? "This legal entity is already registered in: "
                    : "This individual is already registered in: "}
                  <span className="font-bold underline decoration-amber-500/50">
                    {deptNamesString}
                  </span>
                  .
                  <br />
                  {isLegal
                    ? `You can add a new contact person for your department (${currentDepartment}) without duplicating the main record.`
                    : `Click confirm to link this client to your department (${currentDepartment}). No existing data will be changed.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Client Info Summary */}
        <div
          className={`rounded-xl border p-4 ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50/30"}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <Avatar
              name={duplicateClient.name_en}
              gradient={duplicateClient.logoColor}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <h2
                className={`text-sm font-semibold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                {duplicateClient.name_en}
              </h2>
              <p
                className={`text-xs truncate ${isDark ? "text-slate-300" : "text-slate-600"}`}
                dir="rtl"
              >
                {duplicateClient.name_fa}
              </p>

              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge
                  tone={isLegal ? "indigo" : "violet"}
                  className="text-[9px]"
                >
                  {isLegal ? "Legal Entity" : "Individual"}
                </Badge>
                <Badge tone="slate" className="text-[9px]">
                  ID: {duplicateClient.national_id}
                </Badge>

                {deptNames.length > 0 ? (
                  deptNames.map((deptName: string, index: number) => (
                    <Badge
                      key={index}
                      tone="amber"
                      className="text-[9px] flex items-center gap-1"
                    >
                      <span>📍</span>
                      <span>{deptName}</span>
                    </Badge>
                  ))
                ) : (
                  <Badge tone="amber" className="text-[9px]">
                    📍 Unknown Unit
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Contact Form (Only for Legal and NOT same department) */}
        {isLegal && !isSameDepartmentDuplicate && (
          <div
            className={`rounded-xl border p-4 ${isDark ? "border-indigo-800 bg-indigo-950/20" : "border-indigo-200 bg-indigo-50/30"}`}
          >
            <h3
              className={`text-xs font-semibold mb-3 flex items-center gap-2 ${isDark ? "text-indigo-200" : "text-indigo-900"}`}
            >
              ➕ Add New Contact Person for {currentDepartment}
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Contact Name *
                  </label>
                  <input
                    value={newContact.name}
                    onChange={(e) => setContactField("name", e.target.value)}
                    className={`w-full rounded-lg border px-2.5 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 ${contactErrors.name ? "border-rose-300" : isDark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 bg-white"}`}
                  />
                  {contactErrors.name && (
                    <p className="mt-1 text-[10px] text-rose-600">
                      Name is required
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Position
                  </label>
                  <input
                    value={newContact.position}
                    onChange={(e) =>
                      setContactField("position", e.target.value)
                    }
                    className={`w-full rounded-lg border px-2.5 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 ${isDark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 bg-white"}`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Mobile *
                  </label>
                  <input
                    value={newContact.mobile}
                    onChange={(e) =>
                      setContactField(
                        "mobile",
                        e.target.value.replace(/\D/g, ""),
                      )
                    }
                    maxLength={11}
                    className={`w-full rounded-lg border px-2.5 py-1.5 text-sm font-mono focus:border-indigo-400 focus:outline-none focus:ring-1 ${contactErrors.mobile ? "border-rose-300" : isDark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 bg-white"}`}
                  />
                  {contactErrors.mobile && (
                    <p className="mt-1 text-[10px] text-rose-600">
                      Valid mobile required
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setContactField("email", e.target.value)}
                    className={`w-full rounded-lg border px-2.5 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 ${isDark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 bg-white"}`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div
          className={`flex justify-end gap-2 pt-3 border-t ${isDark ? "border-slate-700" : "border-slate-100"}`}
        >
          <Button variant="ghost" size="sm" onClick={onClose}>
            {isSameDepartmentDuplicate ? "Close" : "Cancel"}
          </Button>
          {!isSameDepartmentDuplicate && (
            <Button size="sm" onClick={handleConfirm} className="min-w-[140px]">
              {isLegal ? "💾 Save & Add Contact" : "✅ Confirm & Link"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
