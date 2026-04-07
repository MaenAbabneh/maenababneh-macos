import Image from "next/image";
import { Globe, Github } from "lucide-react";
import { PERSONAL_WEBSITES } from "@/constants/media-links";

interface WebsiteProps {
  isDarkMode?: boolean;
}

export default function Website({ isDarkMode = true }: WebsiteProps) {
  const textColor = isDarkMode ? "text-white" : "text-gray-800";
  const mutedTextColor = isDarkMode ? "text-gray-400" : "text-gray-600";
  const borderColor = isDarkMode ? "border-gray-700" : "border-gray-200";
  const cardBg = isDarkMode ? "bg-gray-900" : "bg-white";

  return (
    <div className={`p-6 ${textColor}`}>
      <h2 className="text-2xl font-bold mb-6">My Projects</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PERSONAL_WEBSITES.map((site, index) => (
          <div
            key={index}
            className={`border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 ${borderColor} ${cardBg} group`} // 👈 أضفنا group هنا
          >
            <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
              <Image
                src={site.image || "/placeholder.svg"}
                alt={site.title}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-500" // 👈 زووم خفيف عند الـ Hover
              />

              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4">
                {site.githubUrl && (
                  <a
                    href={site.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors transform translate-y-4 group-hover:translate-y-0 duration-300"
                    title="View Source Code"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                )}

                {site.demoUrl && (
                  <a
                    href={site.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-blue-500/80 hover:bg-blue-500 text-white transition-colors transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75"
                    title="Live Demo"
                  >
                    <Globe className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">{site.title}</h3>
              <p className={`${mutedTextColor} text-sm line-clamp-3`}>
                {site.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
