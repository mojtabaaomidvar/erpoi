// src/components/TariffEditor.tsx
import { useState, useMemo } from 'react';
import { Button, Badge } from '../design-system';
import { useTheme } from '../contexts/ThemeContext';
import { formatNumberInput, parseNumberInput } from '../lib/contractCalculations';

// 🔑 Types
export interface TariffLine {
  id: string;
  contract_id?: string;
  description: string;
  unit: string;
  rate: string | number;
  currency?: string;
  total?: number;
  isLumpSum?: boolean;
  total_quantity?: number;
  consumed_quantity?: number;
  invoiced?: number;
}

export interface TariffEditorProps {
  tariffs: TariffLine[];
  onChange: (tariffs: TariffLine[]) => void;
  error?: string;
  showTotals?: boolean;
}

const CURRENCIES = ['IRR', 'USD', 'EUR'];
const UNITS = ['MAN_DAY', 'DOCUMENT', 'VESSEL', 'LUMP_SUM'];

export function TariffEditor({ tariffs, onChange, error, showTotals = true }: TariffEditorProps) {
  const { isDark } = useTheme();

  const addTariff = () => {
    const newTariff: TariffLine = {
      id: `t${Date.now()}`,
      description: '',
      unit: 'MAN_DAY',
      rate: '',
      currency: 'IRR',
      total: 0,
      isLumpSum: false,
    };
    onChange([...tariffs, newTariff]);
  };

  const removeTariff = (id: string) => {
    if (tariffs.length <= 1) return;
    onChange(tariffs.filter((t) => t.id !== id));
  };

  const updateTariff = (id: string, field: keyof TariffLine, value: any) => {
    const updated = tariffs.map((t) => {
      if (t.id !== id) return t;
      const newTariff = { ...t, [field]: value };
      if (field === 'rate') {
        newTariff.total = parseNumberInput(newTariff.rate as string);
      }
      if (field === 'isLumpSum' && value === true) {
        newTariff.unit = 'LUMP_SUM';
      }
      return newTariff;
    });
    onChange(updated);
  };

  const totalsByCurrency = useMemo(() => {
    const totals: Record<string, number> = {};
    tariffs.forEach((t) => {
      const curr = t.currency || 'IRR';
      if (!totals[curr]) totals[curr] = 0;
      totals[curr] += t.total || parseNumberInput(t.rate as string);
    });
    return totals;
  }, [tariffs]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-primary">Tariff Lines</h3>
          <Badge tone="indigo">{tariffs.length}</Badge>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTariff}
          className="gap-1.5 text-xs"
        >
          ➕ Add Tariff
        </Button>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs font-medium text-rose-700">
          ✕ {error}
        </div>
      )}

      <div className="space-y-2">
        {tariffs.map((tariff, index) => (
          <div
            key={tariff.id}
            className={`rounded-lg border p-3 ${
              tariff.isLumpSum
                ? (isDark ? 'border-indigo-700 bg-indigo-900/20' : 'border-indigo-200 bg-indigo-50/30')
                : (isDark ? 'border-slate-700 bg-muted/50' : 'border-slate-200 bg-muted/50')
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-secondary">#{index + 1}</span>
              {tariff.isLumpSum && <Badge tone="indigo">Lump Sum</Badge>}
              <div className="flex-1" />
              {tariffs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTariff(tariff.id)}
                  className="p-1 text-rose-600 hover:bg-rose-100 rounded transition-colors"
                  title="Remove"
                >
                  🗑️
                </button>
              )}
            </div>

            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-6">
                <input
                  type="text"
                  value={tariff.description}
                  onChange={(e) => updateTariff(tariff.id, 'description', e.target.value)}
                  placeholder="Description..."
                  className="w-full rounded border px-2 py-1.5 text-xs input-themed"
                />
              </div>

              <div className="col-span-2">
                <select
                  value={tariff.unit}
                  onChange={(e) => updateTariff(tariff.id, 'unit', e.target.value)}
                  className="w-full rounded border px-2 py-1.5 text-xs input-themed"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u === 'MAN_DAY' ? 'Man Day' : u === 'DOCUMENT' ? 'Document' : u === 'VESSEL' ? 'Vessel' : 'Lump Sum'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-3">
                <input
                  type="text"
                  inputMode="numeric"
                  value={tariff.rate}
                  onChange={(e) => updateTariff(tariff.id, 'rate', formatNumberInput(e.target.value))}
                  className="w-full rounded border px-2 py-1.5 text-xs font-mono text-right input-themed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="Rate"
                />
              </div>

              <div className="col-span-1">
                <select
                  value={tariff.currency}
                  onChange={(e) => updateTariff(tariff.id, 'currency', e.target.value)}
                  className="w-full rounded border px-1 py-1.5 text-[10px] font-semibold input-themed"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showTotals && Object.keys(totalsByCurrency).length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-xs font-semibold text-primary mb-2">Totals by Currency:</div>
          {Object.entries(totalsByCurrency).map(([currency, total]) => (
            <div
              key={currency}
              className={`flex items-center justify-between rounded-lg border p-3 ${
                isDark ? 'border-slate-700 bg-muted' : 'border-slate-200 bg-muted'
              }`}
            >
              <div className="flex items-center gap-2">
                <Badge tone="indigo">{currency}</Badge>
                <span className="text-sm font-semibold text-primary">Total:</span>
              </div>
              <span className="text-lg font-bold text-accent-emerald">
                {total.toLocaleString('en-US')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}