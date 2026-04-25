"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { X, Minus, ArrowRightIcon as ArrowsMaximize } from "lucide-react";
import gsap from "gsap";
import Flip from "gsap/Flip";
import { useGSAP } from "@gsap/react";
import type { AppWindow } from "@/types";
import {
  APP_WINDOW_DEFAULT_SIZE,
  WINDOW_LAYOUT,
} from "@/constants/window-config";
import { useDesktopStore } from "@/store/useDesktopStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useIsDarkMode } from "@/hooks/use-is-dark-mode";
import { useUISound } from "@/hooks/useUISounds";
import { useIsMobile } from "@/hooks/use-mobile";
import { componentMap } from "./app-loader";
import type { WindowProps } from "@/types/components/window";
import {
  resizeWindow,
  getAvailableWindowSpace,
  calculateWindowSkew,
} from "@/lib/window/resize";
import { getDockTarget } from "@/lib/window/dock";

gsap.registerPlugin(Flip);

export default function Window({
  window: appWindow,
  isActive,
  windowId,
}: WindowProps) {
  const {
    playSwoosh,
    playCloseWindow,
    playMinimizeWindow,
    playSwitchOn,
    playSwitchOff,
  } = useUISound();
  const closeWindow = useDesktopStore((s) => s.closeWindow);
  const focusWindow = useDesktopStore((s) => s.focusWindow);
  const minimizeWindow = useDesktopStore((s) => s.minimizeWindow);
  const minimizedWindowIds = useDesktopStore((s) => s.minimizedWindowIds);
  const restoringWindowIds = useDesktopStore((s) => s.restoringWindowIds);
  const finishRestoreWindow = useDesktopStore((s) => s.finishRestoreWindow);
  const openingWindowIds = useDesktopStore((s) => s.openingWindowIds);
  const finishOpenWindow = useDesktopStore((s) => s.finishOpenWindow);
  const closingWindowIds = useDesktopStore((s) => s.closingWindowIds);
  const clearCloseRequest = useDesktopStore((s) => s.clearCloseRequest);
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);
  const { isDarkMode } = useIsDarkMode();
  const isMobile = useIsMobile();

  const isMinimized = minimizedWindowIds.includes(windowId);
  const isRestoring = restoringWindowIds.includes(windowId);
  const isOpening = openingWindowIds.includes(windowId);
  const isCloseRequested = closingWindowIds.includes(windowId);
  const prefersReducedMotionRef = useRef(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const windowInnerRef = useRef<HTMLDivElement>(null);
  const windowDepthOverlayRef = useRef<HTMLDivElement>(null);
  const { contextSafe } = useGSAP({ scope: windowRef });
  const [isAnimatingMinimize, setIsAnimatingMinimize] = useState(false);
  const isAnimating =
    isAnimatingMinimize || isRestoring || isOpening || isCloseRequested;
  const isClosingRef = useRef(false);

  const [draftPosition, setDraftPosition] = useState<
    AppWindow["position"] | null
  >(null);
  const [draftSize, setDraftSize] = useState<AppWindow["size"] | null>(null);

  const defaultPosition = useMemo(
    () => ({
      x: WINDOW_LAYOUT.menubarOffsetY + 100,
      y: 100,
    }),
    [],
  );

  const defaultSize = useMemo(
    () => ({
      width: APP_WINDOW_DEFAULT_SIZE.width,
      height: APP_WINDOW_DEFAULT_SIZE.height,
    }),
    [],
  );

  const position = useMemo(
    () => draftPosition ?? appWindow.position ?? defaultPosition,
    [draftPosition, appWindow.position, defaultPosition],
  );

  const size = useMemo(
    () => draftSize ?? appWindow.size ?? defaultSize,
    [draftSize, appWindow.size, defaultSize],
  );

  const positionRef = useRef(position);
  const sizeRef = useRef(size);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [preMaximizeState, setPreMaximizeState] = useState(() => ({
    position: appWindow.position ?? {
      x: WINDOW_LAYOUT.menubarOffsetY + 100,
      y: 100,
    },
    size: appWindow.size ?? {
      width: APP_WINDOW_DEFAULT_SIZE.width,
      height: APP_WINDOW_DEFAULT_SIZE.height,
    },
  }));
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState({
    width: 0,
    height: 0,
  });

  const AppComponent = componentMap[appWindow.component];
  const isMinimizeDisabled =
    appWindow.component === "Projects" || appWindow.component === "Contact";

  const setWindowPosition = useDesktopStore((s) => s.setWindowPosition);
  const setWindowSize = useDesktopStore((s) => s.setWindowSize);

  useGSAP(() => {
    if (typeof window === "undefined") return;
    prefersReducedMotionRef.current =
      (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ??
        false) ||
      reduceMotion;
  }, [reduceMotion]);

  useGSAP(
    () => {
      const innerEl = windowInnerRef.current;
      const overlayEl = windowDepthOverlayRef.current;
      if (!innerEl || !overlayEl) return;

      if (prefersReducedMotionRef.current) {
        gsap.set(innerEl, { scale: isActive ? 1 : 0.98 });
        gsap.set(overlayEl, { opacity: isActive ? 0 : 0.14 });
        return;
      }

      if (isAnimating || isMinimized) {
        gsap.set(innerEl, { scale: 1 });
        gsap.set(overlayEl, { opacity: 0 });
        return;
      }

      gsap.to(innerEl, {
        duration: 0.18,
        ease: "power2.out",
        overwrite: "auto",
        scale: isActive ? 1 : 0.98,
      });

      gsap.to(overlayEl, {
        duration: 0.18,
        ease: "power2.out",
        overwrite: "auto",
        opacity: isActive ? 0 : 0.14,
      });
    },
    { scope: windowRef, dependencies: [isActive, isAnimating, isMinimized] },
  );

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  useGSAP(
    () => {
      const windowEl = windowRef.current;
      if (!windowEl) return;

      if (!isMinimized) return;

      gsap.killTweensOf(windowEl);
      gsap.set(windowEl, {
        visibility: "hidden",
        opacity: 0,
        pointerEvents: "none",
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        skewX: 0,
        skewY: 0,
        clearProps: "filter,willChange",
      });
    },
    { scope: windowRef, dependencies: [isMinimized] },
  );

  useGSAP(
    () => {
      if (!isOpening) return;
      const windowEl = windowRef.current;
      if (!windowEl) {
        finishOpenWindow(windowId);
        return;
      }

      if (prefersReducedMotionRef.current) {
        gsap.killTweensOf(windowEl);
        gsap.set(windowEl, {
          visibility: "visible",
          opacity: 1,
          pointerEvents: "auto",
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          skewX: 0,
          skewY: 0,
          clearProps: "willChange,filter",
        });
        finishOpenWindow(windowId);
        return;
      }

      const dockTarget = getDockTarget(windowId);
      if (!dockTarget) {
        finishOpenWindow(windowId);
        return;
      }
      const targetEl = dockTarget.el;

      gsap.killTweensOf(windowEl);
      Flip.killFlipsOf(windowEl);

      gsap.set(windowEl, {
        visibility: "visible",
        opacity: 1,
        pointerEvents: "none",
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        skewX: 0,
        skewY: 0,
        transformOrigin: "bottom center",
        willChange: "transform, opacity",
      });

      const finalState = Flip.getState(windowEl, { props: "opacity" });

      const fromRect = windowEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const fromCenterX = fromRect.left + fromRect.width / 2;
      const targetCenterX = targetRect.left + targetRect.width / 2;
      const skewX = calculateWindowSkew(fromCenterX, targetCenterX);

      Flip.fit(windowEl, targetEl, {
        duration: 0,
        scale: true,
      });

      dockTarget.cleanup?.();

      gsap.set(windowEl, {
        opacity: 0,
        skewX,
      });

      Flip.to(finalState, {
        duration: 0.56,
        ease: "power3.out",
        scale: true,
        clearProps: false,
        onComplete: () => {
          gsap.set(windowEl, {
            clearProps:
              "transform,opacity,visibility,pointerEvents,willChange,filter",
          });
          playSwoosh();
          finishOpenWindow(windowId);
        },
      });
    },
    {
      scope: windowRef,
      dependencies: [finishOpenWindow, windowId],
    },
  );

  useGSAP(
    () => {
      if (!isRestoring) return;
      const windowEl = windowRef.current;
      if (!windowEl) {
        finishRestoreWindow(windowId);
        return;
      }

      if (prefersReducedMotionRef.current) {
        gsap.killTweensOf(windowEl);
        gsap.set(windowEl, {
          visibility: "visible",
          opacity: 1,
          pointerEvents: "auto",
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          skewX: 0,
          skewY: 0,
          clearProps: "willChange,filter",
        });
        finishRestoreWindow(windowId);
        return;
      }

      const dockTarget = getDockTarget(windowId);
      if (!dockTarget) {
        finishRestoreWindow(windowId);
        return;
      }
      const targetEl = dockTarget.el;

      gsap.killTweensOf(windowEl);
      Flip.killFlipsOf(windowEl);

      gsap.set(windowEl, {
        visibility: "visible",
        opacity: 1,
        pointerEvents: "none",
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        skewX: 0,
        skewY: 0,
        transformOrigin: "bottom center",
        willChange: "transform, opacity",
      });

      const finalState = Flip.getState(windowEl, { props: "opacity" });

      const fromRect = windowEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const fromCenterX = fromRect.left + fromRect.width / 2;
      const targetCenterX = targetRect.left + targetRect.width / 2;
      const skewX = calculateWindowSkew(fromCenterX, targetCenterX);

      Flip.fit(windowEl, targetEl, {
        duration: 0,
        scale: true,
      });

      dockTarget.cleanup?.();

      gsap.set(windowEl, {
        opacity: 0,
        skewX,
      });

      Flip.to(finalState, {
        duration: 0.52,
        ease: "power3.out",
        scale: true,
        clearProps: false,
        onComplete: () => {
          gsap.set(windowEl, {
            clearProps:
              "transform,opacity,visibility,pointerEvents,willChange,filter",
          });
          finishRestoreWindow(windowId);
        },
      });
    },
    {
      scope: windowRef,
      dependencies: [finishRestoreWindow, windowId],
    },
  );

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    if (isMinimized) {
      playCloseWindow();
      closeWindow(windowId);
      return;
    }

    contextSafe(() => {
      if (isClosingRef.current) return;
      isClosingRef.current = true;

      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection(null);

      const windowEl = windowRef.current;
      if (!windowEl || prefersReducedMotionRef.current) {
        playCloseWindow();
        closeWindow(windowId);
        return;
      }

      playCloseWindow();

      const dockTarget = getDockTarget(windowId);
      if (!dockTarget) {
        closeWindow(windowId);
        return;
      }
      const targetEl = dockTarget.el;

      gsap.killTweensOf(windowEl);
      Flip.killFlipsOf(windowEl);

      const fromRect = windowEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const fromCenterX = fromRect.left + fromRect.width / 2;
      const targetCenterX = targetRect.left + targetRect.width / 2;
      const skewX = calculateWindowSkew(fromCenterX, targetCenterX);

      gsap.set(windowEl, {
        visibility: "visible",
        pointerEvents: "none",
        transformOrigin: "bottom center",
        willChange: "transform, opacity",
      });

      const fromState = Flip.getState(windowEl, { props: "opacity" });

      Flip.fit(windowEl, targetEl, {
        duration: 0,
        scale: true,
      });

      dockTarget.cleanup?.();

      gsap.set(windowEl, {
        opacity: 0,
        skewX,
      });

      Flip.from(fromState, {
        duration: 0.54,
        ease: "power3.inOut",
        scale: true,
        clearProps: false,
        onComplete: () => closeWindow(windowId),
      });
    })();
  }, [closeWindow, contextSafe, isMinimized, playCloseWindow, windowId]);

  useGSAP(
    () => {
      if (!isCloseRequested) return;
      clearCloseRequest(windowId);
      handleClose();
    },
    {
      scope: windowRef,
      dependencies: [
        clearCloseRequest,
        handleClose,
        isCloseRequested,
        windowId,
      ],
    },
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setDraftPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      } else if (isResizing && resizeDirection) {
        e.preventDefault();
        const dx = e.clientX - resizeStartPos.x;
        const dy = e.clientY - resizeStartPos.y;

        const { newSize, newPosition } = resizeWindow(
          resizeDirection,
          resizeStartSize,
          position,
          dx,
          dy,
        );

        setDraftSize(newSize);
        if (resizeDirection.includes("w") || resizeDirection.includes("n")) {
          setDraftPosition(newPosition);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection(null);

      setWindowPosition(windowId, positionRef.current);
      setWindowSize(windowId, sizeRef.current);

      setDraftPosition(null);
      setDraftSize(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isDragging,
    dragOffset,
    isResizing,
    resizeDirection,
    resizeStartPos,
    resizeStartSize,
    position,
    size,
    setWindowPosition,
    setWindowSize,
    windowId,
  ]);

  const handleTitleBarMouseDown = (e: React.MouseEvent) => {
    if (isMobile || isMaximized || isMinimized || isAnimating) return;

    if ((e.target as HTMLElement).closest(".window-controls")) {
      return;
    }

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });

    focusWindow(windowId);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    if (isMobile || isMinimized || isAnimating) return;
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStartPos({
      x: e.clientX,
      y: e.clientY,
    });
    setResizeStartSize({
      width: size.width,
      height: size.height,
    });

    focusWindow(windowId);
  };

  const toggleMaximize = () => {
    if (isMobile) return;
    if (isMaximized) {
      playSwitchOff();
      positionRef.current = preMaximizeState.position;
      sizeRef.current = preMaximizeState.size;
      setDraftPosition(preMaximizeState.position);
      setDraftSize(preMaximizeState.size);
      setWindowPosition(windowId, preMaximizeState.position);
      setWindowSize(windowId, preMaximizeState.size);

      setDraftPosition(null);
      setDraftSize(null);
    } else {
      playSwitchOn();
      setPreMaximizeState({ position, size });

      const nextSize = getAvailableWindowSpace();
      const nextPosition = { x: 0, y: 26 };

      positionRef.current = nextPosition;
      sizeRef.current = nextSize;
      setDraftPosition(nextPosition);
      setDraftSize(nextSize);
      setWindowPosition(windowId, nextPosition);
      setWindowSize(windowId, nextSize);

      setDraftPosition(null);
      setDraftSize(null);
    }

    setIsMaximized(!isMaximized);
  };

  const handleMinimize = () => {
    contextSafe(() => {
      if (isMinimizeDisabled) return;
      if (isMinimized || isAnimatingMinimize || isRestoring) return;

      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection(null);

      playMinimizeWindow();

      if (prefersReducedMotionRef.current) {
        minimizeWindow(windowId);
        return;
      }

      const windowEl = windowRef.current;
      if (!windowEl) {
        minimizeWindow(windowId);
        return;
      }

      const dockTarget = getDockTarget(windowId);
      if (!dockTarget) {
        minimizeWindow(windowId);
        return;
      }
      const targetEl = dockTarget.el;

      gsap.killTweensOf(windowEl);
      Flip.killFlipsOf(windowEl);
      setIsAnimatingMinimize(true);

      const fromRect = windowEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const fromCenterX = fromRect.left + fromRect.width / 2;
      const targetCenterX = targetRect.left + targetRect.width / 2;
      const skewX = calculateWindowSkew(fromCenterX, targetCenterX);

      gsap.set(windowEl, {
        visibility: "visible",
        pointerEvents: "none",
        transformOrigin: "bottom center",
        willChange: "transform, opacity",
      });

      const fromState = Flip.getState(windowEl, { props: "opacity" });

      Flip.fit(windowEl, targetEl, {
        duration: 0,
        scale: true,
      });

      dockTarget.cleanup?.();

      gsap.set(windowEl, {
        opacity: 0,
        skewX,
      });

      Flip.from(fromState, {
        duration: 0.58,
        ease: "power3.inOut",
        scale: true,
        clearProps: false,
        onComplete: () => {
          minimizeWindow(windowId);
          setIsAnimatingMinimize(false);
        },
      });
    })();
  };

  const titleBarClass = isDarkMode
    ? isActive
      ? "bg-gray-800"
      : "bg-gray-900"
    : isActive
      ? "bg-gray-200"
      : "bg-gray-100";

  const contentBgClass = isDarkMode ? "bg-gray-900" : "bg-white";
  const textClass = isDarkMode ? "text-white" : "text-gray-800";

  const isEffectivelyMaximized = isMaximized || isMobile;

  return (
    <div
      ref={windowRef}
      data-role="window"
      className={`${isMobile ? "fixed" : "absolute"} rounded-lg overflow-hidden shadow-2xl transition-shadow ${isActive ? "shadow-2xl" : "shadow-lg"}`}
      style={{
        ...(isMobile
          ? {
              left: 0,
              right: 0,
              top: `calc(${WINDOW_LAYOUT.menubarOffsetY}px + env(safe-area-inset-top))`,
              bottom: `calc(${WINDOW_LAYOUT.dockReservedHeight}px + env(safe-area-inset-bottom))`,
            }
          : {
              left: `${position.x}px`,
              top: `${position.y}px`,
              width: `${size.width}px`,
              height: `${size.height}px`,
            }),
        zIndex: isAnimating ? 80 : isActive ? 30 : 20,
        pointerEvents: isMinimized || isAnimating ? "none" : "auto",
      }}
      onMouseDown={() => {
        if (isMinimized || isAnimating) return;
        focusWindow(windowId);
      }}
    >
      <div
        ref={windowInnerRef}
        data-role="window-inner"
        className="relative h-full w-full"
      >
        <div
          ref={windowDepthOverlayRef}
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ opacity: 0 }}
        />

        {/* Title bar */}
        <div
          className={`h-8 flex items-center px-3 ${titleBarClass}`}
          onMouseDown={handleTitleBarMouseDown}
        >
          <div className="window-controls flex items-center space-x-2 mr-4">
            <button
              className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center"
              onClick={handleClose}
            >
              <X className="w-2 h-2 text-red-800 opacity-0 hover:opacity-100" />
            </button>
            <button
              className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center"
              onClick={handleMinimize}
              disabled={isMinimizeDisabled}
              aria-disabled={isMinimizeDisabled}
              title={isMinimizeDisabled ? "Minimize disabled" : "Minimize"}
              style={
                isMinimizeDisabled
                  ? { opacity: 0.5, cursor: "not-allowed" }
                  : undefined
              }
            >
              <Minus className="w-2 h-2 text-yellow-800 opacity-0 hover:opacity-100" />
            </button>
            <button
              className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center"
              onClick={toggleMaximize}
            >
              <ArrowsMaximize className="w-2 h-2 text-green-800 opacity-0 hover:opacity-100" />
            </button>
          </div>

          <div
            className={`flex-1 text-center text-sm font-medium truncate ${textClass}`}
          >
            {appWindow.title}
          </div>

          <div className="w-16">{/* Spacer to balance the title */}</div>
        </div>

        {/* Window content */}
        <div className={`${contentBgClass} h-[calc(100%-2rem)] overflow-auto`}>
          {AppComponent ? (
            <AppComponent
              isDarkMode={isDarkMode}
              project={appWindow.data ?? null}
            />
          ) : (
            <div className="p-4">Content not available</div>
          )}
        </div>

        {/* Resize handles */}
        {!isEffectivelyMaximized && !isMinimized && !isAnimating && (
          <>
            {/* Corner resize handles */}
            <div
              className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize z-20"
              onMouseDown={(e) => handleResizeMouseDown(e, "nw")}
            />
            <div
              className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize z-20"
              onMouseDown={(e) => handleResizeMouseDown(e, "ne")}
            />
            <div
              className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize z-20"
              onMouseDown={(e) => handleResizeMouseDown(e, "sw")}
            />
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-20"
              onMouseDown={(e) => handleResizeMouseDown(e, "se")}
            />

            {/* Edge resize handles */}
            <div
              className="absolute top-0 left-4 right-4 h-2 cursor-n-resize z-20"
              onMouseDown={(e) => handleResizeMouseDown(e, "n")}
            />
            <div
              className="absolute bottom-0 left-4 right-4 h-2 cursor-s-resize z-20"
              onMouseDown={(e) => handleResizeMouseDown(e, "s")}
            />
            <div
              className="absolute left-0 top-4 bottom-4 w-2 cursor-w-resize z-20"
              onMouseDown={(e) => handleResizeMouseDown(e, "w")}
            />
            <div
              className="absolute right-0 top-4 bottom-4 w-2 cursor-e-resize z-20"
              onMouseDown={(e) => handleResizeMouseDown(e, "e")}
            />
          </>
        )}
      </div>
    </div>
  );
}
