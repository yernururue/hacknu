"use client";

import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

export default function Home() {
  return (
    <div className="fixed inset-0 w-full h-full bg-white">
      <Tldraw />
    </div>
  );
}
