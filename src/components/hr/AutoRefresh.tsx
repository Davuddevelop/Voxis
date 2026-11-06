"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Re-reads the page's data every few seconds, so a candidate who just applied appears in the list without anyone
// pressing refresh. It pauses while the tab is hidden. Client state (an open dialog, a half-typed message) survives.
export function AutoRefresh({ everyMs = 4000 }: { everyMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) router.refresh();
    }, everyMs);
    return () => clearInterval(timer);
  }, [router, everyMs]);
  return null;
}
