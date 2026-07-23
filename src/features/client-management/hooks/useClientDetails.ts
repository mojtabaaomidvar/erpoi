// src/features/client-management/hooks/useClientDetails.ts

import { useMemo } from "react";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { ClientElements } from "@shared/authorization/ui/elements/ClientElements";
import type {
  Contract,
  TariffLine,
} from "@/features/contract-management/domain";
import type { Client } from "@/features/client-management/domain/models/Client";
import {
  calculateProgressFromTariffs,
  calculateInvoiceProgress,
} from "@entities/contract/services/contractCalculations"; // ⚠️ در آینده باید به لایه App منتقل شود

export function useClientDetails(
  client: Client | null,
  clientContracts: Contract[],
  contractTariffs: TariffLine[],
  currentDepartment: string,
  onContractClick?: (contract: Contract) => void,
) {
  const { canAccessElement } = usePermissionMapping();

  // ۱. محاسبات داده‌ای (Data Transformation)
  const filteredContactPersons = useMemo(() => {
    if (!client || !client.contactPersons) return [];
    return client.contactPersons.filter(
      (cp: any) => cp.department === currentDepartment,
    );
  }, [client, currentDepartment]);

  const uniqueEmails = useMemo(() => {
    if (!client) return [];
    const allEmails = [
      ...(client.email ? [client.email] : []),
      ...((client as any).emails || []),
    ];
    return [...new Set(allEmails)].filter(Boolean);
  }, [client]);

  const stats = useMemo(() => {
    if (!client) return null;

    const totalValue = clientContracts.reduce(
      (sum, c) => sum + c.total_value,
      0,
    );

    const contractIds = clientContracts.map((c) => c.id);
    const relevantTariffs = contractTariffs.filter((t) =>
      contractIds.includes(t.contract_id || ""),
    );

    const totalInvoiced = relevantTariffs.reduce(
      (sum, t) => sum + (t.invoiced || 0),
      0,
    );

    const performedWork = relevantTariffs.reduce((sum, t) => {
      const rate =
        typeof t.rate === "string"
          ? Number(t.rate.replace(/,/g, "")) || 0
          : t.rate || 0;
      const consumed = t.consumed_quantity || 0;
      return sum + rate * consumed;
    }, 0);

    const totalUninvoicedWork = Math.max(0, performedWork - totalInvoiced);

    return { totalValue, totalInvoiced, totalUninvoicedWork };
  }, [client, clientContracts, contractTariffs]);

  // ۲. مدیریت دسترسی‌ها (Permissions Aggregation)
  const permissions = useMemo(
    () => ({
      canEditBtn: canAccessElement(ClientElements.ClientDetails.btn_edit.id),
      canEmails: canAccessElement(
        ClientElements.ClientDetails.emails_dropdown.id,
      ),
      canContacts: canAccessElement(
        ClientElements.ClientDetails.contacts_dropdown.id,
      ),
      canStatAgreements: canAccessElement(
        ClientElements.ClientDetails.stat_agreements.id,
      ),
      canStatValue: canAccessElement(
        ClientElements.ClientDetails.stat_value_agreements.id,
      ),
      canStatInvoiced: canAccessElement(
        ClientElements.ClientDetails.stat_invoiced.id,
      ),
      canStatUninvoiced: canAccessElement(
        ClientElements.ClientDetails.stat_uninvoiced.id,
      ),
      canAgreements: canAccessElement(
        ClientElements.ClientDetails.agreements_section.id,
      ),
      canClickContractItem: canAccessElement(
        ClientElements.ClientList.list_item_click.id,
      ),
      canAgreementValue: canAccessElement(
        ClientElements.ClientDetails.agreement_value.id,
      ),
      canAgreementProgressWork: canAccessElement(
        ClientElements.ClientDetails.agreement_progress_work.id,
      ),
      canAgreementProgressInvoice: canAccessElement(
        ClientElements.ClientDetails.agreement_progress_invoice.id,
      ),
      canContractDates: canAccessElement(
        ClientElements.ClientDetails.contract_dates.id,
      ),
    }),
    [canAccessElement],
  );

  // ۳. هندلرهای ترکیبی (Composite Handlers)
  const handleContractClick = (contract: Contract) => {
    if (!permissions.canClickContractItem) return;
    onContractClick?.(contract);
  };

  return {
    filteredContactPersons,
    uniqueEmails,
    stats,
    permissions,
    handleContractClick,
  };
}
