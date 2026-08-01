// src/shared/utils/wordGenerator.ts

import type { NcrReport } from "@/features/inspection-management/repositories/NcrRepository";

export function generateNcrWord(ncr: NcrReport): void {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>NCR Report - ${ncr.ncr_number}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        .header { text-align: center; border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; color: #c00; }
        .ncr-number { font-size: 18px; margin-top: 10px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 14px; font-weight: bold; background: #f0f0f0; padding: 8px; border-left: 4px solid #333; }
        .field { margin: 10px 0; }
        .field-label { font-weight: bold; display: inline-block; width: 150px; }
        .field-value { display: inline-block; }
        .severity { padding: 4px 12px; border-radius: 4px; color: white; font-weight: bold; }
        .severity-MINOR { background: #f59e0b; }
        .severity-MAJOR { background: #ef4444; }
        .severity-CRITICAL { background: #7c2d12; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        td { padding: 8px; border: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">NON-CONFORMANCE REPORT (NCR)</div>
        <div class="ncr-number">NCR Number: ${ncr.ncr_number}</div>
      </div>

      <div class="section">
        <div class="section-title">1. General Information</div>
        <table>
          <tr>
            <td><strong>NCR Number:</strong></td>
            <td>${ncr.ncr_number}</td>
            <td><strong>Date:</strong></td>
            <td>${new Date(ncr.created_at).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td><strong>Equipment ID:</strong></td>
            <td>${ncr.equipment_id}</td>
            <td><strong>Inspection Method:</strong></td>
            <td>${ncr.inspection_method}</td>
          </tr>
          <tr>
            <td><strong>Severity:</strong></td>
            <td colspan="3"><span class="severity severity-${ncr.severity}">${ncr.severity}</span></td>
          </tr>
          <tr>
            <td><strong>Category:</strong></td>
            <td colspan="3">${ncr.category}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">2. Non-Conformance Description</div>
        <div class="field">
          <span class="field-label">Title:</span>
          <span class="field-value">${ncr.title}</span>
        </div>
        <div class="field">
          <span class="field-label">Checklist Item:</span>
          <span class="field-value">${ncr.checklist_text}</span>
        </div>
        <div class="field">
          <span class="field-label">Description:</span>
          <span class="field-value">${ncr.description}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">3. Corrective Action</div>
        <div class="field">
          <span class="field-label">Action Required:</span>
          <span class="field-value">${ncr.corrective_action || "To be determined"}</span>
        </div>
        <div class="field">
          <span class="field-label">Responsible Person:</span>
          <span class="field-value">${ncr.responsible_person || "To be assigned"}</span>
        </div>
        <div class="field">
          <span class="field-label">Due Date:</span>
          <span class="field-value">${ncr.due_date || "To be scheduled"}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">4. Status</div>
        <div class="field">
          <span class="field-label">Current Status:</span>
          <span class="field-value"><strong>${ncr.status}</strong></span>
        </div>
        ${
          ncr.closed_by
            ? `
        <div class="field">
          <span class="field-label">Closed By:</span>
          <span class="field-value">${ncr.closed_by}</span>
        </div>
        <div class="field">
          <span class="field-label">Closed At:</span>
          <span class="field-value">${new Date(ncr.closed_at!).toLocaleDateString()}</span>
        </div>
        `
            : ""
        }
      </div>

      <div style="margin-top: 60px; display: flex; justify-content: space-between;">
        <div>
          <div>_________________________</div>
          <div>Prepared By</div>
        </div>
        <div>
          <div>_________________________</div>
          <div>Reviewed By</div>
        </div>
        <div>
          <div>_________________________</div>
          <div>Approved By</div>
        </div>
      </div>
    </body>
    </html>
  `;

  // دانلود به صورت Word
  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${ncr.ncr_number}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
