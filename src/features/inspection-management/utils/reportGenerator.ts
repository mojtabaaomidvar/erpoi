// src/features/inspection-management/utils/reportGenerator.ts

import type { Inspection, NonConformity, Checklist } from "@/types/inspection";

export interface ReportData {
  inspection: Inspection;
  checklists: Checklist[];
  ncrs: NonConformity[];
  clientName: string;
  contractNumber: string;
  inspectorName: string;
}

export function generateReportHTML(data: ReportData): string {
  const {
    inspection,
    checklists,
    ncrs,
    clientName,
    contractNumber,
    inspectorName,
  } = data;

  return `
<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
  <meta charset="UTF-8">
  <title>Inspection Report - ${inspection.id}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    .header { border-bottom: 3px solid #4F46E5; padding-bottom: 20px; margin-bottom: 30px; }
    .title { font-size: 28px; font-weight: bold; color: #1F2937; margin-bottom: 10px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: bold; color: #4F46E5; border-bottom: 2px solid #E5E7EB; padding-bottom: 5px; margin-bottom: 15px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .info-item { padding: 10px; background: #F9FAFB; border-radius: 5px; }
    .info-label { font-size: 12px; color: #6B7280; font-weight: 600; }
    .info-value { font-size: 14px; color: #1F2937; margin-top: 3px; }
    .checklist-item { padding: 10px; border-left: 3px solid #10B981; background: #F0FDF4; margin-bottom: 10px; }
    .ncr-item { padding: 10px; border-left: 3px solid #EF4444; background: #FEF2F2; margin-bottom: 10px; }
    .status-pass { color: #10B981; font-weight: bold; }
    .status-fail { color: #EF4444; font-weight: bold; }
    .footer { margin-top: 50px; border-top: 2px solid #E5E7EB; padding-top: 20px; text-align: center; color: #6B7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">Inspection Report</div>
    <div>Report ID: ${inspection.id}</div>
    <div>Generated: ${new Date().toLocaleDateString()}</div>
  </div>

  <div class="section">
    <div class="section-title">General Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Client</div>
        <div class="info-value">${clientName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Contract Number</div>
        <div class="info-value">${contractNumber}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Inspector</div>
        <div class="info-value">${inspectorName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Location</div>
        <div class="info-value">${inspection.location || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Execution Date</div>
        <div class="info-value">${inspection.execution_date ? new Date(inspection.execution_date).toLocaleDateString() : "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Status</div>
        <div class="info-value">${inspection.status}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Checklists Summary</div>
    ${checklists
      .map(
        (checklist) => `
      <div class="checklist-item">
        <strong>${checklist.checklist_name}</strong> (${checklist.category})<br/>
        Status: <span class="${checklist.overall_status === "COMPLETED" ? "status-pass" : "status-fail"}">${checklist.overall_status}</span>
      </div>
    `,
      )
      .join("")}
  </div>

  ${
    ncrs.length > 0
      ? `
  <div class="section">
    <div class="section-title">Non-Conformities (${ncrs.length})</div>
    ${ncrs
      .map(
        (ncr) => `
      <div class="ncr-item">
        <strong>${ncr.ncr_number}</strong> - ${ncr.severity}<br/>
        ${ncr.description}<br/>
        Status: ${ncr.status}
      </div>
    `,
      )
      .join("")}
  </div>
  `
      : ""
  }

  ${
    inspection.general_remarks
      ? `
  <div class="section">
    <div class="section-title">General Remarks</div>
    <p>${inspection.general_remarks}</p>
  </div>
  `
      : ""
  }

  <div class="footer">
    <p>This report was generated electronically by ICS Inspection Management System</p>
    <p>© ${new Date().getFullYear()} ICS - All Rights Reserved</p>
  </div>
</body>
</html>
  `;
}

export async function downloadReportAsPDF(
  htmlContent: string,
  filename: string,
): Promise<void> {
  // اینجا می‌توانید از کتابخانه‌هایی مثل jsPDF یا html2pdf استفاده کنید
  // برای الان یک روش ساده ارائه می‌دهم

  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
