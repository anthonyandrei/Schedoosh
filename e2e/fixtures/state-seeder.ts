import { Page } from "@playwright/test";
import { Course } from "@/lib/definitions";

export interface SeedStateOptions {
  courses?: Course[];
  sessionCookie?: string;
  isAuthenticated?: boolean;
}

export async function seedStoreState(page: Page, options: SeedStateOptions) {
  await page.evaluate(
    async ({ courses, sessionCookie, isAuthenticated }) => {
      const currentState = localStorage.getItem("schedaddle-storage");
      const parsed = currentState
        ? JSON.parse(currentState)
        : { state: {}, version: 4 };

      parsed.state = {
        ...parsed.state,
        ...(courses ? { courses } : {}),
        ...(sessionCookie !== undefined ? { sessionCookie } : {}),
        ...(isAuthenticated !== undefined ? { isAuthenticated } : {}),
      };

      const serialized = JSON.stringify(parsed);
      localStorage.setItem("schedaddle-storage", serialized);
      localStorage.setItem("global-state", serialized);

      // Seed IndexedDB for Zustand persist storage (idb-keyval)
      try {
        await new Promise<void>((resolve, reject) => {
          const req = indexedDB.open("keyval-store");
          req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains("keyval")) {
              db.createObjectStore("keyval");
            }
          };
          req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction("keyval", "readwrite");
            const store = tx.objectStore("keyval");
            store.put(serialized, "global-state");
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
            tx.onerror = () => {
              db.close();
              reject(tx.error);
            };
          };
          req.onerror = () => reject(req.error);
        });
      } catch {
        // Ignore IndexedDB errors if not supported in environment
      }
    },
    {
      courses: options.courses,
      sessionCookie: options.sessionCookie ?? "MOCK_SESSION",
      isAuthenticated: options.isAuthenticated ?? true,
    }
  );
}
