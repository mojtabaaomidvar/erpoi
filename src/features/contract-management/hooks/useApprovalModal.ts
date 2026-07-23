// src/features/contract-management/hooks/useApprovalModal.ts

import { useState, useEffect, useMemo } from "react";
import { showToast } from "@shared/ui/ToastContainer";
import { amendmentAppService } from "../application";
import type {
  Contract,
  ContractAmendment,
} from "@/features/contract-management/domain";
import { useAuth } from "@features/auth/hooks/useAuth";

type TabKey = "overview" | "changes" | "documents" | "history";

export function useApprovalModal(
  isOpen: boolean,
  amendment: ContractAmendment,
  contract: Contract,
  onSuccess: () => void,
  onClose: () => void,
) {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAmendment, setCurrentAmendment] =
    useState<ContractAmendment>(amendment);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const loadLatestAmendment = async () => {
    setIsLoading(true);
    try {
      const latest = await amendmentAppService.getById(amendment.id);
      if (latest) {
        setCurrentAmendment(latest);
      }
    } catch (error) {
      console.error(
        "[useApprovalModal] Failed to load latest amendment:",
        error,
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && amendment.id) {
      loadLatestAmendment();
    }
  }, [isOpen, amendment.id]);

  const canTakeAction = currentAmendment.approval_status === "PENDING";
  const isApproved = currentAmendment.approval_status === "APPROVED";
  const isRejected = currentAmendment.approval_status === "REJECTED";

  const handleApprove = async () => {
    if (!canTakeAction) {
      showToast(
        "warning",
        "Already Processed",
        "This amendment has already been processed",
      );
      return;
    }

    setIsProcessing(true);
    try {
      await amendmentAppService.approve(
        currentAmendment.id,
        user?.id || "unknown",
      );
      showToast("success", "Approved", "Amendment approved successfully");

      await loadLatestAmendment();
      onSuccess();
      setTimeout(onClose, 2000);
    } catch (err: any) {
      showToast("error", "Failed", err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!canTakeAction) {
      showToast(
        "warning",
        "Already Processed",
        "This amendment has already been processed",
      );
      return;
    }

    if (!rejectionReason.trim()) {
      showToast(
        "error",
        "Validation Error",
        "Please provide a rejection reason",
      );
      return;
    }

    setIsProcessing(true);
    try {
      await amendmentAppService.reject(
        currentAmendment.id,
        user?.id || "unknown",
        rejectionReason,
      );
      showToast("success", "Rejected", "Amendment rejected");

      await loadLatestAmendment();
      onSuccess();
      setTimeout(onClose, 2000);
    } catch (err: any) {
      showToast("error", "Failed", err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const documents = useMemo(() => {
    const docs: Array<{ id: string; name: string; url: string; type: string }> =
      [];
    if (
      currentAmendment.attachment_urls &&
      currentAmendment.attachment_urls.length > 0
    ) {
      currentAmendment.attachment_urls.forEach((url, index) => {
        docs.push({
          id: `doc_${index}`,
          name:
            currentAmendment.attachment_names?.[index] || `File ${index + 1}`,
          url: url,
          type: url.split(".").pop()?.toLowerCase() || "file",
        });
      });
    }
    return docs;
  }, [currentAmendment]);

  return {
    isLoading,
    isProcessing,
    currentAmendment,
    activeTab,
    rejectionReason,
    showRejectInput,
    canTakeAction,
    isApproved,
    isRejected,
    documents,
    setActiveTab,
    setRejectionReason,
    setShowRejectInput,
    handleApprove,
    handleReject,
  };
}
