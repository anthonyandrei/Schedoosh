"use client";

import { ReactNode, useEffect } from "react";
import { useGlobalStore } from "@/stores/useGlobalStore";

interface StoreProviderProps {
  children: ReactNode;
}

export default function StoreProvider({ children }: StoreProviderProps) {
  useEffect(() => {
    useGlobalStore.persist.rehydrate();
  }, []);

  return <>{children}</>;
}
