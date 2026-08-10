// src/features/inspection-management/context/ActiveSessionContext.tsx

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { InspectionSession } from "../domain/models/InspectionSession";

interface ActiveSessionState {
  /** The currently active session, or null if none selected */
  activeSession: InspectionSession | null;
  /** All sessions for the current request */
  sessions: InspectionSession[];
  /** Set the list of all sessions */
  setSessions: (sessions: InspectionSession[]) => void;
  /** Switch to a specific session by id */
  switchSession: (sessionId: string) => void;
  /** Set active session directly */
  setActiveSession: (session: InspectionSession | null) => void;
  /** Whether sessions are still loading */
  loading: boolean;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
}

const ActiveSessionContext = createContext<ActiveSessionState | null>(null);

export function ActiveSessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<InspectionSession[]>([]);
  const [activeSession, setActiveSession] =
    useState<InspectionSession | null>(null);
  const [loading, setLoading] = useState(false);

  const switchSession = useCallback(
    (sessionId: string) => {
      const found = sessions.find((s) => s.id === sessionId);
      if (found) {
        setActiveSession(found);
      }
    },
    [sessions],
  );

  return (
    <ActiveSessionContext.Provider
      value={{
        activeSession,
        sessions,
        setSessions,
        switchSession,
        setActiveSession,
        loading,
        setLoading,
      }}
    >
      {children}
    </ActiveSessionContext.Provider>
  );
}

export function useActiveSession(): ActiveSessionState {
  const ctx = useContext(ActiveSessionContext);
  if (!ctx) {
    throw new Error(
      "useActiveSession must be used within ActiveSessionProvider",
    );
  }
  return ctx;
}
