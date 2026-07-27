// src/features/inspection-management/ui/VendorAutocomplete.tsx
import { useState, useEffect, useRef } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { vendorAppService } from "../application/VendorApplicationService";
import { showToast } from "@shared/ui/ToastContainer";
import type { Vendor } from "../domain/types";

interface VendorAutocompleteProps {
  value: string;
  onChange: (vendorId: string) => void;
  error?: string;
}

export function VendorAutocomplete({
  value,
  onChange,
  error,
}: VendorAutocompleteProps) {
  const { isDark } = useTheme();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // بارگذاری اولیه وندورها
  useEffect(() => {
    const loadVendors = async () => {
      try {
        const data = await vendorAppService.getAll();
        setVendors(data);
      } catch (err: any) {
        showToast("error", "Load Failed", err.message);
      }
    };
    loadVendors();
  }, []);

  // بستن دراپ‌داون با کلیک بیرون از آن
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // پیدا کردن نام وندور انتخاب‌شده برای نمایش در اینپوت
  const selectedVendor = vendors.find((v) => v.id === value);
  const displayValue = selectedVendor ? selectedVendor.name : searchTerm;

  // فیلتر کردن وندورها بر اساس جستجو
  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ✅ منطق کلیدی: آیا باید گزینه "ایجاد جدید" را نشان دهیم؟
  // شرط: حداقل ۲ کاراکتر تایپ شده باشد و دقیقاً همین نام از قبل وجود نداشته باشد
  const shouldShowCreateOption =
    searchTerm.trim().length >= 2 &&
    !vendors.some(
      (v) => v.name.toLowerCase() === searchTerm.trim().toLowerCase(),
    );

  const handleSelect = (vendor: Vendor) => {
    onChange(vendor.id);
    setSearchTerm(vendor.name);
    setIsOpen(false);
  };

  const handleCreateNew = async () => {
    if (!searchTerm.trim()) return;
    setIsCreating(true);
    try {
      const newVendor = await vendorAppService.create({
        name: searchTerm.trim(),
      });

      setVendors((prev) => [...prev, newVendor]);
      onChange(newVendor.id);
      setSearchTerm(newVendor.name);
      setIsOpen(false);
      showToast(
        "success",
        "Created",
        `Vendor "${newVendor.name}" created successfully`,
      );
    } catch (err: any) {
      showToast("error", "Create Failed", err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);

    // اگر کاربر متن را پاک کرد، مقدار انتخاب‌شده هم پاک شود
    if (!newValue.trim()) {
      onChange("");
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onFocus={() => {
          setIsOpen(true);
          if (selectedVendor) setSearchTerm(selectedVendor.name);
        }}
        placeholder="Type to search or create new vendor..."
        className={`w-full rounded-lg px-3 py-2.5 text-sm input-themed ${
          error ? "border-rose-500" : ""
        }`}
      />

      {/* آیکون لودینگ یا فلش */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
        {isCreating ? (
          <span className="animate-spin text-xs">⏳</span>
        ) : (
          <span className="text-xs">▼</span>
        )}
      </div>

      {/* دراپ‌داون نتایج */}
      {isOpen && (
        <div
          className={`absolute z-50 w-full mt-1 rounded-lg border shadow-lg max-h-60 overflow-y-auto ${
            isDark
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >
          {/* ✅ گزینه ایجاد جدید (همیشه وقتی شرط برقرار باشد نمایش داده می‌شود) */}
          {shouldShowCreateOption && (
            <button
              onClick={handleCreateNew}
              disabled={isCreating}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                isDark
                  ? "bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50"
                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              }`}
            >
              <span className="text-base">➕</span>
              <span>
                Create new vendor: <strong>"{searchTerm.trim()}"</strong>
              </span>
            </button>
          )}

          {/* لیست وندورهای فیلترشده */}
          {filteredVendors.length > 0
            ? filteredVendors.map((vendor) => (
                <button
                  key={vendor.id}
                  onClick={() => handleSelect(vendor)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    isDark
                      ? "text-slate-200 hover:bg-slate-700"
                      : "text-slate-700 hover:bg-slate-100"
                  } ${vendor.id === value ? (isDark ? "bg-slate-700 font-semibold" : "bg-slate-100 font-semibold") : ""}`}
                >
                  {vendor.name}
                </button>
              ))
            : // اگر هیچ وندوری شبیه نبود و گزینه ایجاد جدید هم به هر دلیلی نمایش داده نشد
              !shouldShowCreateOption &&
              searchTerm.trim().length >= 2 && (
                <div
                  className={`px-4 py-3 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  No matching vendors found.
                </div>
              )}

          {/* پیام راهنما برای زمانی که کمتر از ۲ کاراکتر تایپ شده */}
          {searchTerm.trim().length > 0 && searchTerm.trim().length < 2 && (
            <div
              className={`px-4 py-3 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Type at least 2 characters...
            </div>
          )}
        </div>
      )}

      {error && <p className="text-[11px] text-rose-600 mt-1">✕ {error}</p>}
    </div>
  );
}
