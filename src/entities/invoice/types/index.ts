
export type InvoiceStatus =
  |"DRAFT"|"ISSUED"|"PENDING"|"PAID"|"OVERDUE"|"CANCELLED";

export interface Invoice {
  id: string;
  invoice_no: string;
  status: InvoiceStatus;
}
