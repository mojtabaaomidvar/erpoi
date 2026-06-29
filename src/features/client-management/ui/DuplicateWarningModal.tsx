// src/views/clients/components/DuplicateWarningModal.tsx
import { useState, useEffect } from'react';
import { Button, Badge, Modal, Avatar } from'@design-system';
import { useTheme } from'@app/providers/ThemeProvider';
import { validateMobile } from'@shared/lib/validators';

interface DuplicateWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveContact: (contact: any) => void;
  duplicateClient: any;
  currentDepartment: string;
}

export function DuplicateWarningModal({
  isOpen,
  onClose,
  onSaveContact,
  duplicateClient,
  currentDepartment,
}: DuplicateWarningModalProps) {
  const { isDark } = useTheme();

  const [newContact, setNewContact] = useState({
    name:'',
    position:'',
    mobile:'',
    email:'',
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewContact({ name:'', position:'', mobile:'', email:''});
    }
  }, [isOpen]);

  if (!duplicateClient) return null;

  const handleAddContact = () => {
    if (!newContact.name.trim() || !validateMobile(newContact.mobile)) {
      alert('Valid name and mobile required');
      return;
    }
    onSaveContact({
      ...newContact,
      id: Date.now().toString(),
      department: currentDepartment,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setNewContact({ name:'', position:'', mobile:'', email:''});
      }}
      title="Existing Client — Add Contact Person"size="xl">
      <div className="space-y-6">
        {/* Warning */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900 mb-1">
                This client already exists in the system
              </h3>
              <p className="text-xs text-amber-800">
                You can view the existing information and add a new contact person for{''}
                <span className="font-semibold">{currentDepartment}</span>. Other departments'contact persons are hidden for privacy.
              </p>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div
          className={`rounded-2xl border p-6 ${
            isDark ?'border-slate-700 bg-slate-800/30':'border-slate-200 bg-slate-50/30'}`}
        >
          <div className="flex items-center gap-4 mb-4">
            <Avatar
              name={duplicateClient.name_en}
              gradient={duplicateClient.logoColor}
              size="lg"/>
            <div>
              <h2
                className={`text-lg font-semibold ${
                  isDark ?'text-slate-100':'text-slate-900'}`}
              >
                {duplicateClient.name_en}
              </h2>
              <p
                className={`text-sm ${isDark ?'text-slate-300':'text-slate-600'}`}
                dir="rtl">
                {duplicateClient.name_fa}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  tone={duplicateClient.type ==='LEGAL'?'indigo':'violet'}
                >
                  {duplicateClient.type ==='LEGAL'?'Legal Entity':'Individual'}
                </Badge>
                <Badge tone="slate">
                  {(duplicateClient as any).departments?.join(',') ||'Unknown'}
                </Badge>
              </div>
            </div>
          </div>

          {duplicateClient.type ==='LEGAL'&& (
            <div
              className={`grid grid-cols-2 md:grid-cols-3 gap-4 text-sm pt-4 border-t ${
                isDark ?'border-slate-700':'border-slate-200'}`}
            >
              <div>
                <div
                  className={`text-[10px] uppercase font-semibold mb-1 ${
                    isDark ?'text-slate-300':'text-slate-600'}`}
                >
                  National ID
                </div>
                <div
                  className={`font-mono text-xs ${
                    isDark ?'text-slate-100':'text-slate-900'}`}
                >
                  {duplicateClient.national_id ||'—'}
                </div>
              </div>
              <div>
                <div
                  className={`text-[10px] uppercase font-semibold mb-1 ${
                    isDark ?'text-slate-300':'text-slate-600'}`}
                >
                  Registration No
                </div>
                <div
                  className={`font-mono text-xs ${
                    isDark ?'text-slate-100':'text-slate-900'}`}
                >
                  {(duplicateClient as any).registration_no ||'—'}
                </div>
              </div>
              <div>
                <div
                  className={`text-[10px] uppercase font-semibold mb-1 ${
                    isDark ?'text-slate-300':'text-slate-600'}`}
                >
                  Economic Code
                </div>
                <div
                  className={`font-mono text-xs ${
                    isDark ?'text-slate-100':'text-slate-900'}`}
                >
                  {(duplicateClient as any).economic_code ||'—'}
                </div>
              </div>
              <div>
                <div
                  className={`text-[10px] uppercase font-semibold mb-1 ${
                    isDark ?'text-slate-300':'text-slate-600'}`}
                >
                  Company Type
                </div>
                <div
                  className={`text-xs ${
                    isDark ?'text-slate-100':'text-slate-900'}`}
                >
                  {(duplicateClient as any).company_type ||'—'}
                </div>
              </div>
              <div>
                <div
                  className={`text-[10px] uppercase font-semibold mb-1 ${
                    isDark ?'text-slate-300':'text-slate-600'}`}
                >
                  Total Contacts
                </div>
                <div
                  className={`text-xs font-semibold ${
                    isDark ?'text-slate-100':'text-slate-900'}`}
                >
                  {(duplicateClient as any).contactPersons?.length || 0}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Contact Form */}
        <div
          className={`rounded-2xl border p-6 ${
            isDark ?'border-indigo-800 bg-indigo-950/30':'border-indigo-200 bg-indigo-50/30'}`}
        >
          <h3
            className={`text-sm font-semibold mb-4 flex items-center gap-2 ${
              isDark ?'text-slate-100':'text-slate-900'}`}
          >
            ➕ Add New Contact Person for {currentDepartment}
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className={`mb-1 block text-xs font-semibold ${
                    isDark ?'text-slate-300':'text-slate-700'}`}
                >
                  Contact Name *
                </label>
                <input
                  value={newContact.name}
                  onChange={(e) =>
                    setNewContact({ ...newContact, name: e.target.value })
                  }
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                    isDark
                      ?'border-slate-700 bg-slate-800 text-slate-100':'border-slate-200 bg-white'}`}
                />
              </div>
              <div>
                <label
                  className={`mb-1 block text-xs font-semibold ${
                    isDark ?'text-slate-300':'text-slate-700'}`}
                >
                  Position
                </label>
                <input
                  value={newContact.position}
                  onChange={(e) =>
                    setNewContact({ ...newContact, position: e.target.value })
                  }
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                    isDark
                      ?'border-slate-700 bg-slate-800 text-slate-100':'border-slate-200 bg-white'}`}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className={`mb-1 block text-xs font-semibold ${
                    isDark ?'text-slate-300':'text-slate-700'}`}
                >
                  Mobile *
                </label>
                <input
                  value={newContact.mobile}
                  onChange={(e) =>
                    setNewContact({
                      ...newContact,
                      mobile: e.target.value.replace(/\D/g,''),
                    })
                  }
                  maxLength={11}
                  className={`w-full rounded-lg border px-3 py-2 text-sm font-mono focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                    isDark
                      ?'border-slate-700 bg-slate-800 text-slate-100':'border-slate-200 bg-white'}`}
                />
              </div>
              <div>
                <label
                  className={`mb-1 block text-xs font-semibold ${
                    isDark ?'text-slate-300':'text-slate-700'}`}
                >
                  Email
                </label>
                <input
                  type="email"value={newContact.email}
                  onChange={(e) =>
                    setNewContact({ ...newContact, email: e.target.value })
                  }
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                    isDark
                      ?'border-slate-700 bg-slate-800 text-slate-100':'border-slate-200 bg-white'}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          className={`flex justify-end gap-3 pt-4 border-t ${
            isDark ?'border-slate-700':'border-slate-100'}`}
        >
          <Button
            variant="ghost"onClick={() => {
              onClose();
              setNewContact({ name:'', position:'', mobile:'', email:''});
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleAddContact}>💾 Save Contact Person</Button>
        </div>
      </div>
    </Modal>
  );
}




