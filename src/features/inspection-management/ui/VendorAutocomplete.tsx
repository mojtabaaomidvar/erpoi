// src/features/inspection-management/ui/VendorAutocomplete.tsx

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { vendorAppService } from "../application/VendorApplicationService";
import type { Vendor } from "@features/inspection-management/domain/types";

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
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Vendor[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // بارگذاری همه vendors در ابتدا
  useEffect(() => {
    vendorAppService
      .getAll()
      .then((vendors: Vendor[]) => {
        setAllVendors(vendors);
      })
      .catch((err: any) => {
        console.error("Failed to load vendors:", err);
      });
  }, []);

  // بارگذاری نام vendor فعلی
  useEffect(() => {
    if (value) {
      const vendor = allVendors.find((v) => v.id === value);
      if (vendor) setInputValue(vendor.name);
    } else {
      setInputValue("");
    }
  }, [value, allVendors]);

  // جستجو هنگام تایپ
  useEffect(() => {
    if (inputValue.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(true);
      const filtered = allVendors.filter((v) =>
        v.name.toLowerCase().includes(inputValue.toLowerCase()),
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, allVendors]);

  // بستن dropdown هنگام کلیک بیرون
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (vendor: Vendor) => {
    setInputValue(vendor.name);
    onChange(vendor.id); // 🔧 فقط ID را پاس می‌دهیم
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (!newValue.trim()) {
      onChange(""); // 🔧 اگر خالی شد، vendor_id را پاک کن
    } else {
      // اگر دقیقاً یکی از vendorهای موجود بود، انتخابش کن
      const exactMatch = allVendors.find(
        (v) => v.name.toLowerCase() === newValue.toLowerCase(),
      );
      if (exactMatch) {
        onChange(exactMatch.id);
      } else {
        // اگر جدید است، فعلاً خالی بگذار تا در handleSubmit ساخته شود
        onChange("");
      }
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() =>
          inputValue.length >= 2 && setShowSuggestions(suggestions.length > 0)
        }
        className={`w-full rounded-lg px-3 py-2.5 text-sm input-themed ${error ? "border-rose-500" : ""}`}
        placeholder="Type vendor name..."
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          ⏳
        </div>
      )}
      {showSuggestions && (
        <div
          className={`absolute z-50 w-full mt-1 rounded-lg border shadow-lg max-h-48 overflow-y-auto ${
            isDark
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >
          {suggestions.map((vendor) => (
            <button
              key={vendor.id}
              type="button"
              onClick={() => handleSelect(vendor)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                isDark
                  ? "hover:bg-slate-700 text-slate-200"
                  : "hover:bg-slate-100 text-slate-700"
              }`}
            >
              {vendor.name}
            </button>
          ))}
          {/* گزینه ایجاد vendor جدید */}
          <button
            type="button"
            onClick={() => {
              // ایجاد vendor جدید
              vendorAppService
                .create({ name: inputValue })
                .then((newVendor) => {
                  setAllVendors([...allVendors, newVendor]);
                  handleSelect(newVendor);
                })
                .catch((err) => {
                  console.error("Failed to create vendor:", err);
                });
            }}
            className={`w-full text-left px-3 py-2 text-sm border-t ${
              isDark
                ? "border-slate-700 hover:bg-indigo-900/30 text-indigo-300"
                : "border-slate-200 hover:bg-indigo-50 text-indigo-600"
            }`}
          >
            ➕ Create new vendor: "{inputValue}"
          </button>
        </div>
      )}
      {error && <p className="text-[11px] text-rose-600 mt-1">✕ {error}</p>}
    </div>
  );
}
