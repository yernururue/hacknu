"use client";

import { Tldraw, TLComponents } from "tldraw";
import "tldraw/tldraw.css";
import { SignInButton } from "@/components/SignInButton";

// Defined outside the component so the reference is stable across renders
const components: TLComponents = {
  SharePanel: SignInButton,
};

export default function Home() {
  return (
    <div className="fixed inset-0 w-full h-full bg-white">
      <Tldraw components={components} />
    </div>
  );
}
