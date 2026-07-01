// src/features/client-management/ui/ClientForm.tsx

import { useState, useEffect } from 'react';
import { Button, Badge, Modal } from '@design-system';
import { useTheme } from '@app/providers/ThemeProvider';
import type { Client } from '@entities/contract/types';
import { validateNationalCode, validateNationalId, validateMobile } from '@shared/lib/validators';

// 🔐 RBAC Imports
import { usePermission } from '@shared/authorization/hooks/usePermission';
import { showToast } from '@shared/ui/ToastContainer';

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: any) => void;
  clients: Client[];
  currentDepartment: string;
  onDuplicateWarning?: React.Dispatch<
    React.SetStateAction<{
      field: string;
      client: any;
      message: string;
    } | null>
  >;
}

export function ClientForm({
  isOpen,
  onClose,
  onSave,
  clients,
  currentDepartment,
}: ClientFormProps) {
  const { isDark } = useTheme();
  
  // 🔐 RBAC: چک کردن permission
  const { can } = usePermission();
  const canCreate = can('client:create');

  const [addForm, setAddForm] = useState({
    name_en: '',
    name_fa: '',
    abbreviated_name: '',
    company_type: 'Private Joint Stock',
    national_id: '',
    economic_code: '',
    registration_no: '',
    address_en: '',
    address_fa: '',
    primary_phone: '',
    email_inbox: '',
    category: 'OIL_GAS' as const,
    contactPersons: [
      { id: '1', name: '', position: '', mobile: '', email: '' },
    ],
  });

  const [addErrors, setAddErrors] = useState<any>({});
  const [duplicateWarning, setDuplicateWarning] = useState<{
    field: string;
    client: any;
    message: string;
  } | null>(null);

  // 🔐 RBAC: اگر دسترسی نداره، مودال رو نبند و پیام بده
  useEffect(() => {
    if (isOpen && !canCreate) {
      showToast('error', 'Access Denied', 'You do not have permission to create clients');
      onClose();
    }
  }, [isOpen, canCreate, onClose]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && canCreate) {
      setAddForm({
        name_en: '',
        name_fa: '',
        abbreviated_name: '',
        company_type: 'Private Joint Stock',
        national_id: '',
        economic_code: '',
        registration_no: '',
        address_en: '',
        address_fa: '',
        primary_phone: '',
        email_inbox: '',
        category: 'OIL_GAS',
        contactPersons: [
          { id: '1', name: '', position: '', mobile: '', email: '' },
        ],
      });
      setAddErrors({});
      setDuplicateWarning(null);
    }
  }, [isOpen, canCreate]);

  // Check for duplicates
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      let found: any = null;
      let field = '';
      const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, '').trim();

      if (addForm.name_en.trim().length >= 3) {
        found = clients.find((c) => normalize(c.name_en) === normalize(addForm.name_en));
        if (found) field = 'name_en';
      }

      if (!found && addForm.national_id && addForm.national_id.length >= 10) {
        found = clients.find((c) => c.national_id && c.national_id === addForm.national_id);
        if (found) field = 'national_id';
      }

      if (!found && addForm.company_type && addForm.registration_no.trim()) {
        found = clients.find((c) => (c as any).registration_no === addForm.registration_no);
        if (found) field = 'registration_no';
      }

      if (found) {
        const dept = (found as any).departments?.[0] || 'Unknown';
        const totalContacts = (found as any).contactPersons?.length || 0;
        setDuplicateWarning({
          field,
          client: found,
          message: `⚠️ This client already exists in ${dept}. Total contacts: ${totalContacts}`,
        });
      } else {
        setDuplicateWarning(null);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [addForm.national_id, addForm.name_en, addForm.registration_no, clients, addForm.company_type, isOpen]);

  const validateAddForm = () => {
    const errors: any = {};
    if (!addForm.name_en.trim()) errors.name_en = 'English name is required';
    if (!addForm.name_fa.trim()) errors.name_fa = 'نام فارسی الزامی است';
    if (!addForm.national_id) errors.national_id = 'National ID/Code is required';
    else if (addForm.company_type && !validateNationalId(addForm.national_id))
      errors.national_id = 'Must be exactly 11 digits';
    else if (!addForm.company_type && !validateNationalCode(addForm.national_id))
      errors.national_id = 'Invalid national code';

    if (addForm.company_type && !addForm.registration_no)
      errors.registration_no = 'Registration number is required';

    if (!addForm.primary_phone) errors.primary_phone = 'Primary phone is required';
    else if (!validateMobile(addForm.primary_phone))
      errors.primary_phone = 'Invalid mobile format';

    if (!addForm.address_en.trim()) errors.address_en = 'English address is required';
    if (!addForm.address_fa.trim()) errors.address_fa = 'آدرس فارسی الزامی است';

    const validContacts = addForm.contactPersons.filter(
      (cp) => cp.name.trim() && validateMobile(cp.mobile)
    );
    if (addForm.company_type && validContacts.length === 0)
      errors.contactPersons = 'At least one valid contact person required';

    setAddErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    // 🔐 RBAC: چک کردن permission قبل از submit
    if (!canCreate) {
      showToast('error', 'Access Denied', 'You do not have permission to create clients');
      return;
    }

    if (!validateAddForm()) return;
    if (duplicateWarning) {
      showToast('warning', 'Duplicate Warning', 'Please resolve the duplicate client warning first.');
      return;
    }

    const newClient: any = {
      id: `c${Date.now()}`,
      type: addForm.company_type ? 'LEGAL' : 'INDIVIDUAL',
      name_en: addForm.name_en,
      name_fa: addForm.name_fa,
      national_id: addForm.national_id,
      category: addForm.category,
      contacts: addForm.company_type
        ? addForm.contactPersons.filter((cp) => cp.name.trim()).length
        : 0,
      contracts: 0,
      logoColor: 'from-indigo-500 to-violet-600',
      email: addForm.email_inbox,
      phone: addForm.primary_phone,
      address_en: addForm.address_en,
      address_fa: addForm.address_fa,
      departments: [currentDepartment],
      contactPersons: addForm.company_type
        ? addForm.contactPersons
            .filter((cp) => cp.name.trim())
            .map((cp) => ({ ...cp, department: currentDepartment }))
        : [],
    };

    if (addForm.company_type) {
      newClient.company_type = addForm.company_type;
      newClient.registration_no = addForm.registration_no;
      newClient.economic_code = addForm.economic_code;
      newClient.abbreviated_name = addForm.abbreviated_name;
    }

    onSave(newClient);
    onClose();
  };

  const addContactPerson = () =>
    setAddForm({
      ...addForm,
      contactPersons: [
        ...addForm.contactPersons,
        { id: Date.now().toString(), name: '', position: '', mobile: '', email: '' },
      ],
    });

  const removeContactPerson = (id: string) =>
    setAddForm({
      ...addForm,
      contactPersons: addForm.contactPersons.filter((cp) => cp.id !== id),
    });

  const updateContactPerson = (id: string, field: string, value: string) =>
    setAddForm({
      ...addForm,
      contactPersons: addForm.contactPersons.map((cp) =>
        cp.id === id ? { ...cp, [field]: value } : cp
      ),
    });

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setDuplicateWarning(null);
      }}
      title="Entity Onboarding"
      size="xl"
    >
      <div className="space-y-6">
        {/* Type Selector */}
        <div
          className={`flex gap-2 p-1.5 rounded-xl border w-fit ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={() => setAddForm({ ...addForm, company_type: 'Private Joint Stock' })}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              addForm.company_type
                ? 'bg-indigo-600 text-white shadow-md'
                : isDark
                ? 'text-slate-300 hover:bg-slate-700'
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            🏢 LEGAL
          </button>
          <button
            type="button"
            onClick={() => setAddForm({ ...addForm, company_type: '' })}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              !addForm.company_type
                ? 'bg-indigo-600 text-white shadow-md'
                : isDark
                ? 'text-slate-300 hover:bg-slate-700'
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            👤 INDIVIDUAL
          </button>
        </div>

        {/* Basic Identity */}
        <div
          className={`rounded-2xl border p-6 ${
            isDark ? 'border-slate-700' : 'border-slate-200'
          }`}
        >
          <h2
            className={`text-lg font-bold mb-6 flex items-center gap-2 ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            🌐 BASIC IDENTITY
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Name EN */}
            <div>
              <label
                className={`mb-1.5 block text-xs font-semibold ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Full Name (English) *
              </label>
              <input
                value={addForm.name_en}
                onChange={(e) => setAddForm({ ...addForm, name_en: e.target.value })}
                className={`w-full rounded-lg border py-2.5 px-3 text-sm focus:outline-none focus:ring-2 ${
                  addErrors.name_en
                    ? 'border-rose-300 focus:ring-rose-100'
                    : isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-indigo-400 focus:ring-indigo-900'
                    : 'border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-100'
                }`}
              />
              {duplicateWarning?.field === 'name_en' && (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-medium text-amber-900 mb-2">
                    {duplicateWarning.message}
                  </p>
                </div>
              )}
              {addErrors.name_en && !duplicateWarning && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">
                  ✕ {addErrors.name_en}
                </p>
              )}
            </div>

            {/* Name FA */}
            <div dir="rtl">
              <label
                className={`mb-1.5 block text-xs font-semibold text-left ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Full Name (Farsi) *
              </label>
              <input
                value={addForm.name_fa}
                onChange={(e) => setAddForm({ ...addForm, name_fa: e.target.value })}
                className={`w-full rounded-lg border py-2.5 px-3 text-sm text-right focus:outline-none focus:ring-2 ${
                  addErrors.name_fa
                    ? 'border-rose-300 focus:ring-rose-100'
                    : isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-indigo-400 focus:ring-indigo-900'
                    : 'border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-100'
                }`}
              />
              {addErrors.name_fa && (
                <p className="mt-1 text-[11px] font-medium text-rose-600 text-right">
                  ✕ {addErrors.name_fa}
                </p>
              )}
            </div>

            {/* Abbreviated Name */}
            {addForm.company_type && (
              <div>
                <label
                  className={`mb-1.5 block text-xs font-semibold ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Abbreviated Name
                </label>
                <input
                  value={addForm.abbreviated_name}
                  onChange={(e) =>
                    setAddForm({ ...addForm, abbreviated_name: e.target.value })
                  }
                  className={`w-full rounded-lg border py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-indigo-400'
                      : 'border-slate-200 bg-white focus:border-indigo-400'
                  }`}
                />
              </div>
            )}

            {/* Company Type */}
            {addForm.company_type && (
              <div>
                <label
                  className={`mb-1.5 block text-xs font-semibold ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Company Type *
                </label>
                <select
                  value={addForm.company_type}
                  onChange={(e) =>
                    setAddForm({ ...addForm, company_type: e.target.value })
                  }
                  className={`w-full rounded-lg border py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-indigo-400'
                      : 'border-slate-200 bg-white focus:border-indigo-400'
                  }`}
                >
                  <option value="Private Joint Stock">Private Joint Stock</option>
                  <option value="Public Joint Stock">Public Joint Stock</option>
                  <option value="Limited Liability">Limited Liability</option>
                </select>
              </div>
            )}

            {/* National ID */}
            <div>
              <label
                className={`mb-1.5 block text-xs font-semibold ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                {addForm.company_type
                  ? 'National ID (11 digits) *'
                  : 'National Code (10 digits) *'}
              </label>
              <input
                value={addForm.national_id}
                onChange={(e) =>
                  setAddForm({
                    ...addForm,
                    national_id: e.target.value.replace(/\D/g, ''),
                  })
                }
                maxLength={addForm.company_type ? 11 : 10}
                className={`w-full rounded-lg border py-2.5 px-3 text-sm font-mono focus:outline-none focus:ring-2 ${
                  addErrors.national_id
                    ? 'border-rose-300 focus:ring-rose-100'
                    : isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-indigo-400 focus:ring-indigo-900'
                    : 'border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-100'
                }`}
              />
              {duplicateWarning?.field === 'national_id' && (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-medium text-amber-900 mb-2">
                    {duplicateWarning.message}
                  </p>
                </div>
              )}
              {addErrors.national_id && !duplicateWarning && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">
                  ✕ {addErrors.national_id}
                </p>
              )}
            </div>

            {/* Economic Code */}
            {addForm.company_type && (
              <div>
                <label
                  className={`mb-1.5 block text-xs font-semibold ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Economic Code
                </label>
                <input
                  value={addForm.economic_code}
                  onChange={(e) =>
                    setAddForm({
                      ...addForm,
                      economic_code: e.target.value.replace(/\D/g, ''),
                    })
                  }
                  className={`w-full rounded-lg border py-2.5 px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-indigo-400'
                      : 'border-slate-200 bg-white focus:border-indigo-400'
                  }`}
                />
              </div>
            )}

            {/* Registration No */}
            {addForm.company_type && (
              <div>
                <label
                  className={`mb-1.5 block text-xs font-semibold ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Registration Number *
                </label>
                <input
                  value={addForm.registration_no}
                  onChange={(e) =>
                    setAddForm({ ...addForm, registration_no: e.target.value })
                  }
                  className={`w-full rounded-lg border py-2.5 px-3 text-sm focus:outline-none focus:ring-2 ${
                    addErrors.registration_no
                      ? 'border-rose-300 focus:ring-rose-100'
                      : isDark
                      ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-indigo-400 focus:ring-indigo-900'
                      : 'border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-100'
                  }`}
                />
                {duplicateWarning?.field === 'registration_no' && (
                  <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-medium text-amber-900 mb-2">
                      {duplicateWarning.message}
                    </p>
                  </div>
                )}
                {addErrors.registration_no && !duplicateWarning && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">
                    ✕ {addErrors.registration_no}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contact Hub */}
        <div
          className={`rounded-2xl border p-6 ${
            isDark ? 'border-slate-700' : 'border-slate-200'
          }`}
        >
          <h2
            className={`text-lg font-bold mb-6 flex items-center gap-2 ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            📞 CONTACT HUB
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label
                className={`mb-1.5 block text-xs font-semibold ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Primary Phone *
              </label>
              <input
                value={addForm.primary_phone}
                onChange={(e) =>
                  setAddForm({
                    ...addForm,
                    primary_phone: e.target.value.replace(/\D/g, ''),
                  })
                }
                maxLength={11}
                className={`w-full rounded-lg border py-2.5 px-3 text-sm font-mono focus:outline-none focus:ring-2 ${
                  addErrors.primary_phone
                    ? 'border-rose-300 focus:ring-rose-100'
                    : isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-indigo-400 focus:ring-indigo-900'
                    : 'border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-100'
                }`}
              />
              {addErrors.primary_phone && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">
                  ✕ {addErrors.primary_phone}
                </p>
              )}
            </div>
            <div>
              <label
                className={`mb-1.5 block text-xs font-semibold ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Email Inbox
              </label>
              <input
                type="email"
                value={addForm.email_inbox}
                onChange={(e) =>
                  setAddForm({ ...addForm, email_inbox: e.target.value })
                }
                className={`w-full rounded-lg border py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-indigo-400'
                    : 'border-slate-200 bg-white focus:border-indigo-400'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Official Address */}
        <div
          className={`rounded-2xl border p-6 ${
            isDark ? 'border-slate-700' : 'border-slate-200'
          }`}
        >
          <h2
            className={`text-lg font-bold mb-6 flex items-center gap-2 ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            🏠 OFFICIAL ADDRESS
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label
                className={`mb-1.5 block text-xs font-semibold ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Address (English) *
              </label>
              <textarea
                value={addForm.address_en}
                onChange={(e) =>
                  setAddForm({ ...addForm, address_en: e.target.value })
                }
                rows={3}
                className={`w-full rounded-lg border py-2.5 px-3 text-sm focus:outline-none focus:ring-2 ${
                  addErrors.address_en
                    ? 'border-rose-300 focus:ring-rose-100'
                    : isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-indigo-400 focus:ring-indigo-900'
                    : 'border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-100'
                }`}
              />
              {addErrors.address_en && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">
                  ✕ {addErrors.address_en}
                </p>
              )}
            </div>
            <div dir="rtl">
              <label
                className={`mb-1.5 block text-xs font-semibold text-left ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Address (Farsi) *
              </label>
              <textarea
                value={addForm.address_fa}
                onChange={(e) =>
                  setAddForm({ ...addForm, address_fa: e.target.value })
                }
                rows={3}
                className={`w-full rounded-lg border py-2.5 px-3 text-sm text-right focus:outline-none focus:ring-2 ${
                  addErrors.address_fa
                    ? 'border-rose-300 focus:ring-rose-100'
                    : isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-indigo-400 focus:ring-indigo-900'
                    : 'border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-100'
                }`}
              />
              {addErrors.address_fa && (
                <p className="mt-1 text-[11px] font-medium text-rose-600 text-right">
                  ✕ {addErrors.address_fa}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Persons (Legal only) */}
        {addForm.company_type && (
          <div
            className={`rounded-2xl border p-6 ${
              isDark ? 'border-slate-700' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                className={`text-lg font-bold flex items-center gap-2 ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}
              >
                👥 CONTACT PERSONS
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    isDark
                      ? 'bg-indigo-900/50 text-indigo-300'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {addForm.contactPersons.length}
                </span>
              </h2>
              <button
                type="button"
                onClick={addContactPerson}
                className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                + ADD LIAISON
              </button>
            </div>

            {addErrors.contactPersons && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                ✕ {addErrors.contactPersons}
              </div>
            )}

            <div className="space-y-3">
              {addForm.contactPersons.map((cp) => (
                <div
                  key={cp.id}
                  className={`grid grid-cols-12 gap-3 p-4 rounded-xl border ${
                    isDark
                      ? 'border-slate-700 bg-slate-800/50'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="col-span-4">
                    <label
                      className={`mb-1 block text-[10px] font-semibold ${
                        isDark ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      Liaison Name *
                    </label>
                    <input
                      value={cp.name}
                      onChange={(e) =>
                        updateContactPerson(cp.id, 'name', e.target.value)
                      }
                      className={`w-full rounded border px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none ${
                        isDark
                          ? 'border-slate-700 bg-slate-800 text-slate-100'
                          : 'border-slate-200 bg-white'
                      }`}
                    />
                  </div>
                  <div className="col-span-3">
                    <label
                      className={`mb-1 block text-[10px] font-semibold ${
                        isDark ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      Position/Rank
                    </label>
                    <input
                      value={cp.position}
                      onChange={(e) =>
                        updateContactPerson(cp.id, 'position', e.target.value)
                      }
                      className={`w-full rounded border px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none ${
                        isDark
                          ? 'border-slate-700 bg-slate-800 text-slate-100'
                          : 'border-slate-200 bg-white'
                      }`}
                    />
                  </div>
                  <div className="col-span-3">
                    <label
                      className={`mb-1 block text-[10px] font-semibold ${
                        isDark ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      Mobile *
                    </label>
                    <input
                      value={cp.mobile}
                      onChange={(e) =>
                        updateContactPerson(
                          cp.id,
                          'mobile',
                          e.target.value.replace(/\D/g, '')
                        )
                      }
                      className={`w-full rounded border px-2 py-1.5 text-xs font-mono focus:border-indigo-400 focus:outline-none ${
                        isDark
                          ? 'border-slate-700 bg-slate-800 text-slate-100'
                          : 'border-slate-200 bg-white'
                      }`}
                    />
                  </div>
                  <div className="col-span-2 flex items-end gap-1">
                    <div className="flex-1">
                      <label
                        className={`mb-1 block text-[10px] font-semibold ${
                          isDark ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        Direct Email
                      </label>
                      <input
                        value={cp.email}
                        onChange={(e) =>
                          updateContactPerson(cp.id, 'email', e.target.value)
                        }
                        className={`w-full rounded border px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none ${
                          isDark
                            ? 'border-slate-700 bg-slate-800 text-slate-100'
                            : 'border-slate-200 bg-white'
                        }`}
                      />
                    </div>
                    {addForm.contactPersons.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeContactPerson(cp.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div
          className={`flex justify-end gap-3 pt-4 border-t ${
            isDark ? 'border-slate-700' : 'border-slate-100'
          }`}
        >
          <Button
            variant="ghost"
            onClick={() => {
              onClose();
              setDuplicateWarning(null);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSave}>💾 Save Entity</Button>
        </div>
      </div>
    </Modal>
  );
}