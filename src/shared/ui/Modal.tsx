// src/shared/ui/Modal.tsx

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";
import { useTheme } from "@app/providers/ThemeProvider";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  headerClassName?: string;
  contentClassName?: string;
  footer?: React.ReactNode; // 🔧 فقط از این استفاده می‌کنیم
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  headerClassName,
  contentClassName,
  footer, // 🔧 footer prop
  ariaLabel,
  ariaDescribedBy,
}: ModalProps) {
  const { isDark } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      previousActiveElement.current = document.activeElement;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
        if (previousActiveElement.current instanceof HTMLElement) {
          previousActiveElement.current.focus();
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  useEffect(() => {
    if (!isOpen || !modalRef.current) return;
    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (firstElement) {
      setTimeout(() => firstElement.focus(), 100);
    }
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };
    modal.addEventListener("keydown", handleTab);
    return () => modal.removeEventListener("keydown", handleTab);
  }, [isOpen, shouldRender]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnBackdrop && e.target === e.currentTarget) {
        onClose();
      }
    },
    [closeOnBackdrop, onClose],
  );

  if (!shouldRender) return null;

  const responsiveSizes: Record<ModalSize, string> = {
    sm: "w-full sm:max-w-sm",
    md: "w-full sm:max-w-2xl",
    lg: "w-full sm:max-w-4xl",
    xl: "w-full sm:max-w-6xl",
    "2xl": "w-full sm:max-w-7xl",
    full: "w-full mx-4",
  };

  const modalContent = (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300",
        isAnimating ? "opacity-100" : "opacity-0",
      )}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabel || "modal-title"}
      aria-describedby={ariaDescribedBy}
    >
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-300",
          isAnimating ? "opacity-100" : "opacity-0",
          isDark ? "bg-slate-950/80" : "bg-slate-900/50",
          "backdrop-blur-sm",
        )}
      />

      <div
        ref={modalRef}
        className={cn(
          "relative w-full max-h-[90vh] flex flex-col rounded-2xl shadow-2xl transition-all duration-300 ease-out overflow-hidden",
          responsiveSizes[size],
          isAnimating
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4",
          isDark
            ? "bg-slate-900 border border-slate-700/50 shadow-black/50"
            : "bg-white border border-slate-200 shadow-slate-500/20",
        )}
      >
        {/* 🔧 Header - ثابت بالا */}
        <div
          className={cn(
            "flex-shrink-0 flex items-center justify-between px-6 py-4 border-b",
            isDark
              ? "border-slate-700/50 bg-slate-900"
              : "border-slate-100 bg-white",
            headerClassName,
          )}
        >
          <h3
            id="modal-title"
            className={cn(
              "text-lg font-semibold truncate pr-4",
              isDark ? "text-slate-100" : "text-slate-900",
            )}
          >
            {title}
          </h3>

          {showCloseButton && (
            <button
              onClick={onClose}
              aria-label="Close modal"
              className={cn(
                "rounded-lg p-2 transition-all hover:scale-110 focus:outline-none focus:ring-2",
                isDark
                  ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200 focus:ring-slate-600"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:ring-slate-300",
              )}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* 🔧 Content - Scrollable وسط */}
        <div
          className={cn("flex-1 overflow-y-auto min-h-0 p-6", contentClassName)}
        >
          {children}
        </div>

        {/* 🔧 Footer - ثابت پایین */}
        {footer && (
          <div
            className={cn(
              "flex-shrink-0 px-6 py-4 border-t",
              isDark
                ? "border-slate-700/50 bg-slate-900"
                : "border-slate-100 bg-white",
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
