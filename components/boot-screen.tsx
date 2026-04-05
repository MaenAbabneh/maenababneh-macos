"use client";

import { useCallback, useEffect, useRef } from "react";
import { AppleIcon } from "@/components/icons";
import { ANIMATION_DELAYS_MS } from "@/constants/window-config";
import { useSystemStore } from "@/store/useSystemStore";

export default function BootScreen() {
  const systemState = useSystemStore((s) => s.systemState);
  const setSystemState = useSystemStore((s) => s.setSystemState);

  const hasCompletedRef = useRef(false);

  const finishBoot = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;

    const currentState = useSystemStore.getState().systemState;
    if (currentState === "booting" || currentState === "restarting") {
      setSystemState("login");
    }
  }, [setSystemState]);

  useEffect(() => {
    if (systemState !== "booting" && systemState !== "restarting") return;

    hasCompletedRef.current = false;

    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    const totalMs = reduced ? 0 : ANIMATION_DELAYS_MS.bootSequence + 220;
    const timer = window.setTimeout(() => {
      finishBoot();
    }, totalMs);

    return () => window.clearTimeout(timer);
  }, [finishBoot, systemState]);

  return (
    <div
      className="h-screen w-screen bg-black flex flex-col items-center justify-center opacity-0 boot-fade motion-reduce:opacity-100"
      style={{
        ["--boot-fade-duration" as never]: `${ANIMATION_DELAYS_MS.bootSequence + 220}ms`,
      }}
    >
      <AppleIcon className="w-20 h-20 text-white mb-8" />
      <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-white rounded-full w-0 boot-fill motion-reduce:w-full"
          style={{
            ["--boot-fill-duration" as never]: `${ANIMATION_DELAYS_MS.bootSequence}ms`,
          }}
        />
      </div>
    </div>
  );
}
