// src/shared/ui/Avatar.ts

import { cn } from"../lib/cn";

export interface AvatarProps {
  name: string;
  size?:"sm"|"md"|"lg";
  className?: string;
  gradient?: string;
}

export function Avatar({ name, size ="md", className, gradient }: AvatarProps) {
  const initials = name
    .split("")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sizes = {
    sm:"h-7 w-7 text-xs",
    md:"h-9 w-9 text-sm",
    lg:"h-12 w-12 text-base",
  };

  return (
	  <div
		className={cn("flex items-center justify-center rounded-full font-semibold text-white",
		  gradient ??"bg-gradient-to-br from-indigo-500 to-violet-600",
		  sizes[size],
		  className
		)}
	  >
		{initials}
	  </div>
	);
}
