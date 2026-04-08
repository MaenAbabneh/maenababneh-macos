"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Dock from "@/components/dock";
import Menubar from "@/components/menubar";
import Wallpaper from "@/components/wallpaper";
import Window from "@/components/window";
import Launchpad from "@/components/launchpad";
import ControlCenter from "@/components/control-center";
import Spotlight from "@/components/spotlight";
import SystemNotifications from "@/components/system-notifications";
import ProjectFolder from "@/components/project-folder";
import { PERSONAL_WEBSITES } from "@/constants/media-links";
import { useDesktopStore } from "@/store/useDesktopStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useSystemStore } from "@/store/useSystemStore";
import { useUISound } from "@/hooks/useUISounds";
import { useIsDarkMode } from "@/hooks/use-is-dark-mode";
import { UI_MOBILE_BREAKPOINT } from "@/constants/ui-config";
import type { DesktopPosition, GitHubProjectSummary } from "@/types";

type ProjectsApiResponse = {
  projects: GitHubProjectSummary[];
  source: "github" | "fallback" | "error";
  message?: string;
};

const getInitialProjectPosition = (index: number) => {
  const columns =
    typeof window === "undefined"
      ? 4
      : window.innerWidth < 1100
        ? 3
        : window.innerWidth < 1500
          ? 4
          : 5;
  const column = index % columns;
  const row = Math.floor(index / columns);

  return {
    x: 56 + column * 160,
    y: 92 + row * 138,
  };
};

