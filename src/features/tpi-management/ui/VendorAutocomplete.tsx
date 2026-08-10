// src/features/inspection-management/ui/VendorAutocomplete.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@app/providers/ThemeProvider";
import { vendorAppService } from "../application/VendorApplicationService";
import { showToast } from "@shared/ui/ToastContainer";
import type { Vendor } from "../domain/types";

interface VendorAutocompleteProps {
  value: string;
  onChange: (vendorId: string) => void;
  error?: string;
  /** Called with the full Vendor object when one is selected or created */
  onSelectVendor?: (vendor: Vendor) => void;
}

export function VendorAutocomplete({
  value,
  onChange,
  error,
  onSelectVendor,
}: VendorAutocompleteProps) {
  const { isDark } = useTheme();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadVendors = async () => {
      try {
        const data = await vendorAppService.getAll();
        setVendors(data || []);
      } catch (err: any) {
        showToast("error", "Load Failed", err.message);
      }
    };
    loadVendors();
  }, []);

  useEffect(() => {
    if (value) {
      const selected = vendors.find((v) => v.id === value);
      if (selected) setSearchTerm(selected.name);
    } else if (!isOpen) {
      setSearchTerm("");
    }
  }, [value, vendors, isOpen]);

  useEffect(() => {
    if (isOpen && wrapperRef.current) {
      const updatePosition = () => {
        const rect = wrapperRef.current!.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      };
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const isOutsideWrapper =
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node);
      const isOutsideDropdown =
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node);

      if (isOutsideWrapper && isOutsideDropdown) {
        setIsOpen(false);
        if (!value) setSearchTerm("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const selectedVendor = vendors.find((v) => v.id === value);
  const displayValue = selectedVendor ? selectedVendor.name : searchTerm;

  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const shouldShowCreateOption =
    searchTerm.trim().length >= 2 &&
    !vendors.some(
      (v) => v.name.toLowerCase() === searchTerm.trim().toLowerCase(),
    );

  const handleSelect = useCallback(
    (vendor: Vendor) => {
      onChange(vendor.id);
      onSelectVendor?.(vendor);
      setSearchTerm(vendor.name);
      setIsOpen(false);
    },
    [onChange, onSelectVendor],
  );

  const handleCreateNew = useCallback(async () => {
    if (!searchTerm.trim()) return;
    setIsCreating(true);
    try {
      const newVendor = await vendorAppService.create({
        name: searchTerm.trim(),
      });
      setVendors((prev) => [...prev, newVendor]);
      onChange(newVendor.id);
      onSelectVendor?.(newVendor);
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
  }, [searchTerm, onChange, onSelectVendor]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    if (!e.target.value.trim()) onChange("");
  };

  // ✅ تابع پاک کردن مقدار
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onChange("");
      setSearchTerm("");
      setIsOpen(false);
    },
    [onChange],
  );

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className={`fixed z-[9999] max-h-60 overflow-y-auto rounded-lg border shadow-2xl ${
        isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
      }`}
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
      }}
    >
      {shouldShowCreateOption && (
        <button
          type="button"
          onClick={handleCreateNew}
          disabled={isCreating}
          className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors border-b ${
            isDark
              ? "bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50 border-slate-700"
              : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-slate-200"
          }`}
        >
          <span className="text-base"></span>
          <span>
            Create new vendor: <strong>"{searchTerm.trim()}"</strong>
          </span>
        </button>
      )}

      {filteredVendors.length > 0
        ? filteredVendors.map((vendor) => (
            <button
              key={vendor.id}
              type="button"
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
        : !shouldShowCreateOption &&
          searchTerm.trim().length >= 2 && (
            <div
              className={`px-4 py-3 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              No matching vendors found.
            </div>
          )}

      {searchTerm.trim().length > 0 && searchTerm.trim().length < 2 && (
        <div
          className={`px-4 py-3 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          Type at least 2 characters...
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="relative w-full" ref={wrapperRef}>
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
            if (selectedVendor) setSearchTerm(selectedVendor.name);
          }}
          placeholder="Type to search or create new vendor..."
          className={`w-full rounded-lg px-3 py-2.5 text-sm input-themed transition-colors ${
            error ? "border-rose-500 ring-1 ring-rose-500 bg-rose-50/10" : ""
          } ${value ? "pl-8" : ""}`} // ✅ فضای خالی برای دکمه clear
        />

        {/* ✅ دکمه پاک کردن - فقط وقتی مقداری انتخاب شده */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className={`absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full transition-colors ${
              isDark
                ? "text-slate-400 hover:text-rose-400 hover:bg-slate-700"
                : "text-slate-400 hover:text-rose-600 hover:bg-slate-100"
            }`}
            title="Clear selection"
          >
            <span className="text-xs">✕</span>
          </button>
        )}

        {/* فلش dropdown - فقط وقتی مقداری انتخاب نشده */}
        {!value && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {isCreating ? (
              <span className="animate-spin text-xs">⏳</span>
            ) : (
              <span className="text-xs">▼</span>
            )}
          </div>
        )}

        {error && (
          <p className="text-[11px] text-rose-600 mt-1.5 flex items-center gap-1">
            ✕ {error}
          </p>
        )}
      </div>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(dropdownContent, document.body)}
    </>
  );
}
