"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Accessibility,
  Moon,
  User,
  Shield,
  Sun,
  Wifi,
  Bluetooth,
  Bell,
  DiscIcon as Display,
  Clock,
  Keyboard,
  Mouse,
  Globe,
  Volume2,
} from "lucide-react";
import { SETTINGS_SECTIONS } from "@/constants/settings-sections";
import {
  GITHUB_URL,
  MAIL_TO_URL,
  RESUME_URL,
  WEBSITE_URL,
} from "@/constants/media-links";
import {
  WALLPAPERS,
  ACCENT_COLORS,
  THEME_PRESETS,
} from "@/constants/appearance-config";
import { useSoundStore } from "@/store/useSoundStore";
import { useMediaStore } from "@/store/useMediaStore";
import { useUISound } from "@/hooks/useUISounds";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTheme } from "next-themes";

interface SettingsProps {
  isDarkMode?: boolean;
}

export default function Settings({ isDarkMode = true }: SettingsProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("general");
  const [systemReducedMotion, setSystemReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const { playSwitchOn, playDisabled } = useUISound();

  const sfxMuted = useSoundStore((s) => s.sfxMuted);
  const sfxVolume = useSoundStore((s) => s.sfxVolume);
  const setSfxMuted = useSoundStore((s) => s.setSfxMuted);
  const setSfxVolume = useSoundStore((s) => s.setSfxVolume);
  const globalMusicMuted = useMediaStore((s) => s.globalMusicMuted);
  const setGlobalMusicMuted = useMediaStore((s) => s.setGlobalMusicMuted);
  const musicVolume = useMediaStore((s) => s.musicVolume);
  const setMusicVolume = useMediaStore((s) => s.setMusicVolume);
  const spotifyVolume = useMediaStore((s) => s.spotifyVolume);
  const setSpotifyVolume = useMediaStore((s) => s.setSpotifyVolume);
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);
  const setReduceMotion = useSettingsStore((s) => s.setReduceMotion);
  const wallpaperId = useSettingsStore((s) => s.wallpaperId);
  const setWallpaperId = useSettingsStore((s) => s.setWallpaperId);
  const accentColorId = useSettingsStore((s) => s.accentColorId);
  const setAccentColorId = useSettingsStore((s) => s.setAccentColorId);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const setFontSize = useSettingsStore((s) => s.setFontSize);
  const highContrast = useSettingsStore((s) => s.highContrast);
  const setHighContrast = useSettingsStore((s) => s.setHighContrast);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemReducedMotion(event.matches);
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const isReducedMotion = reduceMotion || systemReducedMotion;

  const textColor = isDarkMode ? "text-white" : "text-gray-800";
  const bgColor = isDarkMode ? "bg-gray-900" : "bg-white";
  const sidebarBg = isDarkMode ? "bg-gray-800" : "bg-gray-100";
  const cardBg = isDarkMode ? "bg-gray-800" : "bg-gray-100";
  const hoverBg = isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200";
  const secondaryText = isDarkMode ? "text-gray-400" : "text-gray-600";
  const subtleText = isDarkMode ? "text-gray-400" : "text-gray-500";

  const iconMap = {
    globe: Globe,
    display: Display,
    sound: Volume2,
    accessibility: Accessibility,
    wifi: Wifi,
    bluetooth: Bluetooth,
    bell: Bell,
    user: User,
    shield: Shield,
    keyboard: Keyboard,
    mouse: Mouse,
    clock: Clock,
  } as const;

  const handleMuteToggle = () => {
    const nextMuted = !sfxMuted;

    if (nextMuted) {
      playDisabled();
      setSfxMuted(nextMuted);
      return;
    }

    setSfxMuted(nextMuted);
    playSwitchOn();
  };

  const handleGlobalMusicMuteToggle = () => {
    const nextMuted = !globalMusicMuted;

    if (nextMuted) {
      playDisabled();
      setGlobalMusicMuted(nextMuted);
      return;
    }

    setGlobalMusicMuted(nextMuted);
    playSwitchOn();
  };

  const handleReduceMotionToggle = () => {
    const nextEnabled = !reduceMotion;
    setReduceMotion(nextEnabled);

    if (nextEnabled) {
      playDisabled();
      return;
    }

    playSwitchOn();
  };

  const averageMusicVolumePercent = Math.round(
    ((musicVolume + spotifyVolume) / 2) * 100,
  );

  const handleGlobalMusicVolumeChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const nextVolumePercent = Number.parseInt(event.target.value, 10);
    const normalizedVolume = Math.max(0, Math.min(1, nextVolumePercent / 100));
    setMusicVolume(normalizedVolume);
    setSpotifyVolume(normalizedVolume);
  };

  const isUnderDevelopmentSection =
    activeSection !== "general" &&
    activeSection !== "appearance" &&
    activeSection !== "sound" &&
    activeSection !== "accessibility";

  const isDarkTheme =
    (resolvedTheme ?? (isDarkMode ? "dark" : "light")) === "dark";

  const handleThemeToggle = () => {
    const nextTheme = isDarkTheme ? "light" : "dark";
    setTheme(nextTheme);
    playSwitchOn();
  };

  return (
    <div className={`flex h-full overflow-hidden ${bgColor} ${textColor}`}>
      {/* Sidebar */}
      <div
        className={`w-16 sm:w-64 shrink-0 h-full overflow-y-auto ${sidebarBg} p-2`}
      >
        <div className="space-y-1">
          {SETTINGS_SECTIONS.map((section) => {
            const Icon = iconMap[section.icon];

            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                aria-label={section.name}
                title={section.name}
                className={`flex w-full items-center justify-center sm:justify-start px-2 sm:px-3 py-2 rounded cursor-pointer transition-colors ${
                  isActive
                    ? isDarkMode
                      ? "bg-blue-600 text-white"
                      : "bg-blue-500 text-white"
                    : hoverBg
                }`}
                onClick={() => setActiveSection(section.id)}
              >
                <div className="mr-0 sm:mr-3">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="sr-only sm:not-sr-only">{section.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 h-full overflow-y-auto p-6">
        {activeSection === "general" && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">About This Mac</h2>

            <div className="space-y-6">
              <div className={`${cardBg} p-5 rounded-xl`}>
                <div className="flex flex-col gap-5 md:flex-row md:items-center">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/20">
                    <Image
                      src="https://res.cloudinary.com/dsgajdqm0/image/upload/v1772971236/Profile_lfmhs0.png"
                      alt="Maen Ababneh"
                      fill
                      sizes="96px"
                      className="object-cover"
                      quality={80}
                      loading="lazy"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-semibold">maenOS v1.0</p>
                      <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">
                        Verified Developer
                      </span>
                    </div>
                    <p className={secondaryText}>
                      Crafted with modern web technologies.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${cardBg} p-5 rounded-xl space-y-4`}>
                <h3 className="text-lg font-medium">System Information</h3>
                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <div className="flex items-start justify-between gap-3 rounded-lg bg-black/10 p-3">
                    <span className={secondaryText}>System</span>
                    <span className="font-medium">maenOS v1.0</span>
                  </div>
                  <div className="flex items-start justify-between gap-3 rounded-lg bg-black/10 p-3">
                    <span className={secondaryText}>Developer</span>
                    <span className="font-medium">Maen Ababneh</span>
                  </div>
                  <div className="flex items-start justify-between gap-3 rounded-lg bg-black/10 p-3 md:col-span-2">
                    <span className={secondaryText}>
                      Processor / Technologies
                    </span>
                    <span className="text-right font-medium">
                      Next.js 15, React 19, Zustand, GSAP
                    </span>
                  </div>
                </div>
              </div>

              <div className={`${cardBg} p-5 rounded-xl space-y-4`}>
                <h3 className="text-lg font-medium">Live Status</h3>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg bg-black/10 p-3">
                    <span className={secondaryText}>Reduce Motion</span>
                    <span className="font-medium">
                      {isReducedMotion ? "On" : "Off"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-black/10 p-3">
                    <span className={secondaryText}>Global Music Mute</span>
                    <span className="font-medium">
                      {globalMusicMuted ? "On" : "Off"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-black/10 p-3">
                    <span className={secondaryText}>SFX</span>
                    <span className="font-medium">
                      {sfxMuted ? "Muted" : "Enabled"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-black/10 p-3">
                    <span className={secondaryText}>Theme</span>
                    <span className="font-medium">
                      {isDarkMode ? "Dark" : "Light"}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`${cardBg} p-5 rounded-xl space-y-3`}>
                <h3 className="text-lg font-medium">Quick Links</h3>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={WEBSITE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600"
                  >
                    View Portfolio
                  </a>
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md bg-gray-700 px-3 py-1.5 text-sm text-white hover:bg-gray-600"
                  >
                    GitHub
                  </a>
                  <a
                    href={MAIL_TO_URL}
                    className="rounded-md bg-gray-700 px-3 py-1.5 text-sm text-white hover:bg-gray-600"
                  >
                    Contact
                  </a>
                  <a
                    href={RESUME_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md bg-gray-700 px-3 py-1.5 text-sm text-white hover:bg-gray-600"
                  >
                    Resume
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "appearance" && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Appearance</h2>

            <div className="space-y-6">
              {/* Theme Presets */}
              <div>
                <h3 className="text-lg font-medium mb-3">Display Mode</h3>
                <div className={`${cardBg} p-4 rounded-lg space-y-3`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {isDarkTheme ? "Dark Mode" : "Light Mode"}
                      </p>
                      <p className={`text-sm ${secondaryText}`}>
                        Switch the full desktop appearance.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleThemeToggle}
                      className="inline-flex items-center gap-2 rounded-md bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600"
                    >
                      {isDarkTheme ? (
                        <Sun className="h-4 w-4" />
                      ) : (
                        <Moon className="h-4 w-4" />
                      )}
                      {isDarkTheme ? "Switch to Day" : "Switch to Night"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Theme Presets */}
              <div>
                <h3 className="text-lg font-medium mb-3">Quick Presets</h3>
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                  {THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setWallpaperId(preset.wallpaperId);
                        setAccentColorId(preset.accentColorId);
                        setTheme(preset.isDarkMode ? "dark" : "light");
                        playSwitchOn();
                      }}
                      className={`p-3 rounded-lg transition-all border-2 ${
                        wallpaperId === preset.wallpaperId &&
                        accentColorId === preset.accentColorId
                          ? isDarkMode
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-blue-500 bg-blue-500/10"
                          : isDarkMode
                            ? "border-gray-600 hover:border-gray-500"
                            : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <p className="font-medium text-sm">{preset.name}</p>
                      <p className={`text-xs ${secondaryText}`}>
                        {preset.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallpapers */}
              <div>
                <h3 className="text-lg font-medium mb-3">Wallpapers</h3>
                <div className="grid gap-3 grid-cols-3 sm:grid-cols-4">
                  {WALLPAPERS.map((wallpaper) => (
                    <button
                      key={wallpaper.id}
                      type="button"
                      onClick={() => setWallpaperId(wallpaper.id)}
                      className={`relative rounded-lg overflow-hidden border-2 aspect-video transition-all ${
                        wallpaperId === wallpaper.id
                          ? "border-blue-500"
                          : isDarkMode
                            ? "border-gray-600"
                            : "border-gray-300"
                      }`}
                    >
                      <Image
                        src={wallpaper.thumbSrc}
                        alt={wallpaper.name}
                        fill
                        sizes="(max-width: 640px) 33vw, 25vw"
                        className="object-cover"
                        quality={75}
                        loading="lazy"
                      />
                      {wallpaperId === wallpaper.id && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white font-bold">✓</span>
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1">
                        <p className="text-xs text-white truncate">
                          {wallpaper.name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <h3 className="text-lg font-medium mb-3">Accent Color</h3>
                <div className="flex flex-wrap gap-3">
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setAccentColorId(color.id)}
                      className={`relative w-10 h-10 rounded-full border-2 transition-all ${
                        accentColorId === color.id
                          ? "border-white scale-110"
                          : isDarkMode
                            ? "border-gray-600"
                            : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color.light }}
                      title={color.name}
                    >
                      {accentColorId === color.id && (
                        <div className="absolute inset-1 rounded-full border-2 border-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "sound" && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Sound</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Sound Effects</h3>
                <div className={`${cardBg} p-4 rounded-lg space-y-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Global music mute</p>
                      <p className={`text-sm ${secondaryText}`}>
                        Mute Music and Spotify apps globally without pausing
                        playback.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={globalMusicMuted}
                        onChange={handleGlobalMusicMuteToggle}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">Global Music Volume</p>
                      <span className={`text-sm ${secondaryText}`}>
                        {averageMusicVolumePercent}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={averageMusicVolumePercent}
                      onChange={handleGlobalMusicVolumeChange}
                      className="w-full accent-green-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable UI sound effects</p>
                      <p className={`text-sm ${secondaryText}`}>
                        System and interaction sounds across the desktop UI.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!sfxMuted}
                        onChange={handleMuteToggle}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">SFX Volume</p>
                      <span className={`text-sm ${secondaryText}`}>
                        {sfxVolume}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={sfxVolume}
                      onChange={(event) =>
                        setSfxVolume(Number.parseInt(event.target.value, 10))
                      }
                      className="w-full accent-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "accessibility" && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Accessibility</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Motion</h3>
                <div className={`${cardBg} p-4 rounded-lg space-y-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Reduce Motion</p>
                      <p className={`text-sm ${secondaryText}`}>
                        Disable interface animations like app/window transitions
                        and terminal typing effects.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reduceMotion}
                        onChange={handleReduceMotionToggle}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  <p className={`text-sm ${secondaryText}`}>
                    {isReducedMotion
                      ? "Reduce Motion is active (from Settings or system preference)."
                      : "Reduce Motion is currently off."}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Display</h3>
                <div className={`${cardBg} p-4 rounded-lg space-y-4`}>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium">Text Size</p>
                      <span className={`text-sm ${secondaryText}`}>
                        {fontSize.charAt(0).toUpperCase() + fontSize.slice(1)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {(["small", "medium", "large"] as const).map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setFontSize(size)}
                          className={`flex-1 py-2 px-3 rounded-lg transition-all text-sm font-medium ${
                            fontSize === size
                              ? "bg-blue-500 text-white"
                              : isDarkMode
                                ? "bg-gray-700 hover:bg-gray-600"
                                : "bg-gray-200 hover:bg-gray-300"
                          }`}
                        >
                          {size === "small" && "A"}
                          {size === "medium" && "A"}
                          {size === "large" && "A"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">High Contrast</p>
                      <p className={`text-sm ${secondaryText}`}>
                        Increase color contrast for better visibility.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={highContrast}
                        onChange={() => setHighContrast(!highContrast)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isUnderDevelopmentSection && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">
                {SETTINGS_SECTIONS.find((s) => s.id === activeSection)?.name}
              </h2>
              <p className={subtleText}>This section is under development</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
