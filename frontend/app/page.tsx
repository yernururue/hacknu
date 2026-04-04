"use client";

import CollaborativeTldraw from "@/components/CollaborativeTldraw";
import { Room } from "@/app/Room";
import { SignInButton } from "@/components/SignInButton";
import { TLComponents } from "tldraw";

const components: TLComponents = {
  SharePanel: SignInButton,
};

export default function Home() {
  return (
    <Room>
      <div className="fixed inset-0 w-full h-full bg-white overflow-hidden">
        <CollaborativeTldraw components={components} />
      </div>
    </Room>
  );
}