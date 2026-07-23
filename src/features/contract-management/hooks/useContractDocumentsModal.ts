// src/features/contract-management/hooks/useContractDocumentsModal.ts

import { useMemo, useState } from "react";
import type {
  Contract,
  ContractAmendment,
} from "@/features/contract-management/domain";

export interface ContractDocument {
  id: string;
  name: string;
  url: string;
  type: "contract" | "letter" | "amendment";
  amendment_no?: string;
  uploaded_at?: string;
}

type TabKey = "documents" | "ammendments" | "history";

export function useContractDocumentsModal(
  contract: Contract,
  amendments: ContractAmendment[],
) {
  const [activeTab, setActiveTab] = useState<TabKey>("documents");
  const [expandedAmendment, setExpandedAmendment] = useState<string | null>(
    null,
  );

  const approvedAmendments = useMemo(() => {
    return amendments.filter((a) => a.approval_status === "APPROVED");
  }, [amendments]);

  const allAmendments = useMemo(() => {
    return [...amendments].sort((a, b) => {
      const statusOrder: Record<string, number> = {
        APPROVED: 1,
        PENDING: 2,
        REJECTED: 3,
      };
      const statusDiff =
        (statusOrder[a.approval_status] || 99) -
        (statusOrder[b.approval_status] || 99);
      if (statusDiff !== 0) return statusDiff;

      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [amendments]);

  const documents = useMemo((): ContractDocument[] => {
    const docs: ContractDocument[] = [];

    if (contract.source_file) {
      const files = Array.isArray(contract.source_file)
        ? contract.source_file
        : [contract.source_file];
      files.forEach((file, index) => {
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
      files.forEach((file, index) => {
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

    approvedAmendments.forEach((amendment) => {
      if (amendment.attachment_urls && amendment.attachment_urls.length > 0) {
        amendment.attachment_urls.forEach((url, index) => {
          docs.push({
            id: `doc_amendment_${amendment.id}_${index}`,
            name:
              amendment.attachment_names?.[index] ||
              `Amendment ${amendment.amendment_no || amendment.id}`,
            url: url,
            type: "amendment",
            amendment_no: amendment.amendment_no,
            uploaded_at: amendment.created_at,
          });
        });
      }
    });

    return docs;
  }, [contract, approvedAmendments]);

  const toggleExpanded = (id: string) => {
    setExpandedAmendment(expandedAmendment === id ? null : id);
  };

  return {
    activeTab,
    setActiveTab,
    expandedAmendment,
    toggleExpanded,
    approvedAmendments,
    allAmendments,
    documents,
  };
}
