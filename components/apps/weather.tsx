"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  MapPin,
  LocateFixed,
  Droplets,
  Wind,
  Sunrise,
  Sunset,
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_WEATHER_CITY,
  WEATHER_DATA,
  type WeatherCityData,
  type WeatherCondition,
} from "@/constants/weather-data";
import {
  fetchCitySuggestions,
  fetchWeatherByCity,
  fetchWeatherByCoords,
  normalizeWeatherCondition,
  type CitySuggestion,
} from "@/lib/weather-service";
import { useWeatherStore } from "@/store/useWeatherStore";
import { useSettingsStore } from "@/store/useSettingsStore";

interface WeatherProps {
  isDarkMode?: boolean;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
  drift?: number;
}

const parseClockLabelToMinutes = (timeLabel: string) => {
  const match = timeLabel.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  const rawHour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (!Number.isFinite(rawHour) || !Number.isFinite(minute)) return null;

  const normalizedHour = rawHour % 12;
  const hour24 = period === "PM" ? normalizedHour + 12 : normalizedHour;
  return hour24 * 60 + minute;
};

const getFallbackDaytime = (sunrise: string, sunset: string) => {
  const sunriseMinutes = parseClockLabelToMinutes(sunrise);
  const sunsetMinutes = parseClockLabelToMinutes(sunset);
  if (sunriseMinutes === null || sunsetMinutes === null) {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return currentMinutes >= sunriseMinutes && currentMinutes < sunsetMinutes;
};

const NIGHT_STARS = [
  { x: 0.08, y: 0.08, size: 1.4 },
  { x: 0.14, y: 0.15, size: 1.2 },
  { x: 0.22, y: 0.07, size: 1.8 },
  { x: 0.28, y: 0.17, size: 1.3 },
  { x: 0.34, y: 0.1, size: 1.5 },
  { x: 0.42, y: 0.18, size: 1.1 },
  { x: 0.5, y: 0.08, size: 1.6 },
  { x: 0.58, y: 0.16, size: 1.2 },
  { x: 0.66, y: 0.09, size: 1.4 },
  { x: 0.74, y: 0.17, size: 1.2 },
  { x: 0.82, y: 0.07, size: 1.7 },
  { x: 0.9, y: 0.14, size: 1.3 },
];

const drawSunOrMoon = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dayProgress: number,
  targetCondition: WeatherCondition,
  rotationDeg: number,
  scale: number,
) => {
  const clampedProgress = Math.min(1, Math.max(0, dayProgress));
  const sunAlpha = clampedProgress;
  const moonAlpha = 1 - clampedProgress;

  const centerX = width * 0.16 + moonAlpha * width * 0.02;
  const centerY = height * 0.2;

  if (sunAlpha > 0.02) {
    ctx.save();
    ctx.globalAlpha = sunAlpha;
    ctx.translate(centerX, centerY);
    ctx.rotate((rotationDeg * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);
    const sunRadius =
      targetCondition === "sunny" ? width * 0.06 : width * 0.045;

    const glow = ctx.createRadialGradient(
      centerX,
      centerY,
      sunRadius * 0.4,
      centerX,
      centerY,
      sunRadius * 2.6,
    );
    glow.addColorStop(0, "rgba(255, 220, 120, 0.55)");
    glow.addColorStop(1, "rgba(255, 220, 120, 0)");

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, sunRadius * 2.6, 0, Math.PI * 2);
    ctx.fill();

    if (targetCondition === "sunny") {
      ctx.strokeStyle = "rgba(255, 214, 112, 0.45)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * 2 * i) / 10;
        const rayStart = sunRadius * 1.22;
        const rayEnd = sunRadius * 1.85;
        ctx.beginPath();
        ctx.moveTo(
          centerX + Math.cos(angle) * rayStart,
          centerY + Math.sin(angle) * rayStart,
        );
        ctx.lineTo(
          centerX + Math.cos(angle) * rayEnd,
          centerY + Math.sin(angle) * rayEnd,
        );
        ctx.stroke();
      }
    }

    ctx.fillStyle = "rgba(255, 226, 140, 0.95)";
    ctx.beginPath();
    ctx.arc(centerX, centerY, sunRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (moonAlpha < 0.02) return;

  ctx.save();
  ctx.globalAlpha = moonAlpha;
  ctx.translate(centerX, centerY);
  ctx.rotate((rotationDeg * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.translate(-centerX, -centerY);

  const moonRadius = width * 0.05;
  const halo = ctx.createRadialGradient(
    centerX,
    centerY,
    moonRadius * 0.3,
    centerX,
    centerY,
    moonRadius * 2.1,
  );
  halo.addColorStop(0, "rgba(180, 200, 255, 0.35)");
  halo.addColorStop(1, "rgba(180, 200, 255, 0)");

  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(centerX, centerY, moonRadius * 2.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(225, 232, 255, 0.92)";
  ctx.beginPath();
  ctx.arc(centerX, centerY, moonRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(35, 45, 80, 0.55)";
  ctx.beginPath();
  ctx.arc(
    centerX + moonRadius * 0.4,
    centerY - moonRadius * 0.15,
    moonRadius * 0.85,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  if (targetCondition !== "cloudy" && targetCondition !== "rainy") {
    for (const star of NIGHT_STARS) {
      ctx.fillStyle = "rgba(230, 240, 255, 0.6)";
      ctx.beginPath();
      ctx.arc(width * star.x, height * star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
};

const celsiusToFahrenheit = (value: number) => Math.round((value * 9) / 5 + 32);
const fahrenheitToCelsius = (value: number) =>
  Math.round(((value - 32) * 5) / 9);
const kmhToMph = (value: number) => Math.round(value / 1.60934);
const mphToKmh = (value: number) => Math.round(value * 1.60934);

const convertWeatherUnit = (
  data: WeatherCityData,
  fromUnit: "metric" | "imperial",
  toUnit: "metric" | "imperial",
): WeatherCityData => {
  if (fromUnit === toUnit) return data;

  const tempConverter =
    toUnit === "imperial" ? celsiusToFahrenheit : fahrenheitToCelsius;
  const windConverter = toUnit === "imperial" ? kmhToMph : mphToKmh;

  return {
    current: {
      ...data.current,
      temp: tempConverter(data.current.temp),
      feelsLike: tempConverter(data.current.feelsLike),
      windSpeed: windConverter(data.current.windSpeed),
    },
    forecast: data.forecast.map((day) => ({
      ...day,
      temp: tempConverter(day.temp),
      highTemp:
        typeof day.highTemp === "number"
          ? tempConverter(day.highTemp)
          : undefined,
      lowTemp:
        typeof day.lowTemp === "number"
          ? tempConverter(day.lowTemp)
          : undefined,
    })),
  };
};

export default function Weather({ isDarkMode = true }: WeatherProps) {
  const selectedCity = useWeatherStore((state) => state.selectedCity);
  const unit = useWeatherStore((state) => state.unit);
  const locationCoords = useWeatherStore((state) => state.locationCoords);
  const autoLocateAttempted = useWeatherStore(
    (state) => state.autoLocateAttempted,
  );
  const setSelectedCity = useWeatherStore((state) => state.setSelectedCity);
  const setUnit = useWeatherStore((state) => state.setUnit);
  const setLocationCoords = useWeatherStore((state) => state.setLocationCoords);
  const clearLocationCoords = useWeatherStore(
    (state) => state.clearLocationCoords,
  );
  const setAutoLocateAttempted = useWeatherStore(
    (state) => state.setAutoLocateAttempted,
  );
  const reduceMotion = useSettingsStore((state) => state.reduceMotion);

  const [displayCity, setDisplayCity] = useState(DEFAULT_WEATHER_CITY);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [weather, setWeather] = useState<WeatherCityData>(
    WEATHER_DATA[DEFAULT_WEATHER_CITY],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"api" | "fallback">("fallback");
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  const condition: WeatherCondition = normalizeWeatherCondition(
    weather.current.condition,
  );
  const isDaytime =
    typeof weather.current.isDaytime === "boolean"
      ? weather.current.isDaytime
      : getFallbackDaytime(weather.current.sunrise, weather.current.sunset);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const forecastRef = useRef<HTMLDivElement>(null);
  const weatherPanelsRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotionRef = useRef(false);
  const blurTimeoutRef = useRef<number | null>(null);
  const dayProgressRef = useRef({ value: isDaytime ? 1 : 0 });
  const celestialMotionRef = useRef({ angle: 0, scale: 1 });
  const particles = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);

  const bgColor = isDarkMode ? "bg-gray-900" : "bg-gray-100";
  const textColor = isDarkMode ? "text-white" : "text-gray-800";
  const cardBg = isDarkMode ? "bg-gray-800" : "bg-white";
  const borderColor = isDarkMode ? "border-gray-700" : "border-gray-200";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      prefersReducedMotionRef.current = media.matches || reduceMotion;
    };

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [reduceMotion]);

  useEffect(() => {
    const target = isDaytime ? 1 : 0;

    if (prefersReducedMotionRef.current) {
      dayProgressRef.current.value = target;
      celestialMotionRef.current.scale = 1;
      return;
    }

    gsap.killTweensOf(dayProgressRef.current);
    gsap.killTweensOf(celestialMotionRef.current);

    const timeline = gsap.timeline({ defaults: { overwrite: true } });
    timeline.to(
      dayProgressRef.current,
      {
        value: target,
        duration: 0.42,
        ease: "power3.inOut",
      },
      0,
    );
    timeline.to(
      celestialMotionRef.current,
      {
        angle: `+=220`,
        duration: 0.46,
        ease: "back.out(1.8)",
      },
      0,
    );
    timeline.fromTo(
      celestialMotionRef.current,
      { scale: 0.84 },
      {
        scale: 1.1,
        duration: 0.2,
        ease: "power3.out",
      },
      0,
    );
    timeline.to(
      celestialMotionRef.current,
      {
        scale: 1,
        duration: 0.18,
        ease: "power2.inOut",
      },
      0.2,
    );
  }, [isDaytime]);

  const initParticles = useCallback(
    (targetCondition: WeatherCondition) => {
      particles.current = [];

      const count =
        targetCondition === "rainy"
          ? 90
          : targetCondition === "snowy"
            ? 72
            : targetCondition === "sunny"
              ? 42
              : 20;

      for (let i = 0; i < count; i++) {
        let particle: Particle;

        if (targetCondition === "rainy") {
          particle = {
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 2 + 1,
            speedX: Math.random() * 0.45 - 0.225,
            speedY: Math.random() * 3.6 + 4.8,
            opacity: Math.random() * 0.4 + 0.45,
            color: isDarkMode
              ? "rgba(120, 160, 255, 0.8)"
              : "rgba(0, 90, 190, 0.6)",
          };
        } else if (targetCondition === "snowy") {
          particle = {
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 2,
            speedX: Math.random() * 0.55 - 0.275,
            speedY: Math.random() * 0.8 + 0.65,
            opacity: Math.random() * 0.3 + 0.7,
            color: "rgba(255, 255, 255, 0.8)",
            drift: Math.random() * 0.75 + 0.25,
          };
        } else if (targetCondition === "sunny") {
          particle = {
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 4 + 1,
            speedX: (Math.random() - 0.5) * 0.22,
            speedY: (Math.random() - 0.5) * 0.22,
            opacity: Math.random() * 0.5 + 0.3,
            color: isDarkMode
              ? `rgba(${255}, ${200 + Math.random() * 55}, ${0}, ${Math.random() * 0.5 + 0.3})`
              : `rgba(${255}, ${200 + Math.random() * 55}, ${0}, ${Math.random() * 0.7 + 0.3})`,
          };
        } else {
          // Clouds
          particle = {
            x: Math.random() * 100,
            y: Math.random() * 35 + 8,
            size: Math.random() * 26 + 24,
            speedX: Math.random() * 0.065 + 0.02,
            speedY: 0,
            opacity: Math.random() * 0.2 + 0.18,
            color: isDarkMode
              ? "rgba(200, 200, 220, 0.3)"
              : "rgba(255, 255, 255, 0.7)",
          };
        }

        particles.current.push(particle);
      }
    },
    [isDarkMode],
  );

  const updateParticles = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      particles.current.forEach((p) => {
        // Convert percentage to actual position
        const x = (p.x / 100) * width;
        const y = (p.y / 100) * height;

        // Draw particle
        ctx.beginPath();

        if (condition === "rainy") {
          // Draw raindrops
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size / 2;
          ctx.lineCap = "round";
          ctx.moveTo(x, y);
          ctx.lineTo(x + p.speedX * 1.25, y + p.size * 3.2);
          ctx.stroke();
        } else if (condition === "snowy") {
          // Draw snowflakes
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(1, p.size * 0.22);
          ctx.beginPath();
          ctx.moveTo(x - p.size, y);
          ctx.lineTo(x + p.size, y);
          ctx.moveTo(x, y - p.size);
          ctx.lineTo(x, y + p.size);
          ctx.moveTo(x - p.size * 0.72, y - p.size * 0.72);
          ctx.lineTo(x + p.size * 0.72, y + p.size * 0.72);
          ctx.moveTo(x - p.size * 0.72, y + p.size * 0.72);
          ctx.lineTo(x + p.size * 0.72, y - p.size * 0.72);
          ctx.stroke();
        } else if (condition === "sunny") {
          // Draw sun particles
          ctx.fillStyle = p.color;
          ctx.shadowColor = "rgba(255, 200, 80, 0.55)";
          ctx.shadowBlur = p.size * 2.2;
          ctx.arc(x, y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          // Draw clouds
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(
            x,
            y + p.size * 0.12,
            p.size * 0.9,
            p.size * 0.55,
            0,
            0,
            Math.PI * 2,
          );
          ctx.ellipse(
            x - p.size * 0.5,
            y,
            p.size * 0.48,
            p.size * 0.42,
            0,
            0,
            Math.PI * 2,
          );
          ctx.ellipse(
            x + p.size * 0.52,
            y - p.size * 0.05,
            p.size * 0.52,
            p.size * 0.44,
            0,
            0,
            Math.PI * 2,
          );
          ctx.ellipse(
            x,
            y - p.size * 0.28,
            p.size * 0.55,
            p.size * 0.48,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }

        // Update position
        p.x += p.speedX * 0.07;
        p.y += p.speedY * 0.07;

        // Reset position if out of bounds
        if (condition === "rainy") {
          if (p.y > 100) {
            p.y = 0;
            p.x = Math.random() * 100;
          }
          if (p.x < 0 || p.x > 100) {
            p.x = Math.random() * 100;
          }
        } else if (condition === "snowy") {
          p.x += Math.sin((p.y + p.size) * 0.06) * (p.drift ?? 0.3) * 0.03;
          if (p.y > 100) {
            p.y = 0;
            p.x = Math.random() * 100;
          }
          if (p.x < 0 || p.x > 100) {
            p.x = Math.random() * 100;
          }
        } else if (condition === "sunny") {
          // Keep sun particles within bounds
          if (p.x < 0) p.x = 100;
          if (p.x > 100) p.x = 0;
          if (p.y < 0) p.y = 100;
          if (p.y > 100) p.y = 0;
        } else {
          // Cloud movement
          if (p.x < -45) p.x = 140;
          if (p.x > 140) p.x = -45;
        }
      });
    },
    [condition],
  );

  // Initialize particles and animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize particles based on condition
    initParticles(condition);

    // Start animation
    const animate = () => {
      if (!canvas || !ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw main day/night celestial body before weather particles
      drawSunOrMoon(
        ctx,
        canvas.width,
        canvas.height,
        dayProgressRef.current.value,
        condition,
        celestialMotionRef.current.angle,
        celestialMotionRef.current.scale,
      );

      // Update and draw particles
      updateParticles(ctx, canvas.width, canvas.height);

      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [condition, initParticles, isDaytime, updateParticles]);

  useGSAP(
    () => {
      if (!showSuggestions || !suggestions.length) return;
      if (prefersReducedMotionRef.current) return;

      const items = gsap.utils.toArray<HTMLElement>("[data-suggestion-item]");
      gsap.fromTo(
        items,
        { opacity: 0, y: -8 },
        {
          opacity: 1,
          y: 0,
          duration: 0.32,
          stagger: 0.05,
          ease: "power2.out",
          overwrite: true,
        },
      );
    },
    { scope: searchPanelRef, dependencies: [showSuggestions, suggestions] },
  );

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-forecast-card]");
      if (!cards.length) return;

      if (prefersReducedMotionRef.current) {
        gsap.set(cards, { clearProps: "all" });
        return;
      }

      gsap.killTweensOf(cards);
      gsap.fromTo(
        cards,
        { opacity: 0, scale: 0.98, y: 8 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.36,
          stagger: 0.06,
          ease: "power2.out",
          overwrite: true,
          clearProps: "transform,opacity",
        },
      );
    },
    {
      scope: forecastRef,
      dependencies: [weather.forecast, displayCity, unit],
    },
  );

  useGSAP(
    () => {
      if (prefersReducedMotionRef.current) {
        if (canvasRef.current) {
          gsap.set(canvasRef.current, { opacity: 1, clearProps: "all" });
        }
        return;
      }

      if (weatherPanelsRef.current) {
        gsap.fromTo(
          weatherPanelsRef.current,
          { opacity: 0.9, y: 6 },
          {
            opacity: 1,
            y: 0,
            duration: 0.42,
            ease: "power2.out",
            overwrite: true,
            clearProps: "transform,opacity",
          },
        );
      }

      if (canvasRef.current) {
        gsap.fromTo(
          canvasRef.current,
          { opacity: 0.55 },
          { opacity: 1, duration: 0.48, ease: "power2.out", overwrite: true },
        );
      }
    },
    { scope: weatherPanelsRef, dependencies: [condition] },
  );

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setIsSuggestionsLoading(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSuggestionsLoading(true);
        const results = await fetchCitySuggestions(query, controller.signal);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSuggestionsLoading(false);
        setActiveSuggestionIndex(-1);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchQuery]);

  const requestCurrentLocation = useCallback(
    (manual: boolean) => {
      if (!navigator.geolocation) {
        setError("Geolocation is not supported in this browser.");
        setAutoLocateAttempted(true);
        return;
      }

      setLocationLoading(true);
      if (manual) setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationCoords({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          setAutoLocateAttempted(true);
          setLocationLoading(false);
        },
        (locationError) => {
          if (
            manual ||
            locationError.code !== locationError.PERMISSION_DENIED
          ) {
            setError(
              "Unable to detect current location. Please search by city.",
            );
          }
          setAutoLocateAttempted(true);
          setLocationLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5 * 60 * 1000,
        },
      );
    },
    [setAutoLocateAttempted, setLocationCoords],
  );

  useEffect(() => {
    if (autoLocateAttempted) return;
    requestCurrentLocation(false);
  }, [autoLocateAttempted, requestCurrentLocation]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadWeather = async () => {
      setIsLoading(true);
      setError(null);

      const result = locationCoords
        ? await fetchWeatherByCoords(locationCoords, unit, controller.signal)
        : await fetchWeatherByCity(selectedCity, unit, controller.signal);

      if (!isMounted) return;

      setWeather(result.data);
      setDisplayCity(result.city);
      setSource(result.source);
      setUpdatedAt(result.updatedAt);

      if (
        result.source === "fallback" &&
        process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY
      ) {
        setError(
          "Live weather is temporarily unavailable. Showing fallback data.",
        );
      }

      setIsLoading(false);
      setLocationLoading(false);
    };

    loadWeather().catch(() => {
      if (!isMounted) return;
      setError("Unable to load weather data right now.");
      setIsLoading(false);
      setLocationLoading(false);
    });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [selectedCity, unit, locationCoords]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        window.clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const handleSuggestionSelect = (suggestion: CitySuggestion) => {
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    setSearchQuery("");
    setSelectedCity(suggestion.query);
  };

  const handleSearch = () => {
    if (showSuggestions && activeSuggestionIndex >= 0) {
      const suggestion = suggestions[activeSuggestionIndex];
      if (suggestion) {
        handleSuggestionSelect(suggestion);
        return;
      }
    }

    const query = searchQuery.trim();
    if (!query) return;

    setSelectedCity(query);
    setSearchQuery("");
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const handleUnitChange = (nextUnit: "metric" | "imperial") => {
    if (nextUnit === unit) return;

    setWeather((previous) => convertWeatherUnit(previous, unit, nextUnit));
    setUnit(nextUnit);
  };

  const getWeatherIcon = (weatherCondition: WeatherCondition) => {
    if (weatherCondition === "sunny") return <Sun className="w-6 h-6" />;
    if (weatherCondition === "partly-cloudy")
      return <Cloud className="w-6 h-6" />;
    if (weatherCondition === "rainy") return <CloudRain className="w-6 h-6" />;
    if (weatherCondition === "snowy") return <CloudSnow className="w-6 h-6" />;
    return <Cloud className="w-6 h-6" />;
  };

  const windSpeedLabel = unit === "metric" ? "km/h" : "mph";
  const temperatureUnitLabel = unit === "metric" ? "C" : "F";
  const updatedAtLabel = updatedAt
    ? new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(updatedAt))
    : null;

  return (
    <div
      className={`h-full ${bgColor} ${textColor} flex flex-col relative overflow-hidden`}
    >
      {/* Canvas for weather effects */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Search bar */}
        <div className="p-4 flex items-center space-x-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Search city (e.g. Amman)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(searchQuery.trim().length >= 2)}
              onBlur={() => {
                blurTimeoutRef.current = window.setTimeout(() => {
                  setShowSuggestions(false);
                }, 120);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setShowSuggestions(true);
                  setActiveSuggestionIndex((prev) =>
                    Math.min(prev + 1, suggestions.length - 1),
                  );
                  return;
                }

                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveSuggestionIndex((prev) => Math.max(prev - 1, 0));
                  return;
                }

                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                  return;
                }

                if (e.key === "Escape") {
                  e.preventDefault();
                  setShowSuggestions(false);
                  setActiveSuggestionIndex(-1);
                }
              }}
              className={`pl-10 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"}`}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />

            {showSuggestions &&
              (searchQuery.trim().length >= 2 || suggestions.length > 0) && (
                <div
                  ref={searchPanelRef}
                  className={`absolute left-0 right-0 mt-2 rounded-md border z-30 overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"}`}
                >
                  {isSuggestionsLoading ? (
                    <p className="px-3 py-2 text-sm text-gray-500">
                      Loading suggestions...
                    </p>
                  ) : suggestions.length ? (
                    <div className="max-h-52 overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          data-suggestion-item
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSuggestionSelect(suggestion);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                            activeSuggestionIndex === index
                              ? isDarkMode
                                ? "bg-gray-700 text-white"
                                : "bg-gray-100 text-gray-900"
                              : isDarkMode
                                ? "text-gray-200 hover:bg-gray-700"
                                : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {suggestion.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="px-3 py-2 text-sm text-gray-500">
                      No city suggestions found.
                    </p>
                  )}
                </div>
              )}
          </div>

          <Button
            type="button"
            variant={isDarkMode ? "outline" : "secondary"}
            className={isDarkMode ? "border-gray-700" : ""}
            onClick={() => {
              clearLocationCoords();
              requestCurrentLocation(true);
            }}
            disabled={locationLoading}
          >
            <LocateFixed className="w-4 h-4 mr-1" />
            {locationLoading ? "Locating..." : "My Location"}
          </Button>

          <Button
            type="button"
            variant={unit === "metric" ? "default" : "outline"}
            onClick={() => handleUnitChange("metric")}
          >
            °C
          </Button>
          <Button
            type="button"
            variant={unit === "imperial" ? "default" : "outline"}
            onClick={() => handleUnitChange("imperial")}
          >
            °F
          </Button>
          <Button
            type="button"
            onClick={handleSearch}
            variant={isDarkMode ? "outline" : "default"}
            className={isDarkMode ? "border-gray-700" : ""}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Search"}
          </Button>
        </div>

        {(error || updatedAtLabel) && (
          <div className="px-6 pb-1">
            {error && <p className="text-xs text-amber-500">{error}</p>}
            {updatedAtLabel && (
              <p className="text-xs text-gray-500">
                Updated {updatedAtLabel}{" "}
                {source === "fallback" ? "(fallback)" : "(live)"}
              </p>
            )}
          </div>
        )}

        {/* Current weather */}
        <div ref={weatherPanelsRef}>
          <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between">
            <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-500" />
                <h2 className="text-2xl font-bold">{displayCity}</h2>
              </div>
              <p className="text-gray-500 text-sm mt-1">Today</p>

              <div className="flex items-center mt-4">
                <div className="text-6xl font-light mr-4">
                  {weather.current.temp}°{temperatureUnitLabel}
                </div>
                <div>
                  <p className="text-lg">{weather.current.condition}</p>
                  <p className="text-sm text-gray-500">
                    Feels like {weather.current.feelsLike}°
                    {temperatureUnitLabel}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`${cardBg} p-4 rounded-lg border ${borderColor} grid grid-cols-2 gap-4 w-full md:w-auto`}
            >
              <div className="flex items-center">
                <Droplets className="w-5 h-5 mr-2 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Humidity</p>
                  <p className="font-medium">{weather.current.humidity}%</p>
                </div>
              </div>
              <div className="flex items-center">
                <Wind className="w-5 h-5 mr-2 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Wind</p>
                  <p className="font-medium">
                    {weather.current.windSpeed} {windSpeedLabel}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <Sunrise className="w-5 h-5 mr-2 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-500">Sunrise</p>
                  <p className="font-medium">{weather.current.sunrise}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Sunset className="w-5 h-5 mr-2 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-500">Sunset</p>
                  <p className="font-medium">{weather.current.sunset}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Forecast */}
        <div className="px-6 mt-4">
          <h3 className="text-lg font-medium mb-3">5-Day Forecast</h3>
          <div
            ref={forecastRef}
            className={`grid grid-cols-5 gap-2 ${cardBg} rounded-lg border ${borderColor} p-4`}
          >
            {weather.forecast.map((day, index) => (
              <div
                key={index}
                data-forecast-card
                className="flex flex-col items-center"
              >
                <p className="font-medium">{day.day}</p>
                <div className="my-2">{getWeatherIcon(day.condition)}</div>
                <p className="text-lg font-medium">
                  {day.temp}°{temperatureUnitLabel}
                </p>
                <p className="text-xs text-gray-500">
                  H {day.highTemp ?? day.temp}°{temperatureUnitLabel} / L{" "}
                  {day.lowTemp ?? day.temp}°{temperatureUnitLabel}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* City selector */}
        <div className="px-6 mt-6">
          <h3 className="text-lg font-medium mb-3">Popular Cities</h3>
          <div className="flex flex-wrap gap-2">
            {Object.keys(WEATHER_DATA).map((cityName) => (
              <Button
                key={cityName}
                variant={displayCity === cityName ? "default" : "outline"}
                className={`${displayCity === cityName ? "" : isDarkMode ? "border-gray-700" : "border-gray-300"}`}
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCity(cityName);
                }}
              >
                {cityName}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
