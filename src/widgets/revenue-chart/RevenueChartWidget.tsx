// src/widgets/revenue-chart/RevenueChartWidget.tsx

import { useMemo } from "react";
import { Card } from "@shared/ui/Card";
import { Spinner } from "@shared/ui/Spinner";
import { EmptyState } from "@shared/ui/EmptyState";
import { useContracts } from "@features/contract-management/hooks/useContracts";
import { formatCurrency } from "@shared/lib/formatters";
import { cn } from "@shared/lib/cn";

/**
 * Revenue Chart Widget
 *
 * LIMITATION REPORT:
 * No invoice history or time-series revenue data is currently exposed via application services.
 * The existing `invoiceService` bypasses architecture (direct Supabase) and has no hook.
 * Contract.invoiced represents cumulative total, not monthly revenue.
 *
 * This widget displays AVAILABLE contract value distribution as a placeholder.
 * A proper revenue-over-time chart requires implementing:
 * - InvoiceAppService with time-series query
 * - useInvoices hook
 * - Monthly aggregation in application layer
 */
export function RevenueChartWidget() {
  const { contracts, loading, error } = useContracts();

  const chartData = useMemo(() => {
    if (!contracts.length) return null;

    // Aggregate available contract values by status as proxy for revenue pipeline
    const active = contracts.filter((c) => c.status === "ACTIVE");
    const completed = contracts.filter((c) => c.status === "COMPLETED");

    const activeValue = active.reduce(
      (sum, c) => sum + (c.total_value || 0),
      0,
    );
    const completedValue = completed.reduce(
      (sum, c) => sum + (c.total_value || 0),
      0,
    );
    const pendingValue = contracts
      .filter((c) =>
        ["PENDING", "NOT_STARTED", "NEEDS_REVIEW"].includes(c.status),
      )
      .reduce((sum, c) => sum + (c.total_value || 0), 0);

    return [
      { label: "Active", value: activeValue, color: "var(--color-success)" },
      {
        label: "Completed",
        value: completedValue,
        color: "var(--color-accent)",
      },
      { label: "Pipeline", value: pendingValue, color: "var(--color-warning)" },
    ].filter((d) => d.value > 0);
  }, [contracts]);

  if (loading) {
    return (
      <Card className="animate-fadeIn flex items-center justify-center min-h-[300px]">
        <Spinner size="md" label="Loading revenue data..." />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="animate-fadeIn">
        <div className="text-sm text-[var(--color-danger)]">
          Failed to load revenue data
        </div>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="animate-fadeIn">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
          Revenue Overview
        </h3>
        <EmptyState
          title="No Revenue Data"
          description="No contract data available for revenue analysis."
        />
        <p className="text-xs text-[var(--color-text-muted)] mt-4 text-center">
          Note: Time-series revenue tracking requires invoice history
          integration.
        </p>
      </Card>
    );
  }

  const maxValue = Math.max(...chartData.map((d) => d.value));

  return (
    <Card className="animate-fadeIn">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Contract Value Distribution
        </h3>
        <p className="text-xs text-[var(--color-text-muted)]">
          By contract status (cumulative values)
        </p>
      </div>

      {/* Simple CSS bar chart using theme tokens */}
      <div className="space-y-3">
        {chartData.map((item) => (
          <div key={item.label} className="group">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-[var(--color-text-primary)]">
                {item.label}
              </span>
              <span className="text-[var(--color-text-secondary)]">
                {formatCurrency(item.value)}
              </span>
            </div>
            <div className="h-6 w-full rounded-md bg-[var(--color-muted)] overflow-hidden">
              <div
                className="h-full rounded-md transition-all duration-500 ease-out"
                style={{
                  width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
        <div className="flex justify-between text-xs">
          <span className="text-[var(--color-text-muted)]">
            Total Contracts
          </span>
          <span className="font-semibold text-[var(--color-text-primary)]">
            {contracts.length}
          </span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-[var(--color-text-muted)]">Total Value</span>
          <span className="font-semibold text-[var(--color-text-primary)]">
            {formatCurrency(chartData.reduce((sum, d) => sum + d.value, 0))}
          </span>
        </div>
      </div>
    </Card>
  );
}
