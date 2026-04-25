"use client";

import { useState, type ChangeEvent } from "react";
import { useTheme } from "next-themes";
import type { AccentColorId, WallpaperId } from "@/constants/appearance-config";
import { useUISound } from "@/hooks/useUISounds";
import { useDesktopStoreSelectors } from "@/store/useDesktopStore";
import { useMediaStoreSelectors } from "@/store/useMediaStore";
import { useNotificationStoreSelectors } from "@/store/useNotificationStore";
import { useSettingsStoreSelectors } from "@/store/useSettingsStore";
import { useSoundStoreSelectors } from "@/store/useSoundStore";
import type { SettingsProps } from "@/types/apps/settings";
import { useSystemReducedMotion } from "./use-system-reduced-motion";

export const useSettingsController = ({ isDarkMode = true }: SettingsProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("general");
  const systemReducedMotion = useSystemReducedMotion();
  const { playSwitchOn, playDisabled } = useUISound();

  const sfxMuted = useSoundStoreSelectors.use.sfxMuted();
  const sfxVolume = useSoundStoreSelectors.use.sfxVolume();
  const setSfxMuted = useSoundStoreSelectors.use.setSfxMuted();
  const setSfxVolume = useSoundStoreSelectors.use.setSfxVolume();

  const globalMusicMuted = useMediaStoreSelectors.use.globalMusicMuted();
  const setGlobalMusicMuted = useMediaStoreSelectors.use.setGlobalMusicMuted();
  const musicVolume = useMediaStoreSelectors.use.musicVolume();
  const setMusicVolume = useMediaStoreSelectors.use.setMusicVolume();
  const spotifyVolume = useMediaStoreSelectors.use.spotifyVolume();
  const setSpotifyVolume = useMediaStoreSelectors.use.setSpotifyVolume();

  const reduceMotion = useSettingsStoreSelectors.use.reduceMotion();
  const setReduceMotion = useSettingsStoreSelectors.use.setReduceMotion();
  const wallpaperId = useSettingsStoreSelectors.use.wallpaperId();
  const setWallpaperId = useSettingsStoreSelectors.use.setWallpaperId();
  const accentColorId = useSettingsStoreSelectors.use.accentColorId();
  const setAccentColorId = useSettingsStoreSelectors.use.setAccentColorId();
  const fontSize = useSettingsStoreSelectors.use.fontSize();
  const setFontSize = useSettingsStoreSelectors.use.setFontSize();
  const highContrast = useSettingsStoreSelectors.use.highContrast();
  const setHighContrast = useSettingsStoreSelectors.use.setHighContrast();
  const wifiEnabled = useSettingsStoreSelectors.use.wifiEnabled();
  const toggleWifi = useSettingsStoreSelectors.use.toggleWifi();

  const pushNotification = useNotificationStoreSelectors.use.pushNotification();
  const openApp = useDesktopStoreSelectors.use.openApp();

  const isReducedMotion = reduceMotion || systemReducedMotion;
  const isDarkTheme =
    (resolvedTheme ?? (isDarkMode ? "dark" : "light")) === "dark";

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
    event: ChangeEvent<HTMLInputElement>,
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

  const onSfxVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSfxVolume(Number.parseInt(event.target.value, 10));
  };

  return {
    activeSection,
    setActiveSection,
    isReducedMotion,
    isDarkTheme,
    textColor: isDarkMode ? "text-white" : "text-gray-900",
    bgColor: isDarkMode ? "bg-[#0f172a]" : "bg-white",
    sidebarBg: isDarkMode ? "bg-white/5" : "bg-gray-50",
    cardBg: isDarkMode ? "bg-white/5" : "bg-gray-50",
    hoverBg: isDarkMode ? "hover:bg-white/10" : "hover:bg-gray-100",
    secondaryText: isDarkMode ? "text-gray-300" : "text-gray-700",
    subtleText: isDarkMode ? "text-gray-400" : "text-gray-500",
    sfxMuted,
    sfxVolume,
    globalMusicMuted,
    musicVolume,
    spotifyVolume,
    reduceMotion,
    wallpaperId,
    accentColorId,
    fontSize,
    highContrast,
    wifiEnabled,
    wifiSignal,
    wifiStatusLabel,
    wifiStatusTone,
    averageMusicVolumePercent,
    handleMuteToggle,
    handleGlobalMusicMuteToggle,
    handleReduceMotionToggle,
    handleGlobalMusicVolumeChange,
    handleThemeToggle,
    handlePresetApply,
    handleWifiToggle,
    openContactApp,
    handlePreviewNotification,
    handleSnakeNotificationPreview,
    onSfxVolumeChange,
    setFontSize,
    setHighContrast,
    onWallpaperChange: setWallpaperId,
    onAccentChange: setAccentColorId,
    onReduceMotionChange: setReduceMotion,
    onGlobalMusicMuteChange: setGlobalMusicMuted,
    onSfxMuteChange: setSfxMuted,
    isUnderDevelopmentSection,
  };
};
