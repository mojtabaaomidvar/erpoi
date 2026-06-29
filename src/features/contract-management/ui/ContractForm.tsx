// src/views/contracts/components/ContractForm.tsx
import { useState } from 'react';
import { Button, Modal } from '@design-system';
import { useTheme } from '@app/providers/ThemeProvider';
import { JalaaliDatePicker } from '@shared/ui/JalaaliDatePicker';
import { ClientSelectorModal } from '@entities/client/ui/ClientSelectorModal';
import { ContractAttachmentsEditor } from '@entities/contract/ui/ContractAttachmentsEditor';
import { TariffEditor } from '@entities/contract/ui/TariffEditor';
import type { Contract, TariffLine, Adjustment, ContractModification, Guarantee, ContractAttachment } from '@entities/contract/types';
import { clients as initialClients } from '@data/mockData';
import { formatCurrency } from '@shared/lib/formatters';
import {
  formatNumberInput,
  parseNumberInput,
  getNextJalaaliYearStart,
} from '@entities/contract/services/contractCalculations';
import * as jalaali from 'jalaali-js';

interface ContractFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: any) => void;
  initialData?: Partial<Contract>;
  mode: 'add' | 'edit';
  typeFilter: 'ALL' | 'CONTRACT' | 'WORK_ORDER';
  contracts: Contract[];
  generateContractNo: (type: 'CONTRACT' | 'WORK_ORDER', contracts: Contract[]) => string;
  onNavigateToClients: () => void;
}

