// src/features/contract-management/hooks/useContractDetails.ts

import { useState, useMemo, useEffect } from "react";
import type { Contract, TariffLine, ContractAmendment } from "../domain";
import type { Client } from "@/features/client-management/domain/models/Client";
import { useAuth } from "@features/auth/hooks/useAuth";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { ContractElements } from "@shared/authorization/ui/elements/ContractElements";
import {
  calculateProgressFromTariffs,
  calculateInvoiceProgress,
  calculateDaysLeft,
  calculateDaysProgress,
  getDaysUntilStart,
  getContractFinancialStatus,
  getAdjustmentReminder,
  isExpiringSoon,
  jalaaliToGregorianDate,
} from "@entities/contract/services/contractCalculations";
import { amendmentAppService } from "../application";
import { useEvent, EVENT_TYPES } from "@infra/events";

interface ContractDocument {
  id: string;
  name: string;
  url: string;
  type: "contract" | "letter" | "amendment";
  amendment_no?: string;
  uploaded_at?: string;
  size?: string;
}

export function useContractDetails(
  contract: Contract | null,
  contractTariffs: TariffLine[],
  clients: Client[],
) {
  const { user } = useAuth();
  const { canAccessElement } = usePermissionMapping();

  const isUnitManager = user?.role === "unit_manager" || user?.role === "admin";

  // ۱. مدیریت دسترسی‌ها
  const permissions = useMemo(
    () => ({
      canBtnEdit: canAccessElement(
        ContractElements.ContractDetails.btn_edit.id,
      ),
      canBtnAmend: canAccessElement(
        ContractElements.ContractDetails.btn_amend.id,
      ),
      canBtnApprove: canAccessElement(
        ContractElements.ContractDetails.btn_approve.id,
      ),
      canBtnDoc: canAccessElement(ContractElements.ContractDetails.btn_doc.id),
      canInfoSection: canAccessElement(
        ContractElements.ContractDetails.info_section.id,
      ),
      canInfoStartDate: canAccessElement(
        ContractElements.ContractDetails.info_start_date.id,
      ),
      canInfoEndDate: canAccessElement(
        ContractElements.ContractDetails.info_end_date.id,
      ),
      canStatTotalValue: canAccessElement(
        ContractElements.ContractDetails.stat_total_value.id,
      ),
      canStatPerformedWork: canAccessElement(
        ContractElements.ContractDetails.stat_performed_work.id,
      ),
      canStatInvoiced: canAccessElement(
        ContractElements.ContractDetails.stat_invoiced.id,
      ),
      canStatNotInvoiced: canAccessElement(
        ContractElements.ContractDetails.stat_not_invoiced.id,
      ),
      canProgressWork: canAccessElement(
        ContractElements.ContractDetails.progress_work.id,
      ),
      canProgressInvoice: canAccessElement(
        ContractElements.ContractDetails.progress_invoice.id,
      ),
      canProgressTime: canAccessElement(
        ContractElements.ContractDetails.progress_time.id,
      ),
      canReminderSection: canAccessElement(
        ContractElements.ContractDetails.reminder_section.id,
      ),
      canTableTariffs: canAccessElement(
        ContractElements.ContractDetails.table_tariffs.id,
      ),
    }),
    [canAccessElement],
  );

  // ۲. داده‌های مشتق‌شده (Derived Data)
  const clientName = useMemo(() => {
    if (!contract) return "";
    if (contract.client_name) return contract.client_name;
    const client = clients.find((c) => c.id === contract.client_id);
    return client?.name_en || client?.name_fa || "—";
  }, [contract, clients]);

  const selectedTariffs = useMemo(() => {
    if (!contract) return [];
    return contract.tariffLines && contract.tariffLines.length > 0
      ? contract.tariffLines
      : contractTariffs.filter((t) => t.contract_id === contract.id);
  }, [contract, contractTariffs]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const activeTariffs = useMemo(() => {
    return selectedTariffs.filter((t) => {
      const validFrom = jalaaliToGregorianDate(t.valid_from);
      const validTo = jalaaliToGregorianDate(t.valid_to);
      if (validFrom && validFrom > today) return false;
      if (validTo && validTo < today) return false;
      return true;
    });
  }, [selectedTariffs, today]);

  const futureTariffs = useMemo(() => {
    return selectedTariffs.filter((t) => {
      const validFrom = jalaaliToGregorianDate(t.valid_from);
      return !!(validFrom && validFrom > today);
    });
  }, [selectedTariffs, today]);

  const archivedTariffs = useMemo(() => {
    return selectedTariffs.filter((t) => {
      const validTo = jalaaliToGregorianDate(t.valid_to);
      return !!(validTo && validTo < today);
    });
  }, [selectedTariffs, today]);

  const archivedTariffsByVersion = useMemo(() => {
    const grouped = new Map<number, TariffLine[]>();
    archivedTariffs.forEach((tariff) => {
      const version = tariff.version || 1;
      if (!grouped.has(version)) grouped.set(version, []);
      grouped.get(version)!.push(tariff);
    });
    return Array.from(grouped.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([version, tariffs]) => ({ version, tariffs }));
  }, [archivedTariffs]);

  const futureTariffsByVersion = useMemo(() => {
    const grouped = new Map<number, TariffLine[]>();
    futureTariffs.forEach((tariff) => {
      const version = tariff.version || 1;
      if (!grouped.has(version)) grouped.set(version, []);
      grouped.get(version)!.push(tariff);
    });
    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([version, tariffs]) => ({ version, tariffs }));
  }, [futureTariffs]);

  const totalPerformedWork = useMemo(() => {
    if (!contract) return 0;
    return selectedTariffs.reduce((sum, t) => {
      const rate =
        typeof t.rate === "string"
          ? Number(t.rate.replace(/,/g, "")) || 0
          : t.rate || 0;
      const consumed = t.consumed_quantity || 0;
      return sum + rate * consumed;
    }, 0);
  }, [contract, selectedTariffs]);

  const totalInvoiced = useMemo(() => {
    return selectedTariffs.reduce(
      (sum, t) => sum + ((t as any).invoiced || 0),
      0,
    );
  }, [selectedTariffs]);

  const totalNotInvoiced = useMemo(() => {
    return Math.max(0, totalPerformedWork - totalInvoiced);
  }, [totalPerformedWork, totalInvoiced]);

  // ۳. مدیریت اصلاحات (Amendments)
  const [amendments, setAmendments] = useState<ContractAmendment[]>([]);
  const [isLoadingAmendments, setIsLoadingAmendments] = useState(false);

  const loadAmendments = async () => {
    if (!contract) return;
    setIsLoadingAmendments(true);
    try {
      const data = await amendmentAppService.getByContractId(contract.id);
      setAmendments(data);
    } catch (error) {
      console.error("[useContractDetails] Failed to load amendments:", error);
      setAmendments([]);
    } finally {
      setIsLoadingAmendments(false);
    }
  };

  useEvent<{ contractId: string; amendmentId: string }>(
    EVENT_TYPES.AMENDMENT_CREATED,
    (event) => {
      if (event.payload.contractId === contract?.id) loadAmendments();
    },
  );
  useEvent<{ contractId: string; amendmentId: string }>(
    EVENT_TYPES.AMENDMENT_APPROVED,
    (event) => {
      if (event.payload.contractId === contract?.id) loadAmendments();
    },
  );
  useEvent<{ contractId: string; amendmentId: string }>(
    EVENT_TYPES.AMENDMENT_REJECTED,
    (event) => {
      if (event.payload.contractId === contract?.id) loadAmendments();
    },
  );

  useEffect(() => {
    if (contract) loadAmendments();
    else setAmendments([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract?.id]);

  const pendingAmendments = useMemo(() => {
    return amendments.filter((a) => a.approval_status === "PENDING");
  }, [amendments]);

  // ۴. استخراج مدارک
  const documents = useMemo((): ContractDocument[] => {
    if (!contract) return [];
    const docs: ContractDocument[] = [];

    if (contract.source_file) {
      const files = Array.isArray(contract.source_file)
        ? contract.source_file
        : [contract.source_file];
      files.forEach((file: any, index: number) => {
        docs.push({
          id: `doc_contract_${contract.id}_${index}`,
          name:
            typeof file === "string"
              ? file.split("/").pop() || `Contract Document ${index + 1}`
              : `Contract Document ${index + 1}`,
          url: typeof file === "string" ? file : "",
          type: "contract",
          uploaded_at: contract.created_at,
        });
      });
    }
    if (contract.source_letter_image) {
      const files = Array.isArray(contract.source_letter_image)
        ? contract.source_letter_image
        : [contract.source_letter_image];
      files.forEach((file: any, index: number) => {
        docs.push({
          id: `doc_letter_${contract.id}_${index}`,
          name:
            typeof file === "string"
              ? file.split("/").pop() || `Reference Letter ${index + 1}`
              : `Reference Letter ${index + 1}`,
          url: typeof file === "string" ? file : "",
          type: "letter",
          uploaded_at: contract.source_letter_date || contract.created_at,
        });
      });
    }

    const approvedAmendments = amendments.filter(
      (a) => a.approval_status === "APPROVED",
    );
    approvedAmendments.forEach((amendment) => {
      if (amendment.attachment_urls && amendment.attachment_urls.length > 0) {
        amendment.attachment_urls.forEach((url: string, index: number) => {
          docs.push({
            id: `doc_amendment_${amendment.id}_${index}`,
            name:
              amendment.attachment_names?.[index] ||
              `Amendment ${amendment.amendment_no || amendment.id} - File ${index + 1}`,
            url: url,
            type: "amendment",
            amendment_no: amendment.amendment_no,
            uploaded_at: amendment.created_at,
          });
        });
      }
    });
    return docs;
  }, [contract, amendments]);

  // ۵. وضعیت‌های مالی و زمانی
  const financialStatus = contract
    ? getContractFinancialStatus(contract)
    : null;
  const expiringInfo = contract
    ? isExpiringSoon(contract)
    : { expiring: false, daysLeft: 0 };
  const reminder = contract
    ? getAdjustmentReminder(contract)
    : {
        show: false,
        mode: "TBD",
        effectiveDate: "",
        daysUntil: 0,
        percentage: 0,
      };
  const daysUntilStart = contract ? getDaysUntilStart(contract.start_date) : 0;
  const daysLeft = contract ? calculateDaysLeft(contract.end_date) : 0;
  const isExpired = daysLeft < 0;
  const isFullyInvoiced = contract
    ? contract.invoiced >= contract.total_value
    : false;
  const needsFinancialReview =
    (isExpired || totalPerformedWork >= (contract?.total_value || 0)) &&
    !isFullyInvoiced;
  const notStarted = daysUntilStart > 0;
  const daysProgress = contract ? calculateDaysProgress(contract) : null;
  const workProgress = contract ? calculateProgressFromTariffs(contract) : 0;
  const invoiceProgress = contract ? calculateInvoiceProgress(contract) : 0;

  return {
    clientName,
    selectedTariffs,
    activeTariffs,
    futureTariffs,
    archivedTariffs,
    archivedTariffsByVersion,
    futureTariffsByVersion,
    totalPerformedWork,
    totalInvoiced,
    totalNotInvoiced,
    amendments,
    isLoadingAmendments,
    pendingAmendments,
    documents,
    financialStatus,
    expiringInfo,
    reminder,
    daysUntilStart,
    daysLeft,
    isExpired,
    isFullyInvoiced,
    needsFinancialReview,
    notStarted,
    daysProgress,
    workProgress,
    invoiceProgress,
    permissions,
    isUnitManager,
    loadAmendments,
    setAmendments,
  };
}
