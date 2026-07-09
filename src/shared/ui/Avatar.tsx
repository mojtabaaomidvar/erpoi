// src/shared/ui/Avatar.tsx

import { useState } from "react";
import { cn } from "../lib/cn";

export interface AvatarProps {
  name: string;
  src?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "away" | "busy";
  className?: string;
  gradient?: string;
  showTooltip?: boolean;
  bordered?: boolean;
}

export function Avatar({
  name,
  src,
  size = "md",
  status,
  className,
  gradient,
  showTooltip = true,
  bordered = false,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // 🔧 بهبود: استخراج هوشمند initials با regex
  const getInitials = (name: string): string => {
    if (!name || typeof name !== "string") return "?";

    // حذف کاراکترهای غیر الفبایی و split
    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    // گرفتن حرف اول کلمه اول و آخر
    const first = words[0][0] || "";
    const last = words[words.length - 1][0] || "";

    return (first + last).toUpperCase();
  };

  const initials = getInitials(name);

  const sizes = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
  };

  const statusSizes = {
    xs: "h-1.5 w-1.5",
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
    xl: "h-4 w-4",
  };

  const statusColors = {
    online: "bg-emerald-500",
    offline: "bg-slate-400",
    away: "bg-amber-500",
    busy: "bg-rose-500",
  };

  const shouldShowImage = src && !imageError;

  return (
    <div
      className="relative inline-flex group"
      title={showTooltip ? name : undefined}
    >
      {/* Avatar Container */}
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-semibold text-white overflow-hidden relative",
          !shouldShowImage &&
            (gradient ?? "bg-gradient-to-br from-indigo-500 to-violet-600"),
          bordered && "ring-2 ring-white dark:ring-slate-800",
          sizes[size],
          className,
        )}
        role="img"
        aria-label={name}
      >
        {/* تصویر واقعی */}
        {shouldShowImage && (
          <>
            {/* Placeholder gradient قبل از load */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-600 animate-pulse" />
            )}

            <img
              src={src}
              alt={name}
              className={cn(
                "h-full w-full object-cover transition-opacity duration-300",
                imageLoaded ? "opacity-100" : "opacity-0",
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        )}

        {/* Initials (fallback) */}
        {!shouldShowImage && <span className="relative z-10">{initials}</span>}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-full" />
      </div>

      {/* Status Indicator */}
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-slate-800 transition-all",
            statusSizes[size],
            statusColors[status],
            status === "online" && "animate-pulse",
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}
