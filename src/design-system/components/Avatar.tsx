import { cn } from "../../lib/cn";

export interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sizes = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-12 w-12 text-base",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 font-semibold text-white",
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  );
}