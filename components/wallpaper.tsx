import Image from "next/image";
import { useIsDarkMode } from "@/hooks/use-is-dark-mode";

export default function Wallpaper() {
  const { isDarkMode } = useIsDarkMode();

  return (
    <div className="absolute inset-0 -z-50 bg-black overflow-hidden">
      <Image
        src="/wallpaper-day.jpg"
        alt="macOS Day Wallpaper"
        fill
        priority
        quality={90}
        className={`object-cover transition-opacity duration-1000 ease-in-out ${
          isDarkMode ? "opacity-0" : "opacity-100"
        }`}
      />

      <Image
        src="/wallpaper-night.jpg"
        alt="macOS Night Wallpaper"
        fill
        priority
        quality={90}
        className={`object-cover transition-opacity duration-1000 ease-in-out ${
          isDarkMode ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
