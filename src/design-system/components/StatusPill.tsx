import { Badge, BadgeTone } from "./Badge";

export type StatusType = 
  | "active" 
  | "expired" 
  | "pending" 
  | "completed" 
  | "cancelled"
  | "draft"
  | "in_progress"
  | "on_hold"
  | "rejected"
  | "approved"
  | "scheduled"
  | string;  // ← اجازه هر status دیگه‌ای رو هم بده

export interface StatusPillProps {
  status: StatusType;
  label: string;
}

export function StatusPill({ status, label }: StatusPillProps) {
  const config: Record<string, { tone: BadgeTone; dot: boolean }> = {
    // Statusهای اصلی
    active: { tone: "success", dot: true },
    expired: { tone: "danger", dot: true },
    pending: { tone: "warning", dot: true },
    completed: { tone: "info", dot: true },
    cancelled: { tone: "neutral", dot: false },
    
    // Statusهای اضافی (بر اساس mockData)
    draft: { tone: "neutral", dot: false },
    in_progress: { tone: "info", dot: true },
    on_hold: { tone: "warning", dot: true },
    rejected: { tone: "danger", dot: true },
    approved: { tone: "success", dot: true },
    scheduled: { tone: "purple", dot: true },
  };

  // ✅ Fallback برای statusهای ناشناخته
  const c = config[status] ?? { tone: "neutral" as BadgeTone, dot: false };
  
  return <Badge tone={c.tone} dot={c.dot}>{label}</Badge>;
}