export function ContractForm({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode,
  typeFilter,
  contracts,
  generateContractNo,
  onNavigateToClients,
}: ContractFormProps) {
  const { isDark } = useTheme();

  const [formData, setFormData] = useState({
    contract_no: initialData?.contract_no || generateContractNo(
      typeFilter === 'WORK_ORDER' ? 'WORK_ORDER' : 'CONTRACT',
      contracts
    ),
    external_contract_no: initialData?.external_contract_no || '',
    source_type: (initialData?.source_type || 'LETTER') as 'EMAIL' | 'LETTER',
    source_ref: initialData?.source_ref || '',
    source_file: initialData?.source_file || '',
    source_file_object: null as File | null,
    source_letter_date: initialData?.source_letter_date || '',
    source_letter_image: initialData?.source_letter_image || '',
    source_letter_image_object: null as File | null,
    source_letter_image_preview: initialData?.source_letter_image_preview || '',
    source_email_from: initialData?.source_email_from || '',
    source_email_date: initialData?.source_email_date || new Date().toISOString().split('T')[0],
    client_id: initialData?.client_id || '',
    contract_title: initialData?.contract_title || '',
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
    total_value: initialData?.total_value || 0,
    currency: initialData?.currency || 'IRR',
    status: (initialData?.status || 'ACTIVE') as 'ACTIVE' | 'COMPLETED',
    type: (typeFilter === 'WORK_ORDER' ? 'WORK_ORDER' : (initialData?.type || 'CONTRACT')) as 'CONTRACT' | 'WORK_ORDER',
    contract_count: initialData?.contract_count || 1,
    description: initialData?.description || '',
    tariffs: initialData?.tariffLines || [
      {
        id: '1',
        description: '',
        unit: 'MAN_DAY',
        rate: '',
        currency: 'IRR',
        total: 0,
        isLumpSum: false,
      },
    ] as TariffLine[],
    adjustment: {
      enabled: false,
      mode: 'FIXED' as 'FIXED' | 'TBD',
      percentage: 0,
      effective_date: '',
    } as Adjustment,
    contract_modification: {
      percentage: 0,
    } as ContractModification,
    guarantee: {
      has_guarantee: false,
      percentage: 0,
      type: 'BANK_GUARANTEE' as 'CHECK' | 'BANK_GUARANTEE' | 'PROMISSORY_NOTE' | 'CASH_BLOCK',
    } as Guarantee,
    good_performance_percentage: 10,
    insurance_deduction_percentage: 16.67,
    attachments: [] as ContractAttachment[],
    service_description: '' as 'TPI' | 'MWS' | 'TPER' | 'OTHER' | '',
  });

  const [errors, setErrors] = useState<any>({});

  const handleTypeChange = (type: 'CONTRACT' | 'WORK_ORDER') => {
    if (typeFilter !== 'ALL') return;
    setFormData({ ...formData, type });
  };

  const handleSmartStartDateChange = (newStartDate: string) => {
    const updatedForm = { ...formData, start_date: newStartDate };
    if (newStartDate && formData.end_date && formData.end_date < newStartDate) {
      updatedForm.end_date = newStartDate;
    }
    setFormData(updatedForm);
  };

  const handleSmartEndDateChange = (newEndDate: string) => {
    setFormData({ ...formData, end_date: newEndDate });
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (formData.type === 'WORK_ORDER') {
      if (formData.source_type === 'LETTER') {
        if (!formData.source_ref.trim()) newErrors.source_ref = 'Letter number is required';
        if (!formData.source_letter_date) newErrors.source_letter_date = 'Letter date is required';
        if (!formData.source_letter_image) newErrors.source_letter_image = 'Letter image is required';
      } else if (formData.source_type === 'EMAIL') {
        if (!formData.source_email_from.trim()) newErrors.source_email_from = 'Email address is required';
      }
      if (!formData.client_id) newErrors.client_id = 'Client selection is required';
      if (!formData.contract_title.trim()) newErrors.contract_title = 'Work order title is required';
      if (!formData.tariffs || formData.tariffs.length === 0) {
        newErrors.tariffs = 'At least one tariff line is required';
      } else {
        const emptyTariff = formData.tariffs.find((t) => !t.description.trim() || !t.rate || parseNumberInput(t.rate as string) <= 0);
        if (emptyTariff) newErrors.tariffs = 'All tariff lines must have description and rate';
      }
    } else {
      if (!formData.contract_title.trim()) newErrors.contract_title = 'Contract title is required';
      if (!formData.client_id) newErrors.client_id = 'Client selection is required';
      if (!formData.start_date) newErrors.start_date = 'Start date is required';
      if (!formData.end_date) newErrors.end_date = 'End date is required';
      if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
        newErrors.end_date = 'End date cannot be before start date';
      }
      if (formData.total_value <= 0) newErrors.total_value = 'Amount must be greater than zero';
      if (!formData.contract_count || formData.contract_count <= 0) newErrors.contract_count = 'Contract count is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    onSave(formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'add' ? 'Add New Agreement' : 'Edit Contract'} size="lg">
      <div className="space-y-3">
        {/* Type Selector */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-primary">
            Type *
            {typeFilter !== 'ALL' && (
              <span className={`ml-2 text-[10px] font-normal ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                🔒 Locked to {typeFilter === 'CONTRACT' ? 'Contract' : 'Work Order'}
              </span>
            )}
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange('CONTRACT')}
              disabled={typeFilter !== 'ALL'}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                formData.type === 'CONTRACT'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : (isDark ? 'bg-muted text-secondary hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
              } ${typeFilter !== 'ALL' && formData.type !== 'CONTRACT' ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              📄 Contract
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('WORK_ORDER')}
              disabled={typeFilter !== 'ALL'}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                formData.type === 'WORK_ORDER'
                  ? 'bg-amber-600 text-white shadow-md'
                  : (isDark ? 'bg-muted text-secondary hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
              } ${typeFilter !== 'ALL' && formData.type !== 'WORK_ORDER' ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              📦 Work Order
            </button>
          </div>
        </div>

        {formData.type === 'CONTRACT' ? (
          <>
            {/* Contract Form Fields */}
            <div className={`rounded-lg border p-4 ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50/50'} space-y-1`}>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <ClientSelectorModal
                    value={formData.client_id}
                    onChange={(clientId) => setFormData({ ...formData, client_id: clientId })}
                    onAddNew={onNavigateToClients}
                    error={errors.client_id}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary">Contract Title *</label>
                  <input
                    value={formData.contract_title}
                    onChange={(e) => setFormData({ ...formData, contract_title: e.target.value })}
                    className={`w-full rounded-lg px-3 py-2 text-sm input-themed ${errors.contract_title ? 'border-rose-300' : ''}`}
                    placeholder="e.g., South Pars Phase 22 — Inspection Services"
                  />
                  {errors.contract_title && <p className="mt-1 text-[11px] font-medium text-rose-600">✕ {errors.contract_title}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary">Service Description *</label>
                  <select
                    value={formData.service_description}
                    onChange={(e) => setFormData({ ...formData, service_description: e.target.value as any })}
                    className={`w-full rounded-lg px-3 py-2 text-sm input-themed ${!formData.service_description ? 'text-muted' : ''}`}
                  >
                    <option value="">Select service type...</option>
                    <option value="TPI">🔍 TPI - Third Party Inspection</option>
                    <option value="MWS">🔧 MWS - Marine Warranty Survey</option>
                    <option value="TPER">📊 TPER - Technical Performance Evaluation Report</option>
                    <option value="OTHER">📋 Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dates and Value */}
            <div className={`rounded-lg border p-4 ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50/50'}`}>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary">Start Date *</label>
                  <JalaaliDatePicker
                    value={formData.start_date}
                    onChange={(date) => {
                      let effectiveDate = formData.adjustment.effective_date;
                      if (formData.adjustment.enabled && !effectiveDate && date) {
                        effectiveDate = getNextJalaaliYearStart(date);
                      }
                      setFormData({
                        ...formData,
                        start_date: date,
                        adjustment: { ...formData.adjustment, effective_date: effectiveDate }
                      });
                    }}
                    placeholder="Select start date"
                  />
                  {errors.start_date && <p className="mt-1 text-[11px] font-medium text-rose-600">✕ {errors.start_date}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary">End Date *</label>
                  <JalaaliDatePicker
                    value={formData.end_date}
                    onChange={handleSmartEndDateChange}
                    minDate={formData.start_date}
                    placeholder={formData.start_date ? 'Select end date' : 'Select start date first'}
                    disabled={!formData.start_date}
                  />
                  {errors.end_date && <p className="mt-1 text-[11px] font-medium text-rose-600">✕ {errors.end_date}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary">Total Value *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.total_value ? formatNumberInput(String(formData.total_value)) : ''}
                    onChange={(e) => setFormData({ ...formData, total_value: parseNumberInput(e.target.value) })}
                    className={`w-full rounded-lg px-3 py-2 text-sm font-mono text-right input-themed ${errors.total_value ? 'border-rose-300' : ''}`}
                    placeholder="0"
                  />
                  {errors.total_value && <p className="mt-1 text-[11px] font-medium text-rose-600">✕ {errors.total_value}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm input-themed"
                  >
                    <option value="IRR">IRR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
            </div>

			{/* 🔑 ردیف‌های تعرفه */}
			<TariffEditor
			  tariffs={formData.tariffs}
			  onChange={(tariffs) => setFormData({ ...formData, tariffs })}
			  error={errors.tariffs}
			  showTotals={false}
			/>

            {/* Contract Numbers */}
            <div className={`rounded-lg border p-4 ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50/50'}`}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary">Internal Contract No. (ICS)</label>
                  <div className={`w-full rounded-lg border border-theme bg-card py-2.5 px-3 text-sm font-mono font-semibold text-primary`}>
                    {formData.contract_no}
                  </div>
                  <p className="text-[10px] text-secondary mt-1">Auto-generated, Unique per ICS Department</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary">External Contract No (Optional)</label>
                  <input
                    value={formData.external_contract_no}
                    onChange={(e) => setFormData({ ...formData, external_contract_no: e.target.value })}
                    className={`w-full rounded-lg border border-theme bg-card py-2.5 px-3 text-sm font-mono font-semibold text-primary`}
                    placeholder="Client's Contract No."
                  />
                </div>
              </div>
            </div>

            {/* Financial & Legal Terms */}
            <div className={`rounded-lg border p-4 ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50/50'}`}>
              <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                💼 Financial & Legal Terms
              </h3>

              <div className="space-y-2">
                {/* Price Adjustment & Contract Modification */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-lg border p-4 ${
                    formData.adjustment.enabled
                      ? (isDark ? 'border-indigo-700 bg-indigo-950/30' : 'border-indigo-200 bg-indigo-50/30')
                      : (isDark ? 'border-slate-700 bg-slate-800/20' : 'border-slate-200 bg-slate-50/20')
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📊</span>
                        <h4 className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          Price Adjustment
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newEnabled = !formData.adjustment.enabled;
                          const effectiveDate = newEnabled && !formData.adjustment.effective_date && formData.start_date
                            ? getNextJalaaliYearStart(formData.start_date)
                            : formData.adjustment.effective_date;
                          setFormData({
                            ...formData,
                            adjustment: { ...formData.adjustment, enabled: newEnabled, effective_date: effectiveDate }
                          });
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          formData.adjustment.enabled ? 'bg-indigo-600' : (isDark ? 'bg-slate-700' : 'bg-slate-300')
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.adjustment.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    {formData.adjustment.enabled && (
                      <div className="space-y-3">
                        <div className={`rounded-lg border p-3 ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50/30'}`}>
                          <label className={`mb-2 block text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            Adjustment Mode
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, adjustment: { ...formData.adjustment, mode: 'FIXED' } })}
                              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                formData.adjustment.mode === 'FIXED'
                                  ? 'bg-indigo-600 text-white shadow-md'
                                  : (isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300')
                              }`}
                            >
                              ✅ Fixed
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, adjustment: { ...formData.adjustment, mode: 'TBD', percentage: 0 } })}
                              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                formData.adjustment.mode === 'TBD'
                                  ? 'bg-amber-600 text-white shadow-md'
                                  : (isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300')
                              }`}
                            >
                              ⏳ TBD
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={`mb-1 block text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              Percentage (%)
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={formData.adjustment.percentage ? formatNumberInput(String(formData.adjustment.percentage)) : ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                adjustment: { ...formData.adjustment, percentage: parseNumberInput(e.target.value) }
                              })}
                              disabled={formData.adjustment.mode === 'TBD'}
                              className={`w-full rounded-lg border px-3 py-2 text-sm font-mono text-right input-themed ${
                                formData.adjustment.mode === 'TBD' ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className={`mb-1 block text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              Effective Date
                            </label>
                            <JalaaliDatePicker
                              value={formData.adjustment.effective_date}
                              onChange={(date) => setFormData({
                                ...formData,
                                adjustment: { ...formData.adjustment, effective_date: date }
                              })}
                              placeholder="Select date"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contract Modification */}
                  <div className={`rounded-lg border p-4 ${
                    formData.contract_modification.percentage > 0
                      ? (isDark ? 'border-indigo-700 bg-indigo-950/30' : 'border-indigo-200 bg-indigo-50/30')
                      : (isDark ? 'border-slate-700 bg-slate-800/20' : 'border-slate-200 bg-slate-50/20')
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base">🔄</span>
                      <h4 className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        Contract Modification
                      </h4>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData.contract_modification?.percentage ? formatNumberInput(String(formData.contract_modification.percentage)) : ''}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9.]/g, '');
                          const parts = raw.split('.');
                          const clean = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : raw;
                          setFormData({
                            ...formData,
                            contract_modification: { percentage: Number(clean) || 0 }
                          });
                        }}
                        className="w-full rounded-lg border px-3 py-2 pr-8 text-sm font-mono text-right input-themed"
                        placeholder="0"
                      />
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>%</span>
                    </div>

                    {formData.contract_modification.percentage > 0 && (
                      <div className={`mt-3 rounded-lg border p-3 ${isDark ? 'border-indigo-700 bg-indigo-950/30' : 'border-indigo-200 bg-indigo-50/50'}`}>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className={`flex justify-between p-2 rounded ${isDark ? "bg-slate-800/50" : "bg-white/70"}`}>
							  <span className={isDark ? "text-slate-300" : "text-slate-600"}>💰 Ceiling:</span>
							  <span className="font-bold font-mono text-indigo-500">
								{formData.total_value > 0 
								  ? `+${formatCurrency((formData.total_value * formData.contract_modification.percentage) / 100, formData.currency)}`
								  : "—"
								}
							  </span>
							</div>
                          <div className={`flex justify-between p-2 rounded ${isDark ? 'bg-slate-800/50' : 'bg-white/70'}`}>
                            <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>📅 Duration:</span>
                            <span className="font-bold font-mono text-indigo-500">
                              {formData.start_date && formData.end_date ? (() => {
                                try {
                                  const [startJy, startJm, startJd] = formData.start_date.split('/').map(Number);
                                  const [endJy, endJm, endJd] = formData.end_date.split('/').map(Number);
                                  if (!startJy || !endJy) return '—';
                                  const startG = jalaali.toGregorian(startJy, startJm, startJd);
                                  const endG = jalaali.toGregorian(endJy, endJm, endJd);
                                  const startDate = new Date(startG.gy, startG.gm - 1, startG.gd);
                                  const endDate = new Date(endG.gy, endG.gm - 1, endG.gd);
                                  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                                  if (totalDays <= 0 || isNaN(totalDays)) return '—';
                                  const modifiedDays = Math.round((totalDays * formData.contract_modification.percentage) / 100);
                                  return `+${Math.abs(modifiedDays)} days`;
                                } catch {
                                  return '—';
                                }
                              })() : '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Guarantee */}
                <div className={`rounded-lg border p-4 ${
                  formData.guarantee.has_guarantee
                    ? (isDark ? 'border-emerald-700 bg-emerald-950/30' : 'border-emerald-200 bg-emerald-50/30')
                    : (isDark ? 'border-slate-700 bg-slate-800/20' : 'border-slate-200 bg-slate-50/20')
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
					  <span className="text-base">🏦</span>
					  <h4 className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
						Performance Guarantee
					  </h4>
					  {formData.total_value <= 0 && (
						<span className={`text-[10px] font-normal ${isDark ? "text-amber-400" : "text-amber-600"}`}>
						  ⚠️ Enter Total Value first
						</span>
					  )}
					</div>	
					<button
					  type="button"
					  onClick={() => {
						if (formData.total_value <= 0) return;
						setFormData({
						  ...formData,
						  guarantee: { ...formData.guarantee, has_guarantee: !formData.guarantee.has_guarantee }
						});
					  }}
					  disabled={formData.total_value <= 0}
					  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
						formData.total_value <= 0
						  ? "opacity-40 cursor-not-allowed bg-slate-400"
						  : formData.guarantee.has_guarantee 
							? "bg-emerald-600" 
							: (isDark ? "bg-slate-700" : "bg-slate-300")
					  }`}
					  title={
						formData.total_value <= 0 
						  ? "Enter Total Value first to enable guarantee" 
						  : "Toggle performance guarantee"
					  }
					>
					  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
						formData.guarantee.has_guarantee ? "translate-x-6" : "translate-x-1"
					  }`} />
					</button>
                  </div>

                  {formData.guarantee.has_guarantee && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`mb-1 block text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Percentage (%)
                        </label>
                        <input
                          type="text"
						  inputMode="numeric"
						  value={formData.total_value ? formatNumberInput(String(formData.total_value)) : ""}
						  onChange={(e) => {
							const newValue = parseNumberInput(e.target.value);
							setFormData({
							  ...formData,
							  total_value: newValue,
							  // 🔑 اگه Total Value صفر شد، ضمانت‌نامه رو خودکار خاموش کن
							  guarantee: newValue <= 0 
								? { ...formData.guarantee, has_guarantee: false, percentage: 0 }
								: formData.guarantee
							});
                          }}
                          className="w-full rounded-lg border px-3 py-2 text-sm font-mono text-right input-themed"
                          placeholder="0.00"
                        />
                        {formData.total_value > 0 && formData.guarantee.percentage > 0 && (
                          <p className={`text-[10px] mt-1 font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                            ≈ {formatCurrency((formData.total_value * formData.guarantee.percentage) / 100, formData.currency)}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className={`mb-1 block text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Guarantee Type
                        </label>
                        <select
                          value={formData.guarantee.type}
                          onChange={(e) => setFormData({
                            ...formData,
                            guarantee: { ...formData.guarantee, type: e.target.value as any }
                          })}
                          className="w-full rounded-lg border px-3 py-2 text-sm input-themed"
                        >
                          <option value="BANK_GUARANTEE">🏦 Bank Guarantee</option>
                          <option value="CHECK">📝 Check</option>
                          <option value="PROMISSORY_NOTE">📄 Promissory Note</option>
                          <option value="CASH_BLOCK">💰 Cash Block</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Good Performance & Insurance */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-lg border p-4 ${isDark ? 'border-slate-700 bg-slate-800/20' : 'border-slate-200 bg-slate-50/20'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">✅</span>
                      <h4 className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Good Performance</h4>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData.good_performance_percentage ? formatNumberInput(String(formData.good_performance_percentage)) : ''}
                        onChange={(e) => setFormData({ ...formData, good_performance_percentage: parseNumberInput(e.target.value) })}
                        className="w-full rounded-lg border px-3 py-2 pr-8 text-sm font-mono text-right input-themed"
                        placeholder="10.00"
                      />
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>%</span>
                    </div>
                  </div>

                  <div className={`rounded-lg border p-4 ${isDark ? 'border-slate-700 bg-slate-800/20' : 'border-slate-200 bg-slate-50/20'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">🏥</span>
                      <h4 className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Insurance Deduction</h4>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData.insurance_deduction_percentage ? formatNumberInput(String(formData.insurance_deduction_percentage)) : ''}
                        onChange={(e) => setFormData({ ...formData, insurance_deduction_percentage: parseNumberInput(e.target.value) })}
                        className="w-full rounded-lg border px-3 py-2 pr-8 text-sm font-mono text-right input-themed"
                        placeholder="16.67"
                      />
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <ContractAttachmentsEditor
              attachments={formData.attachments}
              onChange={(attachments) => setFormData({ ...formData, attachments })}
              isDark={isDark}
            />

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-primary">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg px-3 py-2 text-sm input-themed"
                placeholder="Optional description..."
              />
            </div>
          </>
        ) : (
          <>
            {/* Work Order Form */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-primary">Source Type *</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, source_type: 'LETTER' })}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    formData.source_type === 'LETTER'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : (isDark ? 'bg-muted text-secondary hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                  }`}
                >
                  📄 Letter
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, source_type: 'EMAIL' })}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    formData.source_type === 'EMAIL'
                      ? 'bg-blue-600 text-white shadow-md'
                      : (isDark ? 'bg-muted text-secondary hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                  }`}
                >
                  📧 Email
                </button>
              </div>
            </div>

            {formData.source_type === 'LETTER' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-primary">Letter Number *</label>
                    <input
                      value={formData.source_ref}
                      onChange={(e) => setFormData({ ...formData, source_ref: e.target.value })}
                      className="w-full rounded-lg bg-card px-3 py-2.5 text-sm font-mono input-themed"
                      placeholder="e.g., 1404/1234"
                    />
                    {errors.source_ref && <p className="mt-1 text-[11px] font-medium text-rose-600">✕ {errors.source_ref}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-primary">Letter Date *</label>
                    <JalaaliDatePicker
                      value={formData.source_letter_date || ''}
                      onChange={(date) => setFormData({ ...formData, source_letter_date: date })}
                      placeholder="Select letter date"
                    />
                    {errors.source_letter_date && <p className="mt-1 text-[11px] font-medium text-rose-600">✕ {errors.source_letter_date}</p>}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary">
                    Letter Image * <span className="text-rose-500">(Required)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      id="letter-image-input"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const preview = URL.createObjectURL(file);
                          setFormData({
                            ...formData,
                            source_letter_image: file.name,
                            source_letter_image_object: file,
                            source_letter_image_preview: preview,
                          });
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="letter-image-input"
                      className={`flex items-center justify-between gap-2 w-full rounded-lg border-2 px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                        formData.source_letter_image
                          ? (isDark ? 'border-emerald-600 bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50' : 'border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100')
                          : (isDark ? 'border-dashed border-slate-600 bg-muted text-secondary hover:border-indigo-500 hover:bg-slate-800' : 'border-dashed border-slate-300 bg-muted text-slate-600 hover:border-indigo-400 hover:bg-indigo-50')
                      }`}
                    >
                      {formData.source_letter_image ? (
                        <>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span>🖼️</span>
                            <span className="truncate font-medium">{formData.source_letter_image}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {formData.source_letter_image_preview && (
                              <img src={formData.source_letter_image_preview} alt="Preview" className="h-8 w-8 object-cover rounded border border-slate-200" />
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setFormData({
                                  ...formData,
                                  source_letter_image: '',
                                  source_letter_image_object: null,
                                  source_letter_image_preview: '',
                                });
                                const input = document.getElementById('letter-image-input') as HTMLInputElement;
                                if (input) input.value = '';
                              }}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded transition-colors"
                              title="Remove image"
                            >
                              ✕
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>📎</span>
                          <span>Click to attach letter image (JPG, PNG, PDF)</span>
                        </div>
                      )}
                    </label>
                  </div>
                  {errors.source_letter_image && <p className="mt-1 text-[11px] font-medium text-rose-600">✕ {errors.source_letter_image}</p>}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-primary">From Email Address *</label>
                    <input
                      type="email"
                      value={formData.source_email_from || ''}
                      onChange={(e) => setFormData({ ...formData, source_email_from: e.target.value })}
                      className={`w-full rounded-lg bg-card px-3 py-2.5 text-sm font-mono input-themed ${errors.source_email_from ? 'border-rose-300' : ''}`}
                      placeholder="sender@example.com"
                    />
                    {errors.source_email_from && <p className="mt-1 text-[11px] font-medium text-rose-600">✕ {errors.source_email_from}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-primary">Email Date</label>
                    <input
                      type="date"
                      value={formData.source_email_date || ''}
                      onChange={(e) => setFormData({ ...formData, source_email_date: e.target.value })}
                      className="w-full rounded-lg bg-card px-3 py-2.5 text-sm input-themed"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary">Attach Email File</label>
                  <div className="relative">
                    <input
                      type="file"
                      id="email-file-input"
                      accept=".msg,.eml"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormData({
                            ...formData,
                            source_file: file.name,
                            source_file_object: file
                          });
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="email-file-input"
                      className={`flex items-center justify-between gap-2 w-full rounded-lg border-2 px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                        formData.source_file
                          ? (isDark ? 'border-emerald-600 bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50' : 'border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100')
                          : (isDark ? 'border-dashed border-slate-600 bg-muted text-secondary hover:border-indigo-500 hover:bg-slate-800' : 'border-dashed border-slate-300 bg-muted text-slate-600 hover:border-indigo-400 hover:bg-indigo-50')
                      }`}
                    >
                      {formData.source_file ? (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (formData.source_file_object) {
                                const url = URL.createObjectURL(formData.source_file_object);
                                window.open(url, '_blank');
                              }
                            }}
                            className="flex items-center gap-2 flex-1 text-left hover:underline min-w-0"
                            title="Click to open email"
                          >
                            <span>📧</span>
                            <span className="truncate font-medium">{formData.source_file}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFormData({ ...formData, source_file: '', source_file_object: null });
                              const input = document.getElementById('email-file-input') as HTMLInputElement;
                              if (input) input.value = '';
                            }}
                            className="shrink-0 p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded transition-colors"
                            title="Remove file"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>📎</span>
                          <span>Click to attach (.msg, .eml)</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            )}

            <ClientSelectorModal
              value={formData.client_id}
              onChange={(clientId) => setFormData({ ...formData, client_id: clientId })}
              onAddNew={onNavigateToClients}
              error={errors.client_id}
            />

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-primary">Work Order Title *</label>
              <input
                value={formData.contract_title}
                onChange={(e) => setFormData({ ...formData, contract_title: e.target.value })}
                className={`w-full rounded-lg px-3 py-2 text-sm input-themed ${errors.contract_title ? 'border-rose-300' : ''}`}
                placeholder="Brief title of the work order"
              />
              {errors.contract_title && <p className="mt-1 text-[11px] font-medium text-rose-600">✕ {errors.contract_title}</p>}
            </div>

            <TariffEditor
              tariffs={formData.tariffs}
              onChange={(tariffs) => setFormData({ ...formData, tariffs })}
              error={errors.tariffs}
              showTotals={false}
            />

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-primary">Description (Optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg px-3 py-2 text-sm input-themed"
                placeholder="Additional details..."
              />
            </div>
          </>
        )}

        <div className={`flex justify-end gap-3 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>💾 Save {formData.type === 'CONTRACT' ? 'Contract' : 'Work Order'}</Button>
        </div>
      </div>
    </Modal>
  );
}




