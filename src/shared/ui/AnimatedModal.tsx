// src/shared/ui/AnimatedModal.tsx

import { useEffect, useState } from "react";
import { Modal } from "@design-system";

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string; // 🔧 FIX: required (نه optional)
  size?: "md" | "lg" | "xl"; // 🔧 FIX: فقط size های معتبر
  children: React.ReactNode;
}

export function AnimatedModal({
  isOpen,
  onClose,
  title,
  size = "md",
  children,
}: AnimatedModalProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop با blur */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`relative z-10 transition-all duration-300 ease-out ${
          isAnimating
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        <Modal isOpen={true} onClose={onClose} title={title} size={size}>
          {children}
        </Modal>
      </div>
    </div>
  );
}
