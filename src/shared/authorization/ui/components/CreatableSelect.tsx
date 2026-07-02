// src/shared/authorization/ui/components/CreatableSelect.tsx

import { useState } from 'react';
import { useTheme } from '@app/providers/ThemeProvider';

interface CreatableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  onCreateNew?: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export function CreatableSelect({ 
  value, 
  onChange, 
  options, 
  onCreateNew,
  placeholder = 'Select...',
  label,
  required = false
}: CreatableSelectProps) {
  const { isDark } = useTheme();
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newOption, setNewOption] = useState('');

  const handleCreate = () => {
    if (newOption.trim() && onCreateNew) {
      onCreateNew(newOption.trim());
      onChange(newOption.trim());
      setNewOption('');
      setShowCreateInput(false);
    }
  };

  if (showCreateInput) {
    return (
      <div>
        {label && (
          <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            {label}
          </label>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            placeholder="Enter new value..."
            className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
              isDark 
                ? 'border-slate-600 bg-slate-700 text-slate-100' 
                : 'border-slate-300 bg-white text-slate-900'
            }`}
            autoFocus
          />
          <button
            type="button"
            onClick={handleCreate}
            className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
          >
            ✓
          </button>
          <button
            type="button"
            onClick={() => { setShowCreateInput(false); setNewOption(''); }}
            className={`px-3 py-2 rounded-lg border text-sm ${
              isDark 
                ? 'border-slate-600 text-slate-300 hover:bg-slate-700' 
                : 'border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            ✗
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {label && (
        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          {label}
        </label>
      )}
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
            isDark 
              ? 'border-slate-600 bg-slate-700 text-slate-100' 
              : 'border-slate-300 bg-white text-slate-900'
          }`}
        >
          <option value="">{placeholder}</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {onCreateNew && (
          <button
            type="button"
            onClick={() => setShowCreateInput(true)}
            className={`px-3 py-2 rounded-lg border text-sm ${
              isDark 
                ? 'border-slate-600 text-slate-300 hover:bg-slate-700' 
                : 'border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
            title="Create new"
          >
            ➕
          </button>
        )}
      </div>
    </div>
  );
}