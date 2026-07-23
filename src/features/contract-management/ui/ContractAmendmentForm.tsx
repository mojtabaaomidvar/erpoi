// src/features/contract-management/ui/ContractAmendmentForm.tsx

import { Button, Modal } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { JalaaliDatePicker } from "@shared/ui/JalaaliDatePicker";
import type {
  Contract,
  TariffLine,
} from "@/features/contract-management/domain";
import {
  formatNumberInput,
  parseNumberInput,
} from "@entities/contract/services/contractCalculations";
import { formatCurrency } from "@shared/lib/formatters";
import { useContractAmendmentForm } from "../hooks/useContractAmendmentForm";

interface ContractAmendmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  contractTariffs?: TariffLine[];
  onSuccess: () => void;
}

export function ContractAmendmentForm({
  isOpen,
  onClose,
  contract,
  contractTariffs = [],
  onSuccess,
}: ContractAmendmentFormProps) {
  const { isDark } = useTheme();

  const {
    isSaving,
    amendmentTypes,
    effectiveDate,
    setEffectiveDate,
    amendmentNo,
    setAmendmentNo,
    description,
    setDescription,
    attachmentFiles,
    attachmentNames,
    newEndDate,
    setNewEndDate,
    newValue,
    setNewValue,
    tariffAdjustments,
    isFormValid,
    toggleAmendmentType,
    updateTariffAdjustment,
    handleFileChange,
    removeFile,
    handleSubmit,
  } = useContractAmendmentForm(
    isOpen,
    contract,
    contractTariffs,
    onSuccess,
    onClose,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🔄 Contract Amendment"
      size="xl"
    >
      <div className="space-y-6">
        {/* Contract Info */}
        <div
          className={`rounded-xl border p-4 ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50/50"}`}
        >
          <h3
            className={`text-sm font-bold mb-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}
          >
            📄 Contract Information
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div
                className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                Contract No
              </div>
              <div
                className={`font-mono text-xs ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                {contract.contract_no}
              </div>
            </div>
            <div>
              <div
                className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                Client
              </div>
              <div
                className={`text-xs ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                {contract.client_name}
              </div>
            </div>
            <div>
              <div
                className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                Current End Date
              </div>
              <div
                className={`text-xs ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                {contract.end_date}
              </div>
            </div>
            <div>
              <div
                className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                Current Value
              </div>
              <div
                className={`text-xs font-bold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
              >
                {formatCurrency(contract.total_value, contract.currency)}
              </div>
            </div>
          </div>
        </div>

        {/* Amendment Types */}
        <div>
          <label
            className={`mb-2 block text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
          >
            Amendment Types * (Multiple Selection)
            {amendmentTypes.length === 0 && (
              <span
                className={`ml-2 text-[10px] font-normal ${isDark ? "text-rose-400" : "text-rose-600"}`}
              >
                ⚠️ At least one type is required
              </span>
            )}
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => toggleAmendmentType("DATE_EXTENSION")}
              className={`rounded-xl border-2 p-4 text-left transition-all ${amendmentTypes.includes("DATE_EXTENSION") ? (isDark ? "border-indigo-500 bg-indigo-950/50" : "border-indigo-500 bg-indigo-50") : isDark ? "border-slate-700 bg-slate-800/30 hover:border-slate-600" : "border-slate-200 bg-white hover:border-slate-300"}`}
            >
              <div className="text-2xl mb-2">📅</div>
              <div
                className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                Date Extension
              </div>
              <div
                className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                Extend contract end date
              </div>
            </button>

            <button
              type="button"
              onClick={() => toggleAmendmentType("VALUE_INCREASE")}
              className={`rounded-xl border-2 p-4 text-left transition-all ${amendmentTypes.includes("VALUE_INCREASE") ? (isDark ? "border-emerald-500 bg-emerald-950/50" : "border-emerald-500 bg-emerald-50") : isDark ? "border-slate-700 bg-slate-800/30 hover:border-slate-600" : "border-slate-200 bg-white hover:border-slate-300"}`}
            >
              <div className="text-2xl mb-2">💰</div>
              <div
                className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                Value Increase
              </div>
              <div
                className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                Increase contract value
              </div>
            </button>

            <button
              type="button"
              onClick={() => toggleAmendmentType("TARIFF_ADJUSTMENT")}
              className={`rounded-xl border-2 p-4 text-left transition-all ${amendmentTypes.includes("TARIFF_ADJUSTMENT") ? (isDark ? "border-amber-500 bg-amber-950/50" : "border-amber-500 bg-amber-50") : isDark ? "border-slate-700 bg-slate-800/30 hover:border-slate-600" : "border-slate-200 bg-white hover:border-slate-300"}`}
            >
              <div className="text-2xl mb-2">📊</div>
              <div
                className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                Tariff Adjustment
              </div>
              <div
                className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                Adjust tariff rates
              </div>
            </button>
          </div>
        </div>

        {/* Effective Date & Amendment No */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              className={`mb-1.5 block text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Effective Date *
            </label>
            <JalaaliDatePicker
              value={effectiveDate}
              onChange={setEffectiveDate}
              placeholder="Select effective date"
            />
          </div>
          <div>
            <label
              className={`mb-1.5 block text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Amendment No (Optional)
            </label>
            <input
              value={amendmentNo}
              onChange={(e) => setAmendmentNo(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm ${isDark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 bg-white"}`}
              placeholder="Auto-generated if empty"
            />
          </div>
        </div>

        {/* Date Extension */}
        {amendmentTypes.includes("DATE_EXTENSION") && (
          <div
            className={`rounded-xl border-2 p-4 ${isDark ? "border-indigo-700 bg-indigo-950/30" : "border-indigo-200 bg-indigo-50/30"}`}
          >
            <h4
              className={`text-sm font-bold mb-3 ${isDark ? "text-indigo-200" : "text-indigo-900"}`}
            >
              📅 Date Extension
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className={`mb-1.5 block text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Current End Date
                </label>
                <div
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${isDark ? "border-slate-700 bg-slate-800 text-slate-400" : "border-slate-200 bg-slate-100 text-slate-600"}`}
                >
                  {contract.end_date}
                </div>
              </div>
              <div>
                <label
                  className={`mb-1.5 block text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  New End Date *
                </label>
                <JalaaliDatePicker
                  value={newEndDate}
                  onChange={setNewEndDate}
                  minDate={contract.end_date}
                  placeholder="Select new end date"
                />
              </div>
            </div>
          </div>
        )}

        {/* Value Increase */}
        {amendmentTypes.includes("VALUE_INCREASE") && (
          <div
            className={`rounded-xl border-2 p-4 ${isDark ? "border-emerald-700 bg-emerald-950/30" : "border-emerald-200 bg-emerald-50/30"}`}
          >
            <h4
              className={`text-sm font-bold mb-3 ${isDark ? "text-emerald-200" : "text-emerald-900"}`}
            >
              💰 Value Increase
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className={`mb-1.5 block text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Current Value
                </label>
                <div
                  className={`w-full rounded-lg border px-3 py-2 text-sm font-mono ${isDark ? "border-slate-700 bg-slate-800 text-slate-400" : "border-slate-200 bg-slate-100 text-slate-600"}`}
                >
                  {formatCurrency(contract.total_value, contract.currency)}
                </div>
              </div>
              <div>
                <label
                  className={`mb-1.5 block text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  New Value *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={newValue ? formatNumberInput(String(newValue)) : ""}
                  onChange={(e) =>
                    setNewValue(parseNumberInput(e.target.value))
                  }
                  className={`w-full rounded-lg border px-3 py-2 text-sm font-mono text-right ${isDark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 bg-white"}`}
                  placeholder="0"
                />
              </div>
            </div>
            {newValue > contract.total_value && (
              <div
                className={`mt-3 rounded-lg p-2 text-xs ${isDark ? "bg-emerald-900/30 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}
              >
                ✓ Increase:{" "}
                {formatCurrency(
                  newValue - contract.total_value,
                  contract.currency,
                )}{" "}
                (
                {(
                  ((newValue - contract.total_value) / contract.total_value) *
                  100
                ).toFixed(1)}
                %)
              </div>
            )}
          </div>
        )}

        {/* Tariff Adjustment */}
        {amendmentTypes.includes("TARIFF_ADJUSTMENT") && (
          <div
            className={`rounded-xl border-2 p-4 ${isDark ? "border-amber-700 bg-amber-950/30" : "border-amber-200 bg-amber-50/30"}`}
          >
            <h4
              className={`text-sm font-bold mb-3 ${isDark ? "text-amber-200" : "text-amber-900"}`}
            >
              📊 Tariff Adjustment
            </h4>
            {tariffAdjustments.length === 0 ? (
              <div
                className={`text-center py-8 text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                <div className="text-4xl mb-2">📭</div>
                <p>No tariff lines found for this contract</p>
              </div>
            ) : (
              <div
                className={`overflow-x-auto rounded-lg border ${isDark ? "border-slate-700" : "border-slate-200"}`}
              >
                <table className="w-full text-left text-xs">
                  <thead
                    className={`${isDark ? "bg-slate-800/50 text-slate-400" : "bg-slate-50/70 text-slate-500"} text-[10px] uppercase tracking-wide`}
                  >
                    <tr>
                      <th className="px-3 py-2 font-semibold">Description</th>
                      <th className="px-3 py-2 font-semibold">Unit</th>
                      <th className="px-3 py-2 font-semibold text-right">
                        Previous Rate
                      </th>
                      <th className="px-3 py-2 font-semibold text-center">
                        Mode
                      </th>
                      <th className="px-3 py-2 font-semibold text-right">
                        Adjustment
                      </th>
                      <th className="px-3 py-2 font-semibold text-right">
                        New Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className={
                      isDark
                        ? "divide-y divide-slate-700/50"
                        : "divide-y divide-slate-200/70"
                    }
                  >
                    {tariffAdjustments.map((adj: any) => (
                      <tr
                        key={adj.tariff_line_id}
                        className={
                          isDark
                            ? "hover:bg-slate-800/30"
                            : "hover:bg-slate-50/50"
                        }
                      >
                        <td
                          className={`px-3 py-2 font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}
                        >
                          {adj.description}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[9px] font-semibold ${isDark ? "bg-indigo-900/50 text-indigo-300" : "bg-indigo-50 text-indigo-700"}`}
                          >
                            {adj.unit.replace("_", " ")}
                          </span>
                        </td>
                        <td
                          className={`px-3 py-2 text-right font-mono ${isDark ? "text-slate-400" : "text-slate-600"}`}
                        >
                          {formatCurrency(adj.previous_rate, contract.currency)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex gap-1 justify-center">
                            <button
                              type="button"
                              onClick={() =>
                                updateTariffAdjustment(
                                  adj.tariff_line_id,
                                  "adjustment_mode",
                                  "PERCENTAGE",
                                )
                              }
                              className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${adj.adjustment_mode === "PERCENTAGE" ? "bg-amber-600 text-white" : isDark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-slate-200 text-slate-600 hover:bg-slate-300"}`}
                            >
                              %
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateTariffAdjustment(
                                  adj.tariff_line_id,
                                  "adjustment_mode",
                                  "MANUAL",
                                )
                              }
                              className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${adj.adjustment_mode === "MANUAL" ? "bg-amber-600 text-white" : isDark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-slate-200 text-slate-600 hover:bg-slate-300"}`}
                            >
                              ✏️
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {adj.adjustment_mode === "PERCENTAGE" ? (
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={
                                  adj.adjustment_percentage
                                    ? formatNumberInput(
                                        String(adj.adjustment_percentage),
                                      )
                                    : ""
                                }
                                onChange={(e) =>
                                  updateTariffAdjustment(
                                    adj.tariff_line_id,
                                    "adjustment_percentage",
                                    parseNumberInput(e.target.value),
                                  )
                                }
                                className={`w-20 rounded border px-2 py-1 text-xs font-mono text-right ${isDark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 bg-white"}`}
                                placeholder="0"
                              />
                              <span
                                className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                              >
                                %
                              </span>
                            </div>
                          ) : (
                            <input
                              type="text"
                              inputMode="numeric"
                              value={
                                adj.new_rate
                                  ? formatNumberInput(String(adj.new_rate))
                                  : ""
                              }
                              onChange={(e) =>
                                updateTariffAdjustment(
                                  adj.tariff_line_id,
                                  "new_rate",
                                  parseNumberInput(e.target.value),
                                )
                              }
                              className={`w-24 rounded border px-2 py-1 text-xs font-mono text-right ${isDark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 bg-white"}`}
                              placeholder="0"
                            />
                          )}
                        </td>
                        <td
                          className={`px-3 py-2 text-right font-mono font-bold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                        >
                          {formatCurrency(adj.new_rate, contract.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <div>
          <label
            className={`mb-1.5 block text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={`w-full rounded-lg border px-3 py-2 text-sm ${isDark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 bg-white"}`}
            placeholder="Optional description..."
          />
        </div>

        {/* Attachment */}
        <div>
          <label
            className={`mb-1.5 block text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            Amendment Documents * (PDF, DOC, DOCX) - Multiple files allowed
          </label>
          <div className="relative">
            <input
              type="file"
              id="amendment-file-input"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="amendment-file-input"
              className={`flex items-center justify-between gap-2 w-full rounded-lg border-2 px-3 py-2.5 text-sm cursor-pointer transition-colors ${attachmentFiles.length > 0 ? (isDark ? "border-emerald-600 bg-emerald-900/30 text-emerald-300" : "border-emerald-400 bg-emerald-50 text-emerald-700") : isDark ? "border-dashed border-slate-600 bg-slate-800/30 text-slate-400 hover:border-indigo-500" : "border-dashed border-slate-300 bg-slate-50 text-slate-600 hover:border-indigo-400"}`}
            >
              <div className="flex items-center gap-2">
                <span>📎</span>
                <span>
                  {attachmentFiles.length > 0
                    ? `${attachmentFiles.length} file${attachmentFiles.length > 1 ? "s" : ""} selected`
                    : "Click to attach documents"}
                </span>
              </div>
            </label>
          </div>

          {attachmentFiles.length > 0 && (
            <div
              className={`mt-2 space-y-1 rounded-lg border p-2 ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50"}`}
            >
              {attachmentFiles.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded ${isDark ? "bg-slate-700/50" : "bg-white"}`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm">
                      {file.name.endsWith(".pdf")
                        ? "📄"
                        : file.name.endsWith(".doc") ||
                            file.name.endsWith(".docx")
                          ? "📝"
                          : file.name.endsWith(".jpg") ||
                              file.name.endsWith(".jpeg") ||
                              file.name.endsWith(".png")
                            ? "🖼️"
                            : "📎"}
                    </span>
                    <span
                      className={`text-xs truncate ${isDark ? "text-slate-200" : "text-slate-700"}`}
                    >
                      {file.name}
                    </span>
                    <span
                      className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className={`p-1 rounded transition-colors ${isDark ? "text-rose-400 hover:bg-rose-900/30" : "text-rose-600 hover:bg-rose-50"}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Validation Status */}
        {!isFormValid && (
          <div
            className={`rounded-lg p-3 text-xs ${isDark ? "bg-amber-900/30 text-amber-300 border border-amber-700" : "bg-amber-50 text-amber-700 border border-amber-200"}`}
          >
            <div className="flex items-start gap-2">
              <span>⚠️</span>
              <div>
                <p className="font-semibold mb-1">
                  Please complete the following:
                </p>
                <ul className="list-disc list-inside space-y-0.5">
                  {amendmentTypes.length === 0 && (
                    <li>Select at least one amendment type</li>
                  )}
                  {!effectiveDate && <li>Select effective date</li>}
                  {amendmentTypes.includes("DATE_EXTENSION") && !newEndDate && (
                    <li>Select new end date</li>
                  )}
                  {amendmentTypes.includes("VALUE_INCREASE") &&
                    newValue <= 0 && <li>Enter new value greater than zero</li>}
                  {amendmentTypes.includes("TARIFF_ADJUSTMENT") &&
                    tariffAdjustments.length === 0 && (
                      <li>No tariffs available for adjustment</li>
                    )}
                  {amendmentTypes.includes("TARIFF_ADJUSTMENT") &&
                    tariffAdjustments.some(
                      (adj: any) =>
                        (adj.adjustment_mode === "PERCENTAGE" &&
                          adj.adjustment_percentage <= 0) ||
                        (adj.adjustment_mode === "MANUAL" && adj.new_rate <= 0),
                    ) && <li>Complete all tariff adjustments</li>}
                  {attachmentFiles.length === 0 && (
                    <li>Attach at least one document</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || !isFormValid}
            className={`${isSaving || !isFormValid ? "opacity-50 cursor-not-allowed" : ""} ${isSaving ? "cursor-wait" : ""}`}
          >
            {isSaving ? "⏳ Creating..." : "✓ Submit for Approval"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
