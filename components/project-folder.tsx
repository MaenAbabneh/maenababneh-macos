"use client";

import Image from "next/image";
import { Github, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type React from "react";
import type { DesktopPosition, GitHubProjectSummary } from "@/types";

interface ProjectFolderProps {
  project: GitHubProjectSummary;
  position: DesktopPosition;
  isDarkMode?: boolean;
  isActive?: boolean;
  onOpen: () => void;
  onPositionChange: (position: DesktopPosition) => void;
}

const DRAG_THRESHOLD = 4;

export default function ProjectFolder({
  project,
  position,
  isDarkMode = true,
  isActive = false,
  onOpen,
  onPositionChange,
}: ProjectFolderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const suppressClickRef = useRef(false);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    dragging: boolean;
  } | null>(null);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state || state.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - state.startX;
      const deltaY = event.clientY - state.startY;

      if (!state.dragging) {
        if (Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) return;
        state.dragging = true;
        setIsDragging(true);
      }

      event.preventDefault();
      onPositionChange({
        x: state.originX + deltaX,
        y: state.originY + deltaY,
      });
    };

    const handlePointerUp = (event: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state || state.pointerId !== event.pointerId) return;

      if (state.dragging) {
        suppressClickRef.current = true;
      }

      dragStateRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [onOpen, onPositionChange]);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;

    event.preventDefault();
    suppressClickRef.current = false;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      dragging: false,
    };
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = false;
      return;
    }

    onOpen();
  };

  return (
    <button
      type="button"
      className={`absolute select-none touch-none text-center ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        zIndex: isDragging ? 40 : isActive ? 4 : 2,
      }}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      <div className="w-28 sm:w-32">
        <div
          className={`relative mx-auto h-20 w-20 transition-transform duration-150 sm:h-24 sm:w-24 ${isActive ? "scale-105" : "scale-100"}`}
        >
          <Image
            src="/macos-folderl.svg"
            alt="Project folder"
            fill
            sizes="96px"
            className="object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.32)]"
            priority={false}
          />

          {project.coverImageUrl ? (
            <div className="absolute inset-x-3 top-6 h-8 overflow-hidden rounded-md sm:inset-x-4 sm:top-7 sm:h-9">
              <Image
                src={project.coverImageUrl}
                alt={project.name}
                fill
                sizes="64px"
                className="object-cover opacity-80"
              />
            </div>
          ) : null}
        </div>

        <div className="mt-2 space-y-1 px-1">
          <p
            className={`truncate rounded-md px-2 py-1 text-xs font-medium leading-tight text-white ${
              isActive ? "bg-blue-500/75" : "bg-black/35"
            }`}
          >
            {project.name}
          </p>

          <p
            className={`mx-auto flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
              isDarkMode
                ? "bg-black/35 text-white/85"
                : "bg-white/80 text-gray-700"
            }`}
          >
            <Github className="h-3 w-3" />
            <Star className="h-3 w-3" />
            {project.stargazerCount}
          </p>
        </div>
      </div>
    </button>
  );
}
