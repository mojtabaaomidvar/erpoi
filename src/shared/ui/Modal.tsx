import { cn } from"../lib/cn";
import { useTheme } from"@app/providers/ThemeProvider";

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size ="md",
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?:"md"|"lg"|"xl";
}) {
  const { isDark } = useTheme();
  
  if (!isOpen) return null;
  
  const sizes = { md:"max-w-2xl", lg:"max-w-4xl", xl:"max-w-6xl"};
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div
        className={cn("w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl",
          sizes[size],
          isDark ?"bg-slate-900 border border-slate-700":"bg-white")}
      >
        {/* Header */}
        <div className={cn("sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4 rounded-t-2xl",
          isDark ?"border-slate-700 bg-slate-900":"border-slate-100 bg-white")}>
          <h3 className={cn("text-lg font-semibold",
            isDark ?"text-slate-100":"text-slate-900")}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className={cn("rounded-lg p-2 transition-colors",
              isDark 
                ?"text-slate-400 hover:bg-slate-800 hover:text-slate-200":"text-slate-400 hover:bg-slate-100 hover:text-slate-600")}
          >
            ✕
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}





