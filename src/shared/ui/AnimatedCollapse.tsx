// src/shared/ui/AnimatedCollapse.tsx

import { useState, useEffect, useRef } from "react";

interface AnimatedCollapseProps {
  isOpen: boolean;
  children: React.ReactNode;
  duration?: number;
  className?: string;
}

export function AnimatedCollapse({
  isOpen,
  children,
  duration = 300,
  className = "",
}: AnimatedCollapseProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [height, setHeight] = useState<number | "auto">(isOpen ? "auto" : 0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // اندازه واقعی محتوا را بگیر
      requestAnimationFrame(() => {
        if (contentRef.current) {
          setHeight(contentRef.current.scrollHeight);
          // بعد از انیمیشن، height را auto کن
          const timer = setTimeout(() => {
            setHeight("auto");
          }, duration);
          return () => clearTimeout(timer);
        }
      });
    } else {
      // اول height را به مقدار فعلی تنظیم کن
      if (contentRef.current) {
        setHeight(contentRef.current.scrollHeight);
      }
      // بعد از یک frame، height را 0 کن
      requestAnimationFrame(() => {
        setHeight(0);
      });
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration]);

  if (!shouldRender && !isOpen) return null;

  return (
    <div
      style={{
        height: height === "auto" ? "auto" : `${height}px`,
        overflow: "hidden",
        transition: `height ${duration}ms ease-in-out, opacity ${duration}ms ease-in-out`,
        opacity: isOpen ? 1 : 0,
      }}
      className={className}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
}
