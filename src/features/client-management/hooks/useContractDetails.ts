// src/features/client-management/hooks/useContractDetails.ts

import { useMemo } from "react";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { ClientElements } from "@shared/authorization/ui/elements/ClientElements";
import type {
  Contract,
  TariffLine,
} from "@/features/contract-management/domain";
import {
  calculateProgressFromTariffs,
  calculateDaysLeft,
  calculateDaysProgress,
  getDaysUntilStart,
  getContractFinancialStatus,
  getAdjustmentReminder,
  isExpiringSoon,
  jalaaliToGregorianDate,
} from "@entities/contract/services/contractCalculations";

export function useContractDetails(
  contract: Contract | null,
  contractTariffs: TariffLine[],
) {
  const { canAccessElement } = usePermissionMapping();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const selectedTariffs = useMemo(() => {
    if (!contract) return [];
    if (contract.tariffLines && contract.tariffLines.length > 0)
      return contract.tariffLines;
    return contractTariffs.filter((t) => t.contract_id === contract.id);
  }, [contract, contractTariffs]);

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

  const permissions = useMemo(
    () => ({
      canInfoSection: canAccessElement(
        ClientElements.ClientContractDetailsModal.info_section.id,
      ),
      canInfoStartDate: canAccessElement(
        ClientElements.ClientContractDetailsModal.info_start_date.id,
      ),
      canInfoEndDate: canAccessElement(
        ClientElements.ClientContractDetailsModal.info_end_date.id,
      ),
      canInfoTotalValue: canAccessElement(
        ClientElements.ClientContractDetailsModal.info_total_value.id,
      ),
      canInfoPerformedWork: canAccessElement(
        ClientElements.ClientContractDetailsModal.info_performed_work.id,
      ),
      canInfoInvoiced: canAccessElement(
        ClientElements.ClientContractDetailsModal.info_invoiced.id,
      ),
      canInfoNotInvoiced: canAccessElement(
        ClientElements.ClientContractDetailsModal.info_not_invoiced.id,
      ),
      canProgressWork: canAccessElement(
        ClientElements.ClientContractDetailsModal.progress_work.id,
      ),
      canProgressInvoice: canAccessElement(
        ClientElements.ClientContractDetailsModal.progress_invoice.id,
      ),
      canProgressTime: canAccessElement(
        ClientElements.ClientContractDetailsModal.progress_time.id,
      ),
      canReminderSection: canAccessElement(
        ClientElements.ClientContractDetailsModal.reminder_section.id,
      ),
      canTariffSection: canAccessElement(
        ClientElements.ClientContractDetailsModal.tariffs_section.id,
      ),
      canColPerformed: canAccessElement(
        ClientElements.ClientContractDetailsModal.tariff_col_performed.id,
      ),
      canColTotalValue: canAccessElement(
        ClientElements.ClientContractDetailsModal.tariff_col_total_value.id,
      ),
      canColInvoiced: canAccessElement(
        ClientElements.ClientContractDetailsModal.tariff_col_invoiced.id,
      ),
    }),
    [canAccessElement],
  );

  if (!contract) return null;

  const financialStatus = getContractFinancialStatus(contract);
  const expiringInfo = isExpiringSoon(contract);
  const reminder = getAdjustmentReminder(contract);
  const daysUntilStart = getDaysUntilStart(contract.start_date);
  const daysLeft = calculateDaysLeft(contract.end_date);
  const isExpired = daysLeft < 0;
  const isFullyInvoiced = contract.invoiced >= contract.total_value;
  const needsFinancialReview = isExpired && !isFullyInvoiced;
  const notStarted = daysUntilStart > 0;
  const daysProgress = calculateDaysProgress(contract);

  return {
    activeTariffs,
    futureTariffsByVersion,
    archivedTariffsByVersion,
    totalPerformedWork,
    totalInvoiced,
    permissions,
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
  };
}
