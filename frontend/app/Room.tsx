"use client";

import { ReactNode } from "react";
import { LiveblocksProvider, RoomProvider } from "@/liveblocks.config";
import { LiveMap } from "@liveblocks/client";

export function Room({ children, roomId }: { children: ReactNode; roomId: string }) {
  return (
    <LiveblocksProvider>
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, peerId: null }}
        initialStorage={{ records: new LiveMap<string, any>() }}
      >
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  );
}
