//src/features/contract-management/domain/models/TariffLine.ts

export interface TariffLine {
  id: string;
  contract_id?: string;
  description: string;
  unit: string;
  rate: number | string;
  total_quantity?: number;
  consumed_quantity?: number;
  invoiced?: number;
  currency?: string;
  total?: number;
  is_lump_sum?: boolean;
  valid_from?: string;
  valid_to?: string;
  is_archived?: boolean;
  parent_tariff_id?: string;
  version?: number;
  created_at?: string;
  updated_at?: string;
}
