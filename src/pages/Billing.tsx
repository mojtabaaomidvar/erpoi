// src/pages/Billing.tsx

import { Card, CardHeader, Badge, Button, StatusPill } from "@design-system";
import { invoices } from "../data/mockData";
import { formatCurrency, formatDate } from "@shared/lib/formatters";

export function Billing() {
const paid = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + (i.total_amount ?? 0), 0);
const outstanding = invoices.filter((i) => i.status === "ISSUED").reduce((s, i) => s + (i.total_amount ?? 0), 0);
const overdue = invoices.filter((i) => i.status === "OVERDUE").reduce((s, i) => s + (i.total_amount ?? 0), 0);
const draft = invoices.filter((i) => i.status === "DRAFT").reduce((s, i) => s + (i.total_amount ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs text-slate-500">Paid</div>
          <div className="mt-1 text-xl font-semibold text-emerald-600">
            {formatCurrency(paid)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Outstanding</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">
            {formatCurrency(outstanding)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Overdue</div>
          <div className="mt-1 text-xl font-semibold text-rose-600">
            {formatCurrency(overdue)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Drafts</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">
            {formatCurrency(draft)}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Invoices"
          subtitle={`${invoices.length} total`}
          action={<Button size="sm">+ New Invoice</Button>}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Invoice #</th>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Due</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-indigo-600">
                    {inv.invoice_no}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-800">{inv.client_name}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-slate-900">
					{formatCurrency(inv.total_amount ?? 0, inv.currency ?? "USD")}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600">{inv.due_date ? formatDate(inv.due_date) : "-"}</td>
                  <td className="px-5 py-3">
                    <StatusPill
					  status={inv.status.toLowerCase()}
					  label={inv.status}
					/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}




