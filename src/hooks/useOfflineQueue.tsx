import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

// ---------- types ----------
export type OfflineAction = {
  id: string;
  type: "create" | "update";
  table: "items";
  payload: Record<string, unknown>;
  createdAt: number;
};

interface OfflineQueueContextType {
  isOnline: boolean;
  pendingCount: number;
  enqueue: (action: Omit<OfflineAction, "id" | "createdAt">) => void;
  syncNow: () => Promise<void>;
  isSyncing: boolean;
}

const OfflineQueueContext = createContext<OfflineQueueContextType>({
  isOnline: true,
  pendingCount: 0,
  enqueue: () => {},
  syncNow: async () => {},
  isSyncing: false,
});

// ---------- localStorage helpers ----------
const STORAGE_KEY = "warehouseme-offline-queue";

const loadQueue = (): OfflineAction[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveQueue = (q: OfflineAction[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(q));
};

// ---------- provider ----------
export const OfflineQueueProvider = ({ children }: { children: ReactNode }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState<OfflineAction[]>(loadQueue);
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();
  const syncingRef = useRef(false);

  // persist queue changes
  useEffect(() => {
    saveQueue(queue);
  }, [queue]);

  // online / offline listeners
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const enqueue = useCallback((action: Omit<OfflineAction, "id" | "createdAt">) => {
    const entry: OfflineAction = {
      ...action,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setQueue((prev) => [...prev, entry]);
  }, []);

  const processAction = async (action: OfflineAction) => {
    if (action.table === "items") {
      if (action.type === "create") {
        const { error } = await supabase.from("items").insert(action.payload as any);
        if (error) throw error;
      } else if (action.type === "update") {
        const { id, ...updates } = action.payload as any;
        const { error } = await supabase.from("items").update(updates).eq("id", id);
        if (error) throw error;
      }
    }
  };

  const syncNow = useCallback(async () => {
    if (syncingRef.current) return;
    const current = loadQueue();
    if (current.length === 0) return;

    syncingRef.current = true;
    setIsSyncing(true);

    const failed: OfflineAction[] = [];

    for (const action of current) {
      try {
        await processAction(action);
      } catch (err) {
        console.error("[OfflineQueue] sync failed for", action.id, err);
        failed.push(action);
      }
    }

    setQueue(failed);
    saveQueue(failed);
    syncingRef.current = false;
    setIsSyncing(false);

    // refresh data
    queryClient.invalidateQueries({ queryKey: ["items"] });
  }, [queryClient]);

  // auto-sync when coming back online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      syncNow();
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <OfflineQueueContext.Provider
      value={{
        isOnline,
        pendingCount: queue.length,
        enqueue,
        syncNow,
        isSyncing,
      }}
    >
      {children}
    </OfflineQueueContext.Provider>
  );
};

export const useOfflineQueue = () => useContext(OfflineQueueContext);
