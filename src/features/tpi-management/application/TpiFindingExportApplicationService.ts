import type { Finding } from "@/features/inspection-management/domain/models/Finding";
import type { InspectionSession } from "@/features/inspection-management/domain/models/InspectionSession";
import type { TPIRequest, InspectionItem } from "../domain/types";
import type { TPIRequestDetailsDTO } from "./TPIRequestApplicationService";
import {
  downloadNcrDocx,
  type NcrDocumentExportData,
} from "@/infrastructure/documents/NcrDocxExporter";

export interface TpiFindingExportContext {
  request: TPIRequest;
  details: TPIRequestDetailsDTO;
  sessions: InspectionSession[];
  equipmentNames: Record<string, string>;
  inspectorName?: string;
}

function findingItem(
  finding: Finding,
  items: InspectionItem[],
): InspectionItem | undefined {
  return items.find(
    (item) =>
      item.id === finding.equipmentId || item.item_name === finding.equipmentId,
  );
}

function fileSafe(value: string): string {
  return value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-").trim();
}

export class TpiFindingExportApplicationService {
  buildDocumentData(
    finding: Finding,
    context: TpiFindingExportContext,
  ): NcrDocumentExportData {
    const item = findingItem(finding, context.details.items);
    const session = context.sessions.find(
      (entry) => entry.id === finding.sessionId,
    );
    const number =
      finding.number ||
      `OBS-${finding.createdAt.slice(0, 10)}-${finding.id.slice(0, 6)}`;
    const tagSerial = [item?.tag_number, item?.serial_number]
      .filter(Boolean)
      .join(" / ");

    return {
      fileName: fileSafe(`${number}-${finding.title || finding.kind}`),
      number,
      revision: finding.revision || "0",
      date: finding.createdAt.slice(0, 10),
      isClosed: finding.status === "CLOSED",
      projectTitle: context.details.projectName,
      clientName: context.details.clientName,
      vendorName: context.details.vendorName || "",
      inspectionDate:
        session?.session_date || context.request.inspection_date || "",
      inspectionLocation: finding.locationFound || "",
      equipmentItem:
        item?.item_name ||
        context.equipmentNames[finding.equipmentId || ""] ||
        finding.equipmentId ||
        "",
      tagSerialNumber: tagSerial,
      inspectionStages: session?.stages || context.request.stages || [],
      classification: finding.classification,
      documentReferences: finding.documentReferences.map((reference) => ({
        number: reference.number,
        title: reference.title,
        revision: reference.revision,
        clauseSection: reference.clauseSection,
      })),
      description: [finding.title, finding.description]
        .filter(Boolean)
        .join("\n"),
      evidence: finding.evidence || finding.checklistText || "",
      immediateContainment: finding.immediateContainment || "",
      correctiveAction: finding.correctiveAction || "",
      targetCompletionDate: finding.targetCompletionDate || "",
      verification: finding.verification || "",
      closeoutDecision: finding.closeoutDecision,
      closeoutNote: finding.closeoutNote || "",
      closeoutDate:
        finding.closeoutDate || finding.closedAt?.slice(0, 10) || "",
      inspectorName: context.inspectorName || "",
      vendorRepresentativeName: "",
      clientRepresentativeName: "",
    };
  }

  async exportFinding(
    finding: Finding,
    context: TpiFindingExportContext,
  ): Promise<void> {
    await downloadNcrDocx(this.buildDocumentData(finding, context));
  }
}

export const tpiFindingExportAppService =
  new TpiFindingExportApplicationService();
