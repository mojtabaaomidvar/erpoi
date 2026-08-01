// src/shared/ui/Modal.tsx

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";
import { useTheme } from "@app/providers/ThemeProvider";

export type ModalSize =
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "7xl"
  | "full";

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
  footer?: React.ReactNode;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  /** نمایش دکمهٔ تمام‌صفحه/بازگشت در کنار دکمهٔ بستن. سایز اولیه دست‌نخورده می‌ماند و کاربر خودش تغییر می‌دهد. */
  allowFullscreenToggle?: boolean;
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
  footer,
  ariaLabel,
  ariaDescribedBy,
  allowFullscreenToggle = false,
}: ModalProps) {
  const { isDark } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(size === "full");
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // اگر prop سایز از بیرون تغییر کند، حالت تمام‌صفحهٔ داخلی هم همگام می‌شود
  useEffect(() => {
    setIsFullscreen(size === "full");
  }, [size]);

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

  const responsiveSizes: Record<Exclude<ModalSize, "full">, string> = {
    sm: "w-full sm:max-w-sm",
    md: "w-full sm:max-w-2xl",
    lg: "w-full sm:max-w-4xl",
    xl: "w-full sm:max-w-6xl",
    "2xl": "w-full sm:max-w-7xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "7xl": "max-w-7xl",
  };

  const modalContent = (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center transition-all duration-300",
        isFullscreen ? "p-0" : "p-4",
        isAnimating ? "opacity-100" : "opacity-0",
      )}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      {...(ariaLabel
        ? { "aria-label": ariaLabel }
        : { "aria-labelledby": "modal-title" })}
      aria-describedby={ariaDescribedBy}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-300",
          isAnimating ? "opacity-100" : "opacity-0",
          isDark ? "bg-slate-950/85" : "bg-slate-900/40",
          "backdrop-blur-md",
        )}
      />

      {/* Panel */}
      <div
        ref={modalRef}
        className={cn(
          "relative flex flex-col overflow-hidden transition-all duration-300 ease-out will-change-transform",
          isFullscreen
            ? "w-screen h-[100dvh] max-w-none max-h-none rounded-none"
            : cn(
                "w-full max-h-[90vh] rounded-2xl",
                responsiveSizes[size as Exclude<ModalSize, "full">] ??
                  responsiveSizes.md,
              ),
          isAnimating
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-[0.97] translate-y-3",
          isDark
            ? "bg-slate-900 ring-1 ring-white/10"
            : "bg-white ring-1 ring-slate-900/5",
          !isFullscreen &&
            (isDark
              ? "shadow-[0_24px_70px_-15px_rgba(0,0,0,0.65)]"
              : "shadow-[0_24px_60px_-15px_rgba(15,23,42,0.25)]"),
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "relative flex-shrink-0 flex items-center justify-between gap-4 px-6 py-4",
            isDark ? "bg-slate-900" : "bg-white",
            headerClassName,
          )}
        >
          <h3
            id="modal-title"
            className={cn(
              "text-base sm:text-lg font-semibold tracking-tight truncate",
              isDark ? "text-slate-100" : "text-slate-900",
            )}
          >
            {title}
          </h3>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {allowFullscreenToggle && (
              <button
                onClick={() => setIsFullscreen((v) => !v)}
                aria-label={
                  isFullscreen ? "خروج از حالت تمام‌صفحه" : "نمایش تمام‌صفحه"
                }
                title={
                  isFullscreen ? "خروج از حالت تمام‌صفحه" : "نمایش تمام‌صفحه"
                }
                className={cn(
                  "rounded-lg p-2 transition-colors focus:outline-none focus-visible:ring-2",
                  isDark
                    ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200 focus-visible:ring-slate-600"
                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:ring-slate-300",
                )}
              >
                {isFullscreen ? (
                  <svg
                    className="w-[18px] h-[18px]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9h4.5M15 9V4.5M15 9l5.25-5.25M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-[18px] h-[18px]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.25 3.75H4.5a.75.75 0 00-.75.75v3.75m16.5 0V4.5a.75.75 0 00-.75-.75h-3.75m0 16.5h3.75a.75.75 0 00.75-.75v-3.75m-16.5 0v3.75c0 .414.336.75.75.75h3.75"
                    />
                  </svg>
                )}
              </button>
            )}

            {showCloseButton && (
              <button
                onClick={onClose}
                aria-label="بستن"
                title="بستن"
                className={cn(
                  "rounded-lg p-2 transition-colors focus:outline-none focus-visible:ring-2",
                  isDark
                    ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200 focus-visible:ring-slate-600"
                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:ring-slate-300",
                )}
              >
                <svg
                  className="w-[18px] h-[18px]"
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

          {/* خط ظریف تفکیک‌کننده به‌جای بوردر یکنواخت */}
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 h-px",
              isDark ? "bg-slate-700/50" : "bg-slate-200/70",
            )}
          />
        </div>

        {/* Content */}
        <div
          className={cn("flex-1 overflow-y-auto min-h-0 p-6", contentClassName)}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className={cn(
              "sticky bottom-0 z-20 flex-shrink-0 px-6 py-3.5",
              isDark ? "bg-slate-900" : "bg-white",
            )}
          >
            <div
              className={cn(
                "absolute inset-x-0 top-0 h-px",
                isDark ? "bg-slate-700/50" : "bg-slate-200/70",
              )}
            />
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
