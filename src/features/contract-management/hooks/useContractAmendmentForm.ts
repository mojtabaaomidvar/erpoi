// src/features/contract-management/hooks/useContractAmendmentForm.ts

import { useState, useEffect, useMemo } from "react";
import { showToast } from "@shared/ui/ToastContainer";
import { supabase } from "@shared/database/supabase";
import { amendmentAppService } from "../application";
import type {
  Contract,
  TariffLine,
  AmendmentType,
  TariffAdjustmentMode,
} from "@/features/contract-management/domain";
import { useAuth } from "@features/auth/hooks/useAuth";

export function useContractAmendmentForm(
  isOpen: boolean,
  contract: Contract,
  contractTariffs: TariffLine[],
  onSuccess: () => void,
  onClose: () => void,
) {
  const { user } = useAuth();

  const [isSaving, setIsSaving] = useState(false);
  const [amendmentTypes, setAmendmentTypes] = useState<AmendmentType[]>([]);
  const [effectiveDate, setEffectiveDate] = useState("");
  const [amendmentNo, setAmendmentNo] = useState("");
  const [description, setDescription] = useState("");
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentNames, setAttachmentNames] = useState<string[]>([]);
  const [newEndDate, setNewEndDate] = useState("");
  const [newValue, setNewValue] = useState<number>(0);
  const [tariffAdjustments, setTariffAdjustments] = useState<any[]>([]);

  // 🔧 Initialize tariff adjustments & reset form on open
  useEffect(() => {
    if (isOpen) {
      // Reset form state
      setAmendmentTypes([]);
      setEffectiveDate("");
      setAmendmentNo("");
      setDescription("");
      setAttachmentFiles([]);
      setAttachmentNames([]);
      setNewEndDate("");
      setNewValue(0);

      const tariffs =
        contract.tariffLines && contract.tariffLines.length > 0
          ? contract.tariffLines
          : contractTariffs.filter((t) => t.contract_id === contract.id);

      if (tariffs.length > 0) {
        setTariffAdjustments(
          tariffs.map((tariff) => {
            const rate =
              typeof tariff.rate === "string"
                ? Number(tariff.rate.replace(/,/g, "")) || 0
                : tariff.rate || 0;
            return {
              tariff_line_id: tariff.id,
              description: tariff.description,
              unit: tariff.unit,
              adjustment_mode: "PERCENTAGE" as TariffAdjustmentMode,
              adjustment_percentage: 0,
              previous_rate: rate,
              new_rate: rate,
            };
          }),
        );
      }
    }
  }, [isOpen, contract, contractTariffs]);

  const toggleAmendmentType = (type: AmendmentType) => {
    setAmendmentTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const updateTariffAdjustment = (
    tariffLineId: string,
    field: string,
    value: any,
  ) => {
    setTariffAdjustments((prev) =>
      prev.map((adj) => {
        if (adj.tariff_line_id === tariffLineId) {
          const updated = { ...adj, [field]: value };
          if (
            field === "adjustment_percentage" &&
            adj.adjustment_mode === "PERCENTAGE"
          ) {
            updated.new_rate = adj.previous_rate * (1 + value / 100);
          }
          return updated;
        }
        return adj;
      }),
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachmentFiles((prev) => [...prev, ...files]);
      setAttachmentNames((prev) => [...prev, ...files.map((f) => f.name)]);
    }
  };

  const removeFile = (index: number) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
    setAttachmentNames((prev) => prev.filter((_, i) => i !== index));
    const input = document.getElementById(
      "amendment-file-input",
    ) as HTMLInputElement;
    if (input) input.value = "";
  };

  const isFormValid = useMemo(() => {
    if (amendmentTypes.length === 0) return false;
    if (!effectiveDate) return false;
    if (amendmentTypes.includes("DATE_EXTENSION") && !newEndDate) return false;
    if (amendmentTypes.includes("VALUE_INCREASE") && newValue <= 0)
      return false;
    if (amendmentTypes.includes("TARIFF_ADJUSTMENT")) {
      if (tariffAdjustments.length === 0) return false;
      const hasInvalidAdjustment = tariffAdjustments.some(
        (adj) =>
          (adj.adjustment_mode === "PERCENTAGE" &&
            adj.adjustment_percentage <= 0) ||
          (adj.adjustment_mode === "MANUAL" && adj.new_rate <= 0),
      );
      if (hasInvalidAdjustment) return false;
    }
    if (attachmentFiles.length === 0) return false;
    return true;
  }, [
    amendmentTypes,
    effectiveDate,
    newEndDate,
    newValue,
    tariffAdjustments,
    attachmentFiles,
  ]);

  const handleSubmit = async () => {
    if (!isFormValid) {
      showToast(
        "error",
        "Validation Error",
        "Please complete all required fields",
      );
      return;
    }

    setIsSaving(true);
    try {
      const uploadedUrls: string[] = [];
      const uploadedNames: string[] = [];

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        showToast("error", "Upload Failed", "Please logout and login again.");
        setIsSaving(false);
        return;
      }

      for (let i = 0; i < attachmentFiles.length; i++) {
        const file = attachmentFiles[i];
        const fileExt = file.name.split(".").pop() || "file";
        const tempId = `temp_${Date.now()}_${i}`;
        const fileName = `${contract.id}/${tempId}/${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("amendments")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

        if (uploadError) {
          showToast(
            "error",
            "Upload Failed",
            `Failed to upload ${file.name}: ${uploadError.message}`,
          );
          setIsSaving(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("amendments")
          .getPublicUrl(uploadData.path);
        uploadedUrls.push(urlData.publicUrl);
        uploadedNames.push(file.name);
      }

      const amendmentData = {
        contract_id: contract.id,
        amendment_no: amendmentNo || undefined,
        amendment_types: amendmentTypes,
        effective_date: effectiveDate,
        previous_end_date: amendmentTypes.includes("DATE_EXTENSION")
          ? contract.end_date
          : undefined,
        new_end_date: amendmentTypes.includes("DATE_EXTENSION")
          ? newEndDate
          : undefined,
        previous_value: amendmentTypes.includes("VALUE_INCREASE")
          ? contract.total_value
          : undefined,
        new_value: amendmentTypes.includes("VALUE_INCREASE")
          ? newValue
          : undefined,
        description,
        attachment_urls: uploadedUrls,
        attachment_names: uploadedNames,
        created_by: user?.id,
        tariff_adjustments: amendmentTypes.includes("TARIFF_ADJUSTMENT")
          ? tariffAdjustments.map((adj: any) => ({
              tariff_line_id: adj.tariff_line_id,
              adjustment_mode: adj.adjustment_mode,
              adjustment_percentage:
                adj.adjustment_mode === "PERCENTAGE"
                  ? adj.adjustment_percentage
                  : undefined,
              previous_rate: adj.previous_rate,
              new_rate: adj.new_rate,
            }))
          : undefined,
      };

      await amendmentAppService.create(amendmentData);
      showToast(
        "success",
        "Amendment Created",
        "Amendment has been created successfully with all files.",
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(
        "error",
        "Save Failed",
        err.message || "Failed to create amendment",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return {
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
  };
}
