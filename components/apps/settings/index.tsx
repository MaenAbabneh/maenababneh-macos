"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useUISound } from "@/hooks/useUISounds";
import { useDesktopStore } from "@/store/useDesktopStore";
import { useMediaStore } from "@/store/useMediaStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useSoundStore } from "@/store/useSoundStore";
import type { AccentColorId, WallpaperId } from "@/constants/appearance-config";
import { SettingsSidebar } from "./components/settings-sidebar";
import { AccessibilitySection } from "./components/sections/accessibility-section";
import { AppearanceSection } from "./components/sections/appearance-section";
import { GeneralSection } from "./components/sections/general-section";
import { NotificationsSection } from "./components/sections/notifications-section";
import { SoundSection } from "./components/sections/sound-section";
import { UnderDevelopmentSection } from "./components/sections/under-development-section";
import { WifiSection } from "./components/sections/wifi-section";
import { useSystemReducedMotion } from "./hooks/use-system-reduced-motion";
import { getSettingsThemeClasses } from "./utils";
import type { SettingsProps } from "@/types/apps/settings";

export default function Settings({ isDarkMode = true }: SettingsProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("general");
  const systemReducedMotion = useSystemReducedMotion();
  const { playSwitchOn, playDisabled } = useUISound();

  const sfxMuted = useSoundStore((state) => state.sfxMuted);
  const sfxVolume = useSoundStore((state) => state.sfxVolume);
  const setSfxMuted = useSoundStore((state) => state.setSfxMuted);
  const setSfxVolume = useSoundStore((state) => state.setSfxVolume);
  const globalMusicMuted = useMediaStore((state) => state.globalMusicMuted);
  const setGlobalMusicMuted = useMediaStore(
    (state) => state.setGlobalMusicMuted,
  );
  const musicVolume = useMediaStore((state) => state.musicVolume);
  const setMusicVolume = useMediaStore((state) => state.setMusicVolume);
  const spotifyVolume = useMediaStore((state) => state.spotifyVolume);
  const setSpotifyVolume = useMediaStore((state) => state.setSpotifyVolume);
  const reduceMotion = useSettingsStore((state) => state.reduceMotion);
  const setReduceMotion = useSettingsStore((state) => state.setReduceMotion);
  const wallpaperId = useSettingsStore((state) => state.wallpaperId);
  const setWallpaperId = useSettingsStore((state) => state.setWallpaperId);
  const accentColorId = useSettingsStore((state) => state.accentColorId);
  const setAccentColorId = useSettingsStore((state) => state.setAccentColorId);
  const fontSize = useSettingsStore((state) => state.fontSize);
  const setFontSize = useSettingsStore((state) => state.setFontSize);
  const highContrast = useSettingsStore((state) => state.highContrast);
  const setHighContrast = useSettingsStore((state) => state.setHighContrast);
  const wifiEnabled = useSettingsStore((state) => state.wifiEnabled);
  const toggleWifi = useSettingsStore((state) => state.toggleWifi);
  const pushNotification = useNotificationStore(
    (state) => state.pushNotification,
  );
  const openApp = useDesktopStore((state) => state.openApp);

  const isReducedMotion = reduceMotion || systemReducedMotion;
  const {
    textColor,
    bgColor,
    sidebarBg,
    cardBg,
    hoverBg,
    secondaryText,
    subtleText,
  } = getSettingsThemeClasses(isDarkMode);

  const wifiSignal = wifiEnabled ? "Excellent" : "Disconnected";
  const wifiStatusLabel = wifiEnabled ? "Connected" : "Off";
  const wifiStatusTone = wifiEnabled
    ? "text-emerald-400 bg-emerald-500/15"
    : "text-gray-400 bg-gray-500/15";

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
    activeSection !== "accessibility" &&
    activeSection !== "wifi" &&
    activeSection !== "notifications";

  const isDarkTheme =
    (resolvedTheme ?? (isDarkMode ? "dark" : "light")) === "dark";

  const handleThemeToggle = () => {
    const nextTheme = isDarkTheme ? "light" : "dark";
    setTheme(nextTheme);
    playSwitchOn();
  };

  const openContactApp = () => {
    openApp({
      id: "contact",
      title: "Let's Talk",
      component: "Contact",
      position: { x: 220, y: 120 },
      size: { width: 860, height: 620 },
    });
  };

  const handlePreviewNotification = () => {
    pushNotification({
      appName: "Let's Talk",
      appIcon: "💬",
      title: "ready to chat?",
      message:
        "I'm here to answer your questions and discuss potential opportunities. Feel free to reach out!",
      action: {
        label: "Open",
        appId: "contact",
      },
    });
    playSwitchOn();
  };

  const handleSnakeNotificationPreview = () => {
    pushNotification({
      appName: "Snake",
      appIcon: "🐍",
      title: "New High Score!",
      message: "10 points",
    });
    playSwitchOn();
  };

  const handlePresetApply = (
    nextWallpaperId: WallpaperId,
    nextAccentColorId: AccentColorId,
    nextIsDarkMode: boolean,
  ) => {
    setWallpaperId(nextWallpaperId);
    setAccentColorId(nextAccentColorId);
    setTheme(nextIsDarkMode ? "dark" : "light");
    playSwitchOn();
  };

  const handleWifiToggle = () => {
    toggleWifi();
    if (wifiEnabled) {
      playDisabled();
      return;
    }
    playSwitchOn();
  };

  return (
    <div className={`flex h-full overflow-hidden ${bgColor} ${textColor}`}>
      <SettingsSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isDarkMode={isDarkMode}
        sidebarBg={sidebarBg}
        hoverBg={hoverBg}
      />

      <div className="flex-1 h-full overflow-y-auto p-6">
        {activeSection === "general" && (
          <GeneralSection
            cardBg={cardBg}
            secondaryText={secondaryText}
            isReducedMotion={isReducedMotion}
            globalMusicMuted={globalMusicMuted}
            sfxMuted={sfxMuted}
            isDarkMode={isDarkMode}
          />
        )}

        {activeSection === "appearance" && (
          <AppearanceSection
            cardBg={cardBg}
            secondaryText={secondaryText}
            isDarkMode={isDarkMode}
            isDarkTheme={isDarkTheme}
            wallpaperId={wallpaperId}
            accentColorId={accentColorId}
            onThemeToggle={handleThemeToggle}
            onWallpaperChange={setWallpaperId}
            onAccentChange={setAccentColorId}
            onPresetApply={handlePresetApply}
          />
        )}

        {activeSection === "sound" && (
          <SoundSection
            cardBg={cardBg}
            secondaryText={secondaryText}
            globalMusicMuted={globalMusicMuted}
            onGlobalMusicMuteToggle={handleGlobalMusicMuteToggle}
            averageMusicVolumePercent={averageMusicVolumePercent}
            onGlobalMusicVolumeChange={handleGlobalMusicVolumeChange}
            sfxMuted={sfxMuted}
            onMuteToggle={handleMuteToggle}
            sfxVolume={sfxVolume}
            onSfxVolumeChange={(event) =>
              setSfxVolume(Number.parseInt(event.target.value, 10))
            }
          />
        )}

        {activeSection === "accessibility" && (
          <AccessibilitySection
            cardBg={cardBg}
            secondaryText={secondaryText}
            reduceMotion={reduceMotion}
            onReduceMotionToggle={handleReduceMotionToggle}
            isReducedMotion={isReducedMotion}
            fontSize={fontSize}
            onFontSizeChange={setFontSize}
            highContrast={highContrast}
            onHighContrastToggle={() => setHighContrast(!highContrast)}
            isDarkMode={isDarkMode}
          />
        )}

        {activeSection === "wifi" && (
          <WifiSection
            cardBg={cardBg}
            secondaryText={secondaryText}
            wifiEnabled={wifiEnabled}
            wifiStatusTone={wifiStatusTone}
            wifiStatusLabel={wifiStatusLabel}
            wifiSignal={wifiSignal}
            onWifiToggle={handleWifiToggle}
          />
        )}

        {activeSection === "notifications" && (
          <NotificationsSection
            cardBg={cardBg}
            secondaryText={secondaryText}
            onPreviewNotification={handlePreviewNotification}
            onOpenContactApp={openContactApp}
            onSnakePreview={handleSnakeNotificationPreview}
          />
        )}

        {isUnderDevelopmentSection && (
          <UnderDevelopmentSection
            activeSection={activeSection}
            subtleText={subtleText}
          />
        )}
      </div>
    </div>
  );
}
