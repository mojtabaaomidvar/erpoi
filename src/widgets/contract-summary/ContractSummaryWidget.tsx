// src/widgets/contract-summary/ContractSummaryWidget.tsx

import { useMemo } from "react";
import { Card } from "@shared/ui/Card";
import { Badge } from "@shared/ui/Badge";
import { Spinner } from "@shared/ui/Spinner";
import { EmptyState } from "@shared/ui/EmptyState";
import { useContracts } from "@features/contract-management/hooks/useContracts";
import {
  calculateDaysLeft,
  isExpiringSoon,
} from "@entities/contract/services/contractCalculations";
import { formatCurrency } from "@shared/lib/formatters";
import { cn } from "@shared/lib/cn";
import { FileText } from "lucide-react";

export function ContractSummaryWidget() {
  const { contracts, filterCounts, loading, error } = useContracts();

  const summary = useMemo(() => {
    if (!contracts.length) return null;

    const expiringContracts = contracts.filter((c) => {
      const result = isExpiringSoon(c);
      return result.expiring;
    });

    const needsReviewCount = filterCounts.NEEDS_REVIEW ?? 0;
    const activeCount = filterCounts.ACTIVE ?? 0;
    const totalValue = contracts.reduce(
      (sum, c) => sum + (c.total_value || 0),
      0,
    );
    const totalInvoiced = contracts.reduce(
      (sum, c) => sum + (c.invoiced || 0),
      0,
    );

    return {
      active: activeCount,
      needsReview: needsReviewCount,
      expiring: expiringContracts.length,
      expiringList: expiringContracts.slice(0, 5),
      totalValue,
      totalInvoiced,
    };
  }, [contracts, filterCounts]);

  if (loading) {
    return (
      <Card className="animate-fadeIn">
        <div className="flex items-center justify-center py-12">
          <Spinner label="Loading contracts…" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="animate-fadeIn">
        <div className="text-center py-8 text-[var(--color-danger)] text-sm">
          Failed to load contract data
        </div>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="animate-fadeIn">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
          Contract Summary
        </h3>
        <EmptyState
          icon={FileText}
          title="No Contracts"
          description="No contract records found."
        />
      </Card>
    );
  }

  return (
    <Card className="animate-fadeIn">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
        Contract Summary
      </h3>

      {/* Mini KPI row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-center">
          <div className="text-xs text-[var(--color-text-muted)]">Active</div>
          <div className="text-lg font-bold text-[var(--color-text-primary)]">
            {summary.active}
          </div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-center">
          <div className="text-xs text-[var(--color-text-muted)]">
            Needs Review
          </div>
          <div
            className={cn(
              "text-lg font-bold",
              summary.needsReview > 0
                ? "text-[var(--color-warning,#d97706)]"
                : "text-[var(--color-text-primary)]",
            )}
          >
            {summary.needsReview}
          </div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-center">
          <div className="text-xs text-[var(--color-text-muted)]">
            Expiring Soon
          </div>
          <div
            className={cn(
              "text-lg font-bold",
              summary.expiring > 0
                ? "text-[var(--color-danger,#e11d48)]"
                : "text-[var(--color-text-primary)]",
            )}
          >
            {summary.expiring}
          </div>
        </div>
      </div>

      {/* Expiring contracts list */}
      {summary.expiringList.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">
            Contracts Requiring Attention
          </p>
          <ul className="space-y-2">
            {summary.expiringList.map((c) => {
              const daysLeft = calculateDaysLeft(c.end_date);
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-[var(--color-text-primary)]">
                      {c.contract_no}
                    </span>
                    <span className="block truncate text-xs text-[var(--color-text-muted)]">
                      {c.client_name || c.contract_title}
                    </span>
                  </div>
                  <Badge
                    tone={daysLeft < 0 ? "danger" : "warning"}
                    className="ml-2 flex-shrink-0"
                  >
                    {daysLeft < 0
                      ? `${Math.abs(daysLeft)}d overdue`
                      : `${daysLeft}d left`}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Financial summary */}
      <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
        <div className="flex justify-between text-xs">
          <span className="text-[var(--color-text-muted)]">Total Value</span>
          <span className="font-medium text-[var(--color-text-primary)]">
            {formatCurrency(summary.totalValue)}
          </span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-[var(--color-text-muted)]">Total Invoiced</span>
          <span className="font-medium text-[var(--color-text-primary)]">
            {formatCurrency(summary.totalInvoiced)}
          </span>
        </div>
      </div>
    </Card>
  );
}
