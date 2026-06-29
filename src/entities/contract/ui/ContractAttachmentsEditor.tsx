// src/components/ContractAttachmentsEditor.tsx
import { useState, useRef } from'react';

interface ContractAttachment {
  id: string;
  name: string;
  file_object: File | null;
  preview_url: string;
  category:"CONTRACT"|"ADDENDUM"|"CORRESPONDENCE"|"TECHNICAL";
  uploaded_at: string;
}

const ATTACHMENT_CATEGORIES = [
  { value:"CONTRACT", label:"Contract", color:"indigo"},
  { value:"ADDENDUM", label:"📎 Addendum", color:"amber"},
  { value:"CORRESPONDENCE", label:"📧 Correspondence", color:"sky"},
  { value:"TECHNICAL", label:"🔧 Technical Docs", color:"emerald"},
] as const;

interface ContractAttachmentsEditorProps {
  attachments: ContractAttachment[];
  onChange: (attachments: ContractAttachment[]) => void;
  isDark: boolean;
}

export function ContractAttachmentsEditor({
  attachments,
  onChange,
  isDark,
}: ContractAttachmentsEditorProps) {
  const [activeCategory, setActiveCategory] = useState<"CONTRACT"|"ADDENDUM"|"CORRESPONDENCE"|"TECHNICAL">("CONTRACT");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAttachments: ContractAttachment[] = Array.from(files).map((file) => ({
      id: `att${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      file_object: file,
      preview_url: URL.createObjectURL(file),
      category: activeCategory,
      uploaded_at: new Date().toISOString(),
    }));

    onChange([...attachments, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value ="";
  };

  const removeAttachment = (id: string) => {
    const att = attachments.find(a => a.id === id);
    if (att?.preview_url) URL.revokeObjectURL(att.preview_url);
    onChange(attachments.filter(a => a.id !== id));
  };

  const filteredAttachments = attachments.filter(a => a.category === activeCategory);
  const counts = {
    CONTRACT: attachments.filter(a => a.category ==="CONTRACT").length,
    ADDENDUM: attachments.filter(a => a.category ==="ADDENDUM").length,
    CORRESPONDENCE: attachments.filter(a => a.category ==="CORRESPONDENCE").length,
    TECHNICAL: attachments.filter(a => a.category ==="TECHNICAL").length,
  };

  return (
    <div className={`rounded-lg border p-4 ${isDark ?"border-slate-700 bg-slate-800/30":"border-slate-200 bg-slate-50/50"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base"></span>
          <h3 className={`text-sm font-bold ${isDark ?"text-slate-100":"text-slate-900"}`}>
            Contract Attachments
          </h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isDark ?"bg-indigo-900/50 text-indigo-300":"bg-indigo-100 text-indigo-700"}`}>
            {attachments.length} files
          </span>
        </div>
      </div>

      <div className={`flex gap-1 rounded-lg border p-1 mb-3 text-xs ${
        isDark ?"border-slate-700 bg-slate-800":"border-slate-200 bg-white"}`}>
        {ATTACHMENT_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"onClick={() => setActiveCategory(cat.value as any)}
            className={`flex-1 rounded px-2 py-1.5 font-medium transition-all whitespace-nowrap ${
              activeCategory === cat.value
                ? (isDark
                    ?"bg-indigo-600 text-white shadow-md shadow-indigo-500/30 border border-indigo-500":"bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm")
                : (isDark
                    ?"text-slate-300 hover:text-slate-100 hover:bg-slate-700":"text-slate-600 hover:text-slate-900 hover:bg-slate-50")
            }`}
          >
            {cat.label} ({counts[cat.value]})
          </button>
        ))}
      </div>

      <div className="mb-3">
        <input
          ref={fileInputRef}
          type="file"multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"onChange={handleFileSelect}
          className="hidden"id="attachment-upload"/>
        <label
          htmlFor="attachment-upload"className={`flex items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed px-4 py-3 text-sm cursor-pointer transition-colors ${
            isDark
              ?"border-slate-600 bg-slate-800/50 text-slate-300 hover:border-indigo-500 hover:bg-slate-800":"border-slate-300 bg-white text-slate-600 hover:border-indigo-400 hover:bg-indigo-50/30"}`}
        >
          <span>📎</span>
          <span className="font-medium">
            Upload to <span className="text-indigo-500">{ATTACHMENT_CATEGORIES.find(c => c.value === activeCategory)?.label}</span>
          </span>
        </label>
      </div>

      {filteredAttachments.length === 0 ? (
        <div className={`text-center py-6 text-xs ${isDark ?"text-slate-500":"text-slate-400"}`}>
          No files in this category yet
        </div>
      ) : (
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {filteredAttachments.map((att) => (
            <div
              key={att.id}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                isDark ?"border-slate-700 bg-slate-800/50":"border-slate-200 bg-white"}`}
            >
              <span className="text-base">
                {att.name.toLowerCase().endsWith('.pdf') ?'📄':
                 att.name.toLowerCase().match(/\.(jpg|jpeg|png)$/) ?'🖼️':
                 att.name.toLowerCase().match(/\.(xls|xlsx)$/) ?'📊':'📝'}
              </span>
              <div className="flex-1 min-w-0">
                <div className={`font-medium truncate ${isDark ?"text-slate-200":"text-slate-800"}`}>
                  {att.name}
                </div>
                <div className={`text-[10px] ${isDark ?"text-slate-500":"text-slate-400"}`}>
                  {att.file_object ? `${(att.file_object.size / 1024).toFixed(1)} KB` :''}
                </div>
              </div>
              <button
                type="button"onClick={() => removeAttachment(att.id)}
                className="p-1 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded transition-colors"title="Remove">
                ️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


