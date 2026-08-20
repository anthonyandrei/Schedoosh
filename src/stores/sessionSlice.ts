import { Slice } from "./useGlobalStore";

export interface SessionStates {
  sessionCookie: string;
  idNumber: string;
  isAuthenticated: boolean;
  lastAuthenticated: string | Date | null;
  isSessionModalOpen: boolean;
}

export interface SessionActions {
  setSessionCookie: (cookie: string, isAuthenticated: boolean) => void;
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
  // isAuthenticated is decided by the caller (a live ArchersHub probe),
  // not re-derived here from cookie shape — cookie names alone can't
  // prove a session is logged in.
  setSessionCookie: (cookie: string, isAuthenticated: boolean) => {
    const trimmed = cookie.trim();
    set({
      sessionCookie: trimmed,
      isAuthenticated,
      lastAuthenticated: isAuthenticated ? new Date() : null,
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
