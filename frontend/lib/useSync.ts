"use client";

import { useRoom } from "@/liveblocks.config";
import {
  createTLStore,
  defaultShapeUtils,
  TLRecord,
  TLStoreWithStatus,
} from "tldraw";
import { useEffect, useState } from "react";

/**
 * Record types that are purely browser-local (viewport, selection, UI state).
 * We never read or write these to Liveblocks.
 */
const SESSION_TYPES = new Set([
  "instance",
  "camera",
  "instance_page_state",
  "pointer",
  "instance_presence",
]);

export function useSync(): TLStoreWithStatus {
  const room = useRoom();

  const [store] = useState(() =>
    createTLStore({ shapeUtils: defaultShapeUtils })
  );

  const [status, setStatus] = useState<TLStoreWithStatus>({
    status: "loading",
  });

  useEffect(() => {
    let destroyed = false;

    /**
     * Write buffer: document-scope records queued for Liveblocks.
     * KEY: while a record is in here, remote changes for that ID are ignored.
     * This is how we prevent Liveblocks from overwriting shapes mid-drag.
     */
    const pending: Record<string, TLRecord | null> = {};
    let flushHandle: ReturnType<typeof setTimeout> | null = null;

    /**
     * Echo suppression: after we flush a record to Liveblocks,
     * room.subscribe fires (Liveblocks echoes our own write).
     * We suppress those IDs for 300 ms so the echo doesn't reset local state.
     */
    const writtenByUs = new Map<string, ReturnType<typeof setTimeout>>();

    const markWritten = (id: string) => {
      const prev = writtenByUs.get(id);
      if (prev) clearTimeout(prev);
      writtenByUs.set(id, setTimeout(() => writtenByUs.delete(id), 300));
    };

    /** Whether we should ignore a remote record for ID `id` */
    const isLocallyOwned = (id: string) =>
      id in pending || writtenByUs.has(id);

    // Cached LiveMap — populated once so flush() can write synchronously
    // (avoiding the async race that caused teleporting)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let liveRecords: any = null;

    const flush = () => {
      if (destroyed || !liveRecords) return;
      const keys = Object.keys(pending);
      if (keys.length === 0) return;

      for (const id of keys) {
        const record = pending[id];
        markWritten(id); // suppress echo before we touch Liveblocks
        delete pending[id];

        if (record === null) {
          liveRecords.delete(id);
        } else {
          liveRecords.set(id, record);
        }
      }
    };

    const scheduleFlush = () => {
      if (flushHandle) clearTimeout(flushHandle);
      flushHandle = setTimeout(flush, 80);
    };

    let unsubRemote: (() => void) | undefined;

    room.getStorage().then(({ root }) => {
      if (destroyed) return;

      liveRecords = root.get("records");

      // ── Initial hydration ────────────────────────────────────────────────
      const initial: TLRecord[] = [];
      liveRecords.forEach((v: TLRecord, k: string) => {
        // Skip (and clean up) any session records accidentally stored in Liveblocks
        if (SESSION_TYPES.has(v.typeName)) {
          liveRecords.delete(k);
          return;
        }
        initial.push(v);
      });
      if (initial.length > 0) {
        store.mergeRemoteChanges(() => store.put(initial));
      }

      setStatus({ status: "synced-remote", store, connectionStatus: "online" });

      // ── Remote → local ───────────────────────────────────────────────────
      // Skip any ID that has *local* changes (pending or recently flushed).
      // This prevents Liveblocks from overwriting shapes while the user is
      // dragging them or immediately after a flush (the echo window).
      unsubRemote = room.subscribe(liveRecords, () => {
        if (destroyed) return;

        const toApply: TLRecord[] = [];
        const remoteIds = new Set<string>();

        liveRecords.forEach((v: TLRecord, k: string) => {
          // Never apply camera / instance / selection state from Liveblocks
          if (SESSION_TYPES.has(v.typeName)) {
            liveRecords.delete(k); // clean up any stale session record
            return;
          }
          remoteIds.add(k);
          if (!isLocallyOwned(k)) {
            toApply.push(v);
          }
        });

        // Remove shapes deleted remotely — but never remove locally-owned
        // or session records (camera, selection state, etc.)
        const toRemove: string[] = [];
        for (const record of Object.values(
          store.serialize()
        ) as TLRecord[]) {
          if (
            !SESSION_TYPES.has(record.typeName) &&
            !remoteIds.has(record.id) &&
            !isLocallyOwned(record.id)
          ) {
            toRemove.push(record.id);
          }
        }

        if (toApply.length === 0 && toRemove.length === 0) return;

        store.mergeRemoteChanges(() => {
          if (toApply.length > 0) store.put(toApply);
          if (toRemove.length > 0) store.remove(toRemove as any);
        });
      });
    });

    // ── Local → Liveblocks ───────────────────────────────────────────────
    // Explicit SESSION_TYPES guard as belt-and-suspenders alongside
    // scope:"document", since the scope option behaviour varies across
    // tldraw minor releases.
    const unsubLocal = store.listen(
      (event) => {
        if (event.source !== "user") return;

        for (const r of Object.values(event.changes.added)) {
          if (!SESSION_TYPES.has(r.typeName)) pending[r.id] = r;
        }
        for (const [, r] of Object.values(event.changes.updated)) {
          if (!SESSION_TYPES.has(r.typeName)) pending[r.id] = r;
        }
        for (const r of Object.values(event.changes.removed)) {
          if (!SESSION_TYPES.has(r.typeName)) pending[r.id] = null;
        }

        scheduleFlush();
      },
      { scope: "document" }
    );

    return () => {
      destroyed = true;
      if (flushHandle) clearTimeout(flushHandle);
      for (const t of writtenByUs.values()) clearTimeout(t);
      unsubLocal();
      unsubRemote?.();
    };
  }, [room, store]); // eslint-disable-line react-hooks/exhaustive-deps

  return status;
}
