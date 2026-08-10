// src/features/inspection-management/ui/details/InspectionPhotosGallery.tsx

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import type { InspectionPhoto } from "../../repositories/InspectionPhotoRepository";
import { checklistAppService } from "../../application/ChecklistApplicationService";

interface InspectionPhotosGalleryProps {
  requestId: string;
  equipmentId?: string[];
  checklistItemId?: string;
  title?: string;
  maxItems?: number;
  showTitle?: boolean;
  className?: string;
}

export function InspectionPhotosGallery({
  requestId,
  equipmentId,
  checklistItemId,
  title = "📸 Inspection Photos",
  maxItems,
  showTitle = true,
  className = "",
}: InspectionPhotosGalleryProps) {
  const { isDark } = useTheme();
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const equipmentKey = equipmentId?.join(",") || "";

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: InspectionPhoto[] = [];

      if (checklistItemId) {
        data =
          await checklistAppService.getPhotosByChecklistItem(checklistItemId);
      } else if (requestId) {
        data = await checklistAppService.getPhotosByRequestId(requestId);

        // Filter by equipment if provided
        if (equipmentKey) {
          const ids = equipmentKey.split(",");
          data = data.filter((p) => ids.includes(p.equipment_id));
        }
      }

      // Sort by created_at descending (newest first)
      data.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      setPhotos(data);
    } catch (err: any) {
      console.error("Failed to load photos:", err);
      setError(err.message || "Failed to load photos");
    } finally {
      setLoading(false);
    }
  }, [checklistItemId, requestId, equipmentKey]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos, equipmentKey]);

  const displayedPhotos = useMemo(() => {
    if (maxItems && maxItems > 0) {
      return photos.slice(0, maxItems);
    }
    return photos;
  }, [photos, maxItems]);

  const hasMore = maxItems && maxItems > 0 && photos.length > maxItems;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "PASS":
        return {
          border: "border-emerald-500",
          bg: isDark ? "bg-emerald-900/30" : "bg-emerald-50",
          badge: isDark ? "bg-emerald-600" : "bg-emerald-500",
          text: isDark ? "text-emerald-300" : "text-emerald-700",
        };
      case "REJECT":
        return {
          border: "border-red-500",
          bg: isDark ? "bg-red-900/30" : "bg-red-50",
          badge: isDark ? "bg-red-600" : "bg-red-500",
          text: isDark ? "text-red-300" : "text-red-700",
        };
      case "NOTE":
        return {
          border: "border-blue-500",
          bg: isDark ? "bg-blue-900/30" : "bg-blue-50",
          badge: isDark ? "bg-blue-600" : "bg-blue-500",
          text: isDark ? "text-blue-300" : "text-blue-700",
        };
      default:
        return {
          border: "border-slate-300",
          bg: isDark ? "bg-slate-800/50" : "bg-slate-50",
          badge: isDark ? "bg-slate-600" : "bg-slate-500",
          text: isDark ? "text-slate-400" : "text-slate-600",
        };
    }
  };

  if (loading) {
    return (
      <div
        className={`p-4 rounded-xl border animate-pulse ${isDark ? "bg-slate-800/30 border-slate-700" : "bg-slate-50 border-slate-200"} ${className}`}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-500">
            Loading photos...
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-slate-200 dark:bg-slate-700"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`p-4 rounded-xl border ${isDark ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200"} ${className}`}
      >
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <span>⚠️</span>
          <span className="text-sm font-medium">Failed to load photos</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
        <button
          onClick={fetchPhotos}
          className="mt-2 text-xs text-indigo-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div
        className={`p-6 rounded-xl border text-center ${isDark ? "bg-slate-800/30 border-slate-700" : "bg-slate-50 border-slate-200"} ${className}`}
      >
        <div className="text-4xl mb-2">📷</div>
        <p
          className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
        >
          No photos uploaded yet
        </p>
        <p
          className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}
        >
          Photos will appear here after uploading from the checklist modal.
        </p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`text-lg font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
          >
            {title}
          </h3>
          <span
            className={`text-xs px-2 py-1 rounded-full ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-700"}`}
          >
            {photos.length} photo{photos.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {displayedPhotos.map((photo) => {
          const statusStyle = getStatusStyle(photo.status);
          return (
            <div
              key={photo.id}
              className={`relative group aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:shadow-lg ${statusStyle.border} ${statusStyle.bg}`}
            >
              <img
                src={photo.file_path}
                alt={photo.file_name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />

              {/* Status Badge */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between p-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusStyle.badge} text-white`}
                >
                  {photo.status}
                </span>
                <span className={`text-[10px] ${statusStyle.text} font-medium`}>
                  {new Date(photo.created_at).toLocaleDateString("fa-IR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {/* Overlay with details on hover */}
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3">
                <p className="text-white text-xs font-medium truncate w-full text-center">
                  {photo.file_name}
                </p>
                {photo.description && (
                  <p className="text-white/80 text-[10px] truncate w-full text-center">
                    {photo.description}
                  </p>
                )}
                <div className="flex gap-2">
                  <a
                    href={photo.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/90 hover:text-white text-sm"
                    title="Open in new tab"
                  >
                    🔍
                  </a>
                  <a
                    href={photo.file_path}
                    download
                    className="text-white/90 hover:text-white text-sm"
                    title="Download"
                  >
                    ⬇️
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="mt-4 text-center">
          <span
            className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            And {photos.length - maxItems} more photo
            {photos.length - maxItems !== 1 ? "s" : ""}...
          </span>
        </div>
      )}
    </div>
  );
}

// Compact version for inline display in checklist items
export function InlineInspectionPhotos({
  photos,
  maxVisible = 3,
  className = "",
}: {
  photos: InspectionPhoto[];
  maxVisible?: number;
  className?: string;
}) {
  const { isDark } = useTheme();

  if (!photos || photos.length === 0) return null;

  const visiblePhotos = photos.slice(0, maxVisible);
  const remaining = photos.length - maxVisible;

  return (
    <div className={`flex flex-wrap gap-1.5 mt-1 ${className}`}>
      {visiblePhotos.map((photo) => {
        const statusStyle = (() => {
          switch (photo.status) {
            case "PASS":
              return isDark ? "border-emerald-500" : "border-emerald-500";
            case "REJECT":
              return isDark ? "border-red-500" : "border-red-500";
            case "NOTE":
              return isDark ? "border-blue-500" : "border-blue-500";
            default:
              return isDark ? "border-slate-500" : "border-slate-300";
          }
        })();

        return (
          <a
            key={photo.id}
            href={photo.file_path}
            target="_blank"
            rel="noopener noreferrer"
            className={`relative group w-12 h-12 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${statusStyle} ${isDark ? "hover:opacity-80" : "hover:opacity-75"}`}
            title={`${photo.status} - ${photo.file_name}`}
          >
            <img
              src={photo.file_path}
              alt={photo.file_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 text-[8px] truncate text-white">
              {photo.status}
            </div>
          </a>
        );
      })}
      {remaining > 0 && (
        <div
          className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-[10px] font-bold cursor-pointer ${isDark ? "bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700" : "bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200"}`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
