"use client";

import { useRoom } from "@/liveblocks.config";
import {
  createTLStore,
  defaultShapeUtils,
  TLRecord,
  TLStoreWithStatus,
} from "tldraw";
import { useEffect, useState } from "react";

// These record types are session-local (viewport, UI state) — never sync them
const SESSION_TYPES = new Set([
  "instance",
  "camera",
  "instance_page_state",
  "pointer",
  "instance_presence",
]);

export function useSync(): TLStoreWithStatus {
  const room = useRoom();

  // Stable store — created once, never recreated
  const [store] = useState(() =>
    createTLStore({ shapeUtils: defaultShapeUtils })
  );

  const [status, setStatus] = useState<TLStoreWithStatus>({
    status: "loading",
  });

  useEffect(() => {
    let destroyed = false;

    // --- Debounced write buffer ---
    let pending: Record<string, TLRecord | null> = {};
    let flushHandle: ReturnType<typeof setTimeout> | null = null;

    const scheduleFlush = () => {
      if (flushHandle) clearTimeout(flushHandle);
      flushHandle = setTimeout(async () => {
        if (destroyed || Object.keys(pending).length === 0) return;
        const batch = pending;
        pending = {};

        const { root } = await room.getStorage();
        const liveRecords = root.get("records");
        for (const [id, record] of Object.entries(batch)) {
          if (record === null) {
            liveRecords.delete(id);
          } else {
            liveRecords.set(id, record);
          }
        }
      }, 50);
    };

    let unsubRemote: (() => void) | undefined;

    // Bootstrap: load initial storage, then subscribe
    room.getStorage().then(({ root }) => {
      if (destroyed) return;

      const liveRecords = root.get("records");

      // 1. Initial hydration — push Liveblocks records into tldraw
      const initialRecords: TLRecord[] = [];
      liveRecords.forEach((v) => initialRecords.push(v as TLRecord));

      if (initialRecords.length > 0) {
        store.mergeRemoteChanges(() => {
          store.put(initialRecords);
        });
      }

      setStatus({ status: "synced-remote", store, connectionStatus: "online" });

      // 2. Remote → local: Liveblocks storage changes → tldraw store
      unsubRemote = room.subscribe(liveRecords, () => {
        if (destroyed) return;

        // Collect what Liveblocks currently has
        const remoteRecords = new Map<string, TLRecord>();
        liveRecords.forEach((v, k) => remoteRecords.set(k, v as TLRecord));

        store.mergeRemoteChanges(() => {
          // Put updated / new records
          if (remoteRecords.size > 0) {
            store.put([...remoteRecords.values()]);
          }

          // Remove records deleted remotely (only document-scope ones)
          const toRemove: string[] = [];
          for (const [id, record] of Object.entries(
            store.serialize("document")
          )) {
            if (
              !SESSION_TYPES.has((record as TLRecord).typeName) &&
              !remoteRecords.has(id)
            ) {
              toRemove.push(id);
            }
          }
          if (toRemove.length > 0) {
            store.remove(toRemove as any);
          }
        });
      });
    });

    // 3. Local → Liveblocks: tldraw user changes → debounced Liveblocks write
    //    scope: "document" automatically excludes camera / instance / pointer records
    const unsubLocal = store.listen(
      (event) => {
        if (event.source !== "user") return;

        for (const record of Object.values(event.changes.added)) {
          pending[record.id] = record;
        }
        for (const [, record] of Object.values(event.changes.updated)) {
          pending[record.id] = record;
        }
        for (const record of Object.values(event.changes.removed)) {
          pending[record.id] = null;
        }
        scheduleFlush();
      },
      { scope: "document" }
    );

    return () => {
      destroyed = true;
      if (flushHandle) clearTimeout(flushHandle);
      unsubLocal();
      unsubRemote?.();
    };
  }, [room, store]); // eslint-disable-line react-hooks/exhaustive-deps

  return status;
}