const fallbackProjects = (): GitHubProjectSummary[] =>
  PERSONAL_WEBSITES.map((site, index) => ({
    id: `fallback-${index}-${site.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: site.title,
    nameWithOwner: site.githubUrl.replace("https://github.com/", ""),
    description: site.description,
    url: site.githubUrl,
    homepageUrl: site.demoUrl,
    primaryLanguage: {
      name: "Project",
      color: "#facc15",
    },
    stargazerCount: 0,
    updatedAt: new Date().toISOString(),
    readmePreview: site.description,
    coverImageUrl: site.image,
    source: "fallback",
  }));

export default function Desktop() {
  const [time, setTime] = useState(new Date());
  const { playPop } = useUISound();

  const desktopIntroNonce = useSystemStore((s) => s.desktopIntroNonce);
  const desktopIntroLastPlayedNonce = useSystemStore(
    (s) => s.desktopIntroLastPlayedNonce,
  );
  const markDesktopIntroPlayed = useSystemStore(
    (s) => s.markDesktopIntroPlayed,
  );

  const openWindows = useDesktopStore((s) => s.openWindows);
  const activeWindowId = useDesktopStore((s) => s.activeWindowId);
  const showLaunchpad = useDesktopStore((s) => s.showLaunchpad);
  const showControlCenter = useDesktopStore((s) => s.showControlCenter);
  const showSpotlight = useDesktopStore((s) => s.showSpotlight);
  const toggleSpotlight = useDesktopStore((s) => s.toggleSpotlight);
  const desktopBackgroundClick = useDesktopStore(
    (s) => s.desktopBackgroundClick,
  );
  const openApp = useDesktopStore((s) => s.openApp);
  const projectFolderPositions = useDesktopStore(
    (s) => s.projectFolderPositions,
  );
  const setProjectFolderPosition = useDesktopStore(
    (s) => s.setProjectFolderPosition,
  );

  const screenBrightness = useSettingsStore((s) => s.screenBrightness);
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);
  const { isDarkMode } = useIsDarkMode();
  const rootRef = useRef<HTMLDivElement>(null);
  const desktopRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotionRef = useRef(false);
  const [projects, setProjects] = useState<GitHubProjectSummary[]>([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // No default app opening to avoid duplicate key issues

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    prefersReducedMotionRef.current =
      (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ??
        false) ||
      reduceMotion;
  }, [reduceMotion]);

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      try {
        const response = await fetch("/api/github/projects", {
          cache: "no-store",
        });
        const data = (await response.json()) as ProjectsApiResponse;

        if (!cancelled) {
          if (response.ok && data.projects.length) {
            setProjects(data.projects);
          } else {
            setProjects(fallbackProjects());
          }
          setProjectsLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setProjects(fallbackProjects());
          setProjectsLoaded(true);
        }
      }
    };

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!projects.length) return;

    projects.forEach((project, index) => {
      if (!projectFolderPositions[project.id]) {
        setProjectFolderPosition(project.id, getInitialProjectPosition(index));
      }
    });
  }, [projectFolderPositions, projects, setProjectFolderPosition]);

  useGSAP(
    () => {
      const rootEl = rootRef.current;
      if (!rootEl) return;

      const shouldPlayIntro = desktopIntroNonce > desktopIntroLastPlayedNonce;

      if (prefersReducedMotionRef.current) {
        const menubarEl = rootEl.querySelector<HTMLElement>(
          '[data-role="menubar"]',
        );
        const dockSurfaceEl =
          rootEl.querySelector<HTMLElement>("[data-dock-root]");
        const windowEls = rootEl.querySelectorAll<HTMLElement>(
          '[data-role="window"]',
        );
        const windowInnerEls = rootEl.querySelectorAll<HTMLElement>(
          '[data-role="window-inner"]',
        );

        gsap.set(rootEl, { opacity: 1 });
        if (menubarEl) {
          const leftItems = menubarEl.querySelectorAll<HTMLElement>(
            "[data-menubar-left-item]",
          );
          const rightItems = menubarEl.querySelectorAll<HTMLElement>(
            "[data-menubar-right-item]",
          );

          gsap.set(menubarEl, { opacity: 1, "--menubar-blur": "20px" });
          if (leftItems.length) gsap.set(leftItems, { opacity: 1, y: 0 });
          if (rightItems.length) gsap.set(rightItems, { opacity: 1, y: 0 });
        }
        if (dockSurfaceEl) {
          const waveEls = dockSurfaceEl.querySelectorAll<HTMLElement>(
            "[data-dock-wave-id]",
          );
          gsap.set(dockSurfaceEl, { opacity: 1, "--dock-blur": "20px" });
          if (waveEls.length) gsap.set(waveEls, { opacity: 1, y: 0, scale: 1 });
        }
        if (windowEls.length) {
          gsap.set(windowEls, { opacity: 1, clearProps: "opacity" });
        }
        if (windowInnerEls.length) {
          // Don't clear transforms here; inner scale is used for window depth.
          gsap.set(windowInnerEls, { y: 0 });
        }

        if (shouldPlayIntro) {
          markDesktopIntroPlayed(desktopIntroNonce);
        }
        return;
      }

      if (!shouldPlayIntro) {
        const menubarEl = rootEl.querySelector<HTMLElement>(
          '[data-role="menubar"]',
        );
        const dockSurfaceEl =
          rootEl.querySelector<HTMLElement>("[data-dock-root]");
        const windowEls = rootEl.querySelectorAll<HTMLElement>(
          '[data-role="window"]',
        );
        const windowInnerEls = rootEl.querySelectorAll<HTMLElement>(
          '[data-role="window-inner"]',
        );

        gsap.set(rootEl, { opacity: 1 });

        if (menubarEl) {
          const leftItems = menubarEl.querySelectorAll<HTMLElement>(
            "[data-menubar-left-item]",
          );
          const rightItems = menubarEl.querySelectorAll<HTMLElement>(
            "[data-menubar-right-item]",
          );
          gsap.set(menubarEl, { opacity: 1, "--menubar-blur": "20px" });
          if (leftItems.length) gsap.set(leftItems, { opacity: 1, y: 0 });
          if (rightItems.length) gsap.set(rightItems, { opacity: 1, y: 0 });
        }

        if (dockSurfaceEl) {
          const waveEls = dockSurfaceEl.querySelectorAll<HTMLElement>(
            "[data-dock-wave-id]",
          );
          gsap.set(dockSurfaceEl, { opacity: 1, "--dock-blur": "20px" });
          if (waveEls.length) {
            gsap.set(waveEls, { opacity: 1, y: 0, scale: 1 });
          }
        }

        if (windowEls.length) {
          gsap.set(windowEls, { opacity: 1, clearProps: "opacity" });
        }
        if (windowInnerEls.length) {
          gsap.set(windowInnerEls, { y: 0 });
        }

        return;
      }

      const menubarEl = rootEl.querySelector<HTMLElement>(
        '[data-role="menubar"]',
      );
      const dockSurfaceEl =
        rootEl.querySelector<HTMLElement>("[data-dock-root]");
      const windowEls = Array.from(
        rootEl.querySelectorAll<HTMLElement>('[data-role="window"]'),
      );
      const windowInnerEls = Array.from(
        rootEl.querySelectorAll<HTMLElement>('[data-role="window-inner"]'),
      );

      // Ensure we're visible even after exit transitions.
      gsap.set(rootEl, { opacity: 1 });

      if (!menubarEl || !dockSurfaceEl) return;

      const isMobile = window.innerWidth < UI_MOBILE_BREAKPOINT;

      const leftItems = Array.from(
        menubarEl.querySelectorAll<HTMLElement>("[data-menubar-left-item]"),
      );
      const rightItems = Array.from(
        menubarEl.querySelectorAll<HTMLElement>("[data-menubar-right-item]"),
      );
      const rightItemsRtl = [...rightItems].reverse();

      const waveEls = Array.from(
        dockSurfaceEl.querySelectorAll<HTMLElement>("[data-dock-wave-id]"),
      );

      const visibleWindowEls = windowEls.filter(
        (el) => window.getComputedStyle(el).visibility !== "hidden",
      );
      const visibleWindowInnerEls = windowInnerEls.filter(
        (el) => window.getComputedStyle(el).visibility !== "hidden",
      );

      gsap.killTweensOf([
        menubarEl,
        ...leftItems,
        ...rightItems,
        dockSurfaceEl,
        ...waveEls,
        ...visibleWindowEls,
        ...visibleWindowInnerEls,
      ]);

      gsap.set(menubarEl, { opacity: 0, "--menubar-blur": "0px" });
      if (leftItems.length) gsap.set(leftItems, { opacity: 0, y: -6 });
      if (rightItems.length) gsap.set(rightItems, { opacity: 0, y: -6 });

      gsap.set(dockSurfaceEl, { opacity: 0, "--dock-blur": "0px" });

      if (waveEls.length) {
        gsap.set(waveEls, {
          opacity: 0,
          y: 12,
          scale: 0.96,
          transformOrigin: "bottom center",
        });
      }

      if (visibleWindowEls.length) {
        gsap.set(visibleWindowEls, { opacity: 0 });
      }
      if (visibleWindowInnerEls.length) {
        gsap.set(visibleWindowInnerEls, { y: 10 });
      }

      const timeline = gsap.timeline();

      // Menubar: blur reveal + stagger items (left→right, then right→left)
      timeline.to(
        menubarEl,
        {
          opacity: 1,
          duration: 0.18,
          ease: "power2.out",
          clearProps: "opacity",
        },
        0,
      );

      timeline.to(
        menubarEl,
        {
          duration: 0.32,
          ease: "power2.out",
          "--menubar-blur": "20px",
        },
        0,
      );

      if (leftItems.length) {
        timeline.to(
          leftItems,
          {
            opacity: 1,
            y: 0,
            duration: 0.18,
            ease: "power2.out",
            stagger: 0.05,
            clearProps: "opacity,transform",
          },
          0.04,
        );
      }

      if (rightItemsRtl.length) {
        timeline.to(
          rightItemsRtl,
          {
            opacity: 1,
            y: 0,
            duration: 0.18,
            ease: "power2.out",
            stagger: 0.04,
            clearProps: "opacity,transform",
          },
          0.08,
        );
      }

      // Dock: blur reveal + stagger pop (no scan streak)
      timeline.to(
        dockSurfaceEl,
        {
          opacity: 1,
          duration: 0.18,
          ease: "power2.out",
          clearProps: "opacity",
        },
        0.22,
      );

      timeline.to(
        dockSurfaceEl,
        {
          duration: 0.32,
          ease: "power2.out",
          "--dock-blur": "20px",
        },
        0.22,
      );

      if (waveEls.length) {
        timeline.to(
          waveEls,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: isMobile ? 0.16 : 0.22,
            ease: "power2.out",
            stagger: isMobile ? 0.02 : 0.035,
            clearProps: "opacity,transform",
          },
          0.28,
        );
      }

      // Windows: enter last (after dock starts)
      const windowsStart = 0.62;

      if (visibleWindowEls.length) {
        timeline.to(
          visibleWindowEls,
          {
            opacity: 1,
            duration: 0.18,
            ease: "power2.out",
            stagger: 0.05,
            clearProps: "opacity",
          },
          windowsStart,
        );
      }

      if (visibleWindowInnerEls.length) {
        timeline.to(
          visibleWindowInnerEls,
          {
            y: 0,
            duration: 0.18,
            ease: "power2.out",
            stagger: 0.05,
          },
          windowsStart,
        );
      }

      timeline.call(() => {
        markDesktopIntroPlayed(desktopIntroNonce);
      });

      return () => {
        timeline.kill();
      };
    },
    {
      dependencies: [
        desktopIntroNonce,
        desktopIntroLastPlayedNonce,
        markDesktopIntroPlayed,
      ],
    },
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.code === "Space") {
        e.preventDefault();
        toggleSpotlight();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSpotlight]);

  const handleDesktopClick = (e: React.MouseEvent) => {
    // Only handle clicks directly on the desktop, not on children
    if (e.target === desktopRef.current) {
      if (showControlCenter) {
        playPop();
      }
      desktopBackgroundClick();
    }
  };

  const handleOpenProject = (project: GitHubProjectSummary) => {
    const position =
      projectFolderPositions[project.id] ??
      getInitialProjectPosition(
        projects.findIndex((item) => item.id === project.id),
      );

    openApp({
      id: project.id,
      title: project.name,
      component: "Projects",
      position,
      size: {
        width: 920,
        height: 680,
      },
      data: project,
    });
  };

  return (
    <div ref={rootRef} data-screen="desktop" className="relative">
      <div
        ref={desktopRef}
        className="relative h-screen w-screen overflow-hidden"
        onMouseDown={handleDesktopClick}
      >
        <Wallpaper />

        <Menubar time={time} />

        {/* Project folders */}
        {projectsLoaded ? (
          <div className="absolute inset-0 pt-6 pb-16">
            {projects.map((project, index) => {
              const position =
                projectFolderPositions[project.id] ??
                getInitialProjectPosition(index);

              return (
                <ProjectFolder
                  key={project.id}
                  project={project}
                  position={position}
                  isDarkMode={isDarkMode}
                  isActive={activeWindowId === project.id}
                  onOpen={() => handleOpenProject(project)}
                  onPositionChange={(nextPosition: DesktopPosition) =>
                    setProjectFolderPosition(project.id, nextPosition)
                  }
                />
              );
            })}
          </div>
        ) : null}

        {/* Windows */}
        <div className="absolute inset-0 pt-6 pb-16">
          {openWindows.map((window) => (
            <Window
              key={window.id}
              window={window}
              isActive={activeWindowId === window.id}
              windowId={window.id}
            />
          ))}
        </div>

        {/* Launchpad */}
        {showLaunchpad && <Launchpad />}

        {/* Control Center */}
        {showControlCenter && <ControlCenter />}

        {/* Spotlight */}
        {showSpotlight && <Spotlight />}

        <SystemNotifications />

        <Dock />
      </div>

      {/* Brightness overlay */}
      <div
        className="absolute inset-0 bg-black pointer-events-none z-50 transition-opacity duration-300"
        style={{ opacity: Math.max(0.1, 0.9 - screenBrightness / 100) }}
      />
    </div>
  );
}
