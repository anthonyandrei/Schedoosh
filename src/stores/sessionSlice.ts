import { analyzeSessionCookie } from "@/lib/archershub/validation";
import { Slice } from "./useGlobalStore";

export interface SessionStates {
  sessionCookie: string;
  idNumber: string;
  isAuthenticated: boolean;
  lastAuthenticated: string | Date | null;
  isSessionModalOpen: boolean;
}

export interface SessionActions {
  setSessionCookie: (cookie: string) => void;
  setIdNumber: (idNumber: string) => void;
  clearSession: () => void;
  setSessionModalOpen: (open: boolean) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

export type SessionSlice = SessionStates & SessionActions;

const initState: SessionStates = {
  sessionCookie: "",
  idNumber: "",
  isAuthenticated: false,
  lastAuthenticated: null,
  isSessionModalOpen: false,
};

export const createSessionSlice: Slice<SessionSlice> = (set) => ({
  ...initState,
  setSessionCookie: (cookie: string) => {
    const trimmed = cookie.trim();
    const analysis = analyzeSessionCookie(trimmed);
    const isValid = analysis.isValid && !analysis.isAffinityOnly;
    set({
      sessionCookie: trimmed,
      isAuthenticated: isValid,
      lastAuthenticated: isValid ? new Date() : null,
    });
  },

  setIdNumber: (idNumber: string) => {
    set({
      idNumber: idNumber.trim(),
    });
  },
  clearSession: () => {
    set({
      sessionCookie: "",
      isAuthenticated: false,
      lastAuthenticated: null,
    });
  },
  setSessionModalOpen: (open: boolean) => {
    set({
      isSessionModalOpen: open,
    });
  },
  setIsAuthenticated: (isAuthenticated: boolean) => {
    set({
      isAuthenticated,
    });
  },
});
