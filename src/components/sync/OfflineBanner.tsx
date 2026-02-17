"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Initialise with current state
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-amber-500 dark:bg-amber-600 text-white text-sm font-medium px-4 py-2 shadow-md"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>You&apos;re offline. Changes will sync when you&apos;re back online.</span>
    </div>
  );
}
