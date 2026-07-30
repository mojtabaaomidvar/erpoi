//src/features/tpi-management/ui/components/GroupedEquipmentSelect.tsx

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@app/providers/ThemeProvider";
import type { DisciplineGroup } from "../../application/EquipmentApplicationService";
import type { EquipmentItem } from "../../repositories/EquipmentMasterDataRepository";

interface GroupedEquipmentSelectProps {
  value: string[];
  onChange: (values: string[]) => void;
  disciplineGroups: DisciplineGroup[];
  isLoading: boolean;
  error?: string;
}

export function GroupedEquipmentSelect({
  value,
  onChange,
  disciplineGroups,
  isLoading,
  error,
}: GroupedEquipmentSelectProps) {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // ✅ وضعیت expand/collapse برای دیسیپلین‌ها و دسته‌بندی‌ها
  const [expandedDisciplines, setExpandedDisciplines] = useState<
    Record<string, boolean>
  >({});
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ آیا چند دیسیپلین انتخاب شده؟
  const showDisciplineHeaders = disciplineGroups.length > 1;

  // مقداردهی اولیه: همه باز باشند
  useEffect(() => {
    if (disciplineGroups.length > 0) {
      setExpandedDisciplines((prev) => {
        const initial: Record<string, boolean> = {};
        disciplineGroups.forEach((dg) => {
          initial[dg.discipline] = prev[dg.discipline] ?? true;
        });
        return initial;
      });

      setExpandedCategories((prev) => {
        const initial: Record<string, boolean> = {};
        disciplineGroups.forEach((dg) => {
          dg.categories.forEach((cat) => {
            initial[cat.categoryId] = prev[cat.categoryId] ?? true;
          });
        });
        return initial;
      });
    }
  }, [disciplineGroups]);

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

  const toggleDiscipline = (discipline: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDisciplines((prev) => ({
      ...prev,
      [discipline]: !prev[discipline],
    }));
  };

  const toggleCategory = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // ✅ فیلتر کردن هوشمند بر اساس جستجو
  const filteredDisciplineGroups = useMemo(() => {
    if (!searchQuery.trim()) return disciplineGroups;

    const query = searchQuery.toLowerCase();
    return disciplineGroups
      .map((dg) => ({
        ...dg,
        categories: dg.categories
          .map((cat) => ({
            ...cat,
            items: cat.items.filter((item) =>
              item.name.toLowerCase().includes(query),
            ),
          }))
          .filter((cat) => cat.items.length > 0),
      }))
      .filter((dg) => dg.categories.length > 0);
  }, [disciplineGroups, searchQuery]);

  const handleSelect = (item: EquipmentItem) => {
    if (!value.includes(item.name)) {
      onChange([...value, item.name]);
    }
    setSearchQuery("");
  };

  const handleRemove = (itemToRemove: string) => {
    onChange(value.filter((v) => v !== itemToRemove));
  };

  return (
    <div className="relative" ref={wrapperRef}>
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
            value.length === 0 ? "Search equipment name..." : "Add more..."
          }
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
        />
      </div>

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
              <div className="p-6 text-center text-xs text-slate-500 animate-pulse">
                Loading equipment hierarchy...
              </div>
            ) : filteredDisciplineGroups.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                {searchQuery
                  ? `No match found for "${searchQuery}"`
                  : "No items available"}
              </div>
            ) : (
              filteredDisciplineGroups.map((dg) => {
                const isDisciplineExpanded =
                  expandedDisciplines[dg.discipline] !== false;

                return (
                  <div key={dg.discipline}>
                    {/* ✅ هدر دیسیپلین (فقط اگر چند دیسیپلین باشد) */}
                    {showDisciplineHeaders && (
                      <div
                        onClick={(e) => toggleDiscipline(dg.discipline, e)}
                        className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-between cursor-pointer select-none transition-colors border-b-2 ${
                          isDark
                            ? "bg-indigo-900/40 text-indigo-200 border-indigo-700 hover:bg-indigo-900/60"
                            : "bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <svg
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isDisciplineExpanded ? "rotate-90" : "rotate-0"
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                          🔧 {dg.discipline}
                        </span>
                        <span
                          className={`text-[10px] font-normal px-2 py-0.5 rounded ${
                            isDark
                              ? "bg-indigo-800 text-indigo-300"
                              : "bg-indigo-200 text-indigo-700"
                          }`}
                        >
                          {dg.categories.reduce(
                            (sum, cat) => sum + cat.items.length,
                            0,
                          )}{" "}
                          items
                        </span>
                      </div>
                    )}

                    {/* ✅ دسته‌بندی‌های داخل دیسیپلین */}
                    {isDisciplineExpanded && (
                      <div>
                        {dg.categories.map((cat) => {
                          const isCategoryExpanded =
                            expandedCategories[cat.categoryId] !== false;

                          return (
                            <div
                              key={cat.categoryId}
                              className="border-b border-slate-200 dark:border-slate-700 last:border-0"
                            >
                              {/* هدر دسته‌بندی */}
                              <div
                                onClick={(e) =>
                                  toggleCategory(cat.categoryId, e)
                                }
                                className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between cursor-pointer select-none transition-colors ${
                                  isDark
                                    ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <svg
                                    className={`w-3 h-3 transition-transform duration-200 ${
                                      isCategoryExpanded
                                        ? "rotate-90"
                                        : "rotate-0"
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                  {cat.categoryName}
                                </span>
                                <span
                                  className={`text-[10px] font-normal px-1.5 py-0.5 rounded ${
                                    isDark
                                      ? "bg-slate-800 text-slate-400"
                                      : "bg-slate-200 text-slate-500"
                                  }`}
                                >
                                  {cat.items.length}
                                </span>
                              </div>

                              {/* آیتم‌ها */}
                              {isCategoryExpanded && (
                                <div>
                                  {cat.items.map((item) => {
                                    const isSelected = value.includes(
                                      item.name,
                                    );
                                    return (
                                      <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleSelect(item)}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                                          isSelected
                                            ? isDark
                                              ? "bg-indigo-900/30 text-indigo-300"
                                              : "bg-indigo-50 text-indigo-700"
                                            : isDark
                                              ? "hover:bg-slate-700 text-slate-200"
                                              : "hover:bg-indigo-50 text-slate-700"
                                        }`}
                                      >
                                        <span className="font-medium flex-1">
                                          {item.name}
                                        </span>
                                        {isSelected && (
                                          <span className="text-indigo-500 text-xs font-bold">
                                            ✓
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
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
