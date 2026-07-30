//src/features/tpi-management/ui/components/EquipmentFreeSearch.tsx

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@app/providers/ThemeProvider";
import { equipmentAppService } from "../../application/EquipmentApplicationService";
import { showToast } from "@shared/ui/ToastContainer";
import type { EquipmentItem } from "../../repositories/EquipmentMasterDataRepository";

interface EquipmentFreeSearchProps {
  value: string[];
  onChange: (values: string[], detectedDiscipline?: string) => void;
  error?: string;
}

export function EquipmentFreeSearch({
  value,
  onChange,
  error,
}: EquipmentFreeSearchProps) {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<EquipmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  // محاسبه موقعیت دراپ‌داون
  useEffect(() => {
    if (isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen]);

  // بستن با کلیک بیرون
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleResize = () => setIsOpen(false);

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Debounced Search — سرور-ساید
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (searchQuery.trim().length >= 2) {
      debounceTimer.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const data = await equipmentAppService.searchAllEquipment(
            searchQuery.trim(),
          );
          setResults(data);
        } catch (err: any) {
          showToast("error", "Search Failed", err.message);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else {
      setResults([]);
    }

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery]);

  const handleSelect = (item: EquipmentItem) => {
    if (!value.includes(item.name)) {
      // ✅ ارسال نام آیتم + دیسیپلین مرتبط
      onChange([...value, item.name], item.discipline);
    }
    setSearchQuery("");
    setResults([]);
  };

  const handleRemove = (itemToRemove: string) => {
    onChange(value.filter((v) => v !== itemToRemove));
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {/* باکس اصلی */}
      <div
        className={`w-full min-h-[42px] rounded-lg border px-3 py-2 flex flex-wrap gap-2 transition-colors cursor-text ${
          error
            ? "border-rose-500 ring-1 ring-rose-500"
            : isDark
              ? "border-slate-600 bg-slate-800 focus-within:border-indigo-500"
              : "border-slate-300 bg-white focus-within:border-indigo-500"
        }`}
        onClick={() => setIsOpen(true)}
      >
        {value.map((item) => (
          <span
            key={item}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
              isDark
                ? "bg-indigo-900/50 text-indigo-200"
                : "bg-indigo-50 text-indigo-700"
            }`}
          >
            {item}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(item);
              }}
              className="hover:text-rose-500 transition-colors"
            >
              ✕
            </button>
          </span>
        ))}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={
            value.length === 0
              ? "Type to search all equipment..."
              : "Add more..."
          }
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
        />
      </div>

      {/* دراپ‌داون با Portal */}
      {isOpen &&
        dropdownPosition &&
        createPortal(
          <div
            ref={dropdownRef}
            className={`rounded-lg border shadow-2xl ${
              isDark
                ? "bg-slate-800 border-slate-700"
                : "bg-white border-slate-200"
            }`}
            style={{
              position: "fixed",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              maxHeight: "300px",
              overflowY: "auto",
              overflowX: "hidden",
              zIndex: 9999,
            }}
          >
            {isLoading ? (
              <div className="p-4 text-center text-xs text-slate-500 animate-pulse">
                Searching...
              </div>
            ) : searchQuery.trim().length < 2 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                Type at least 2 characters to search
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No equipment found for "{searchQuery}"
              </div>
            ) : (
              results.map((item) => {
                const isSelected = value.includes(item.name);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between gap-3 ${
                      isSelected
                        ? isDark
                          ? "bg-indigo-900/30 text-indigo-300"
                          : "bg-indigo-50 text-indigo-700"
                        : isDark
                          ? "hover:bg-slate-700 text-slate-200"
                          : "hover:bg-indigo-50 text-slate-700"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium block truncate">
                        {item.name}
                      </span>
                      {/* ✅ نمایش دیسیپلین به عنوان hint کوچک */}
                      <span
                        className={`text-[10px] ${
                          isDark ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        {item.discipline}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="text-indigo-500 text-xs font-bold shrink-0">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>,
          document.body,
        )}

      {error && <p className="text-[11px] text-rose-600 mt-1.5">✕ {error}</p>}
    </div>
  );
}
