// src/shared/ui/FloatingSearch.tsx

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";

interface FloatingSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: string;
}

export function FloatingSearch({
  value,
  onChange,
  placeholder = "Search...",
  icon = "🔍",
}: FloatingSearchProps) {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync با value بیرونی
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // محاسبه موقعیت دکمه
  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
  }, []);

  // Auto focus هنگام باز شدن
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // باز شدن با hover
  const handleMouseEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    updatePosition();
    setIsOpen(true);
  }, [updatePosition]);

  // بسته شدن با تاخیر (اگر خالی باشد)
  const handleMouseLeave = useCallback(() => {
    if (!localValue.trim()) {
      closeTimeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 300);
    }
  }, [localValue]);

  // Debounce onChange
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        onChange(newValue);
      }, 300);
    },
    [onChange],
  );

  // ESC برای بستن
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!localValue.trim()) {
          setIsOpen(false);
        } else {
          setLocalValue("");
          onChange("");
        }
      }
    },
    [localValue, onChange],
  );

  const handleClear = () => {
    setLocalValue("");
    onChange("");
    inputRef.current?.focus();
  };

  const handleToggle = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    updatePosition();
    setIsOpen(!isOpen);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // 🔧 FIX: رندر باکس سرچ با Portal به body
  const renderDropdown = () => {
    if (!isOpen) return null;

    return createPortal(
      <div
        className="fixed z-[9999] transition-all duration-300"
        style={{
          top: `${position.top}px`,
          right: `${position.right}px`,
          width: "360px",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={`relative rounded-2xl shadow-2xl border backdrop-blur-xl overflow-hidden ${
            isDark
              ? "bg-slate-900/98 border-slate-700/70 shadow-black/70"
              : "bg-white/98 border-slate-200/80 shadow-slate-400/40"
          }`}
        >
          {/* Input */}
          <div className="relative p-4">
            <div
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 border transition-all ${
                isDark
                  ? "bg-slate-800/50 border-slate-700/50 focus-within:border-indigo-500/50 focus-within:bg-slate-800"
                  : "bg-slate-50/70 border-slate-200/70 focus-within:border-indigo-400 focus-within:bg-white"
              }`}
            >
              <span
                className={`text-xl ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                🔍
              </span>
              <input
                ref={inputRef}
                type="text"
                value={localValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={`flex-1 bg-transparent text-sm outline-none ${
                  isDark
                    ? "text-slate-100 placeholder-slate-500"
                    : "text-slate-900 placeholder-slate-400"
                }`}
              />
              {localValue && (
                <button
                  onClick={handleClear}
                  className={`p-1 rounded-lg transition-all ${
                    isDark
                      ? "text-slate-400 hover:text-rose-400 hover:bg-rose-900/30"
                      : "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                  }`}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>,
      document.body,
    );
  };

  const isActive = isOpen || !!localValue;

  return (
    <div className="relative inline-block">
      <div ref={buttonRef as any}>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleToggle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          title="Search"
          className={`relative transition-all hover:scale-110 ${
            isActive
              ? "shadow-md shadow-indigo-500/30"
              : "shadow-md shadow-slate-700/50"
          }`}
        >
          <span className="text-base">{icon}</span>
          {localValue && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse shadow-lg shadow-rose-500/50">
              !
            </span>
          )}
        </Button>
      </div>

      {renderDropdown()}
    </div>
  );
}
