import { createClient, LiveMap } from "@liveblocks/client";
import { createRoomContext, createLiveblocksContext } from "@liveblocks/react";

const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "pk_prod_placeholder",
  throttle: 16,
});

export type Presence = {
  cursor: { x: number; y: number } | null;
  peerId: string | null;
};

export type Storage = {
  records: LiveMap<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export type UserMeta = {
  id?: string;
  info?: {
    name: string;
    avatar?: string;
    color?: string;
  };
};

export type RoomEvent = Record<string, never>;

export const {
  suspense: {
    RoomProvider,
    useRoom,
    useMyPresence,
    useUpdateMyPresence,
    useOthers,
    useSelf,
    useStorage,
    useMutation,
    useStatus,
  },
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);

export const {
  suspense: {
    LiveblocksProvider,
  },
} = createLiveblocksContext(client);
