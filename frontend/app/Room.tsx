"use client";

import { ReactNode } from "react";
import { LiveblocksProvider, RoomProvider } from "@/liveblocks.config";
import { LiveMap } from "@liveblocks/client";

export function Room({ children }: { children: ReactNode }) {
  return (
    <LiveblocksProvider>
      <RoomProvider
        id="tldraw-room"
        initialPresence={{ cursor: null, peerId: null }}
        initialStorage={{ records: new LiveMap<string, any>() }}
      >
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  );
}
