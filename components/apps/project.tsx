"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ExternalLink,
  FileText,
  Github,
  Globe,
  Loader2,
  Star,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import type { GitHubProjectSummary } from "@/types";

interface ProjectsProps {
  isDarkMode?: boolean;
  project?: GitHubProjectSummary | null;
}

type ApiResponse = {
  projects: GitHubProjectSummary[];
  source: "github" | "fallback" | "error";
  message?: string;
};

const formatUpdatedAt = (value: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

const normalizeAssetUrl = (value: unknown, projectUrl?: string) => {
  if (typeof value !== "string" || !value) return undefined;

  let urlStr = value;

  if (urlStr.includes("github.com") && urlStr.includes("/blob/")) {
    urlStr = urlStr.replace("/blob/", "/raw/");
  }

  if (urlStr.startsWith("http") || urlStr.startsWith("data:")) return urlStr;

  if (urlStr.startsWith("public/")) {
    return `/${urlStr.slice("public/".length)}`;
  }

  if (projectUrl && !urlStr.startsWith("#") && !urlStr.startsWith("mailto:")) {
    const cleanPath = urlStr.replace(/^(\.\/|\/)/, "");
    const repoPath = projectUrl
      .replace("https://github.com/", "")
      .replace(/\/$/, "");
    return `https://github.com/${repoPath}/raw/HEAD/${cleanPath}`;
  }

  return urlStr;
};

const ProjectCard = ({
  project,
  isDarkMode,
}: {
  project: GitHubProjectSummary;
  isDarkMode: boolean;
}) => {
  const cardBg = isDarkMode ? "bg-white/5" : "bg-gray-50";
  const borderColor = isDarkMode ? "border-white/10" : "border-gray-200";
  const textColor = isDarkMode ? "text-white" : "text-gray-900";
  const mutedTextColor = isDarkMode ? "text-gray-400" : "text-gray-600";

  return (
    <article
      className={`overflow-hidden rounded-2xl border ${borderColor} ${cardBg} shadow-lg transition-transform duration-200 hover:-translate-y-1`}
    >
      <div className="relative h-40 overflow-hidden">
        {project.coverImageUrl ? (
          <Image
            src={project.coverImageUrl}
            alt={project.name}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover"
            quality={80}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3 text-white">
          <div>
            <h3 className="truncate text-lg font-semibold">{project.name}</h3>
            <p className="text-xs text-white/75">{project.nameWithOwner}</p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-xs backdrop-blur-md">
            <Star className="h-3.5 w-3.5" />
            {project.stargazerCount}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <p className={`line-clamp-3 text-sm ${mutedTextColor}`}>
          {project.description ?? "No description provided."}
        </p>

        <div
          className={`flex flex-wrap items-center gap-2 text-xs ${textColor}`}
        >
          {project.primaryLanguage ? (
            <span className="rounded-full bg-black/5 px-3 py-1 dark:bg-white/10">
              {project.primaryLanguage.name}
            </span>
          ) : null}
          <span className="rounded-full bg-black/5 px-3 py-1 dark:bg-white/10">
            Updated {formatUpdatedAt(project.updatedAt)}
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={project.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Github className="h-4 w-4" />
            GitHub
          </Link>
          {project.homepageUrl ? (
            <Link
              href={project.homepageUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
            >
              <Globe className="h-4 w-4" />
              Live Demo
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export default function Projects({
  isDarkMode = true,
  project,
}: ProjectsProps) {
  const [projects, setProjects] = useState<GitHubProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(!project);
  const [error, setError] = useState<string | null>(null);

  const textColor = isDarkMode ? "text-white" : "text-gray-900";
  const mutedTextColor = isDarkMode ? "text-gray-400" : "text-gray-600";
  const panelBg = isDarkMode ? "bg-[#0c1120]" : "bg-white";
  const borderColor = isDarkMode ? "border-white/10" : "border-gray-200";

  const markdownComponents = useMemo(
    () => ({
      img: ({ src, alt, ...props }: React.ComponentPropsWithoutRef<"img">) => {
        const normalizedSrc = normalizeAssetUrl(src, project?.url);
        if (!normalizedSrc) return null;

        return (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={normalizedSrc}
            alt={alt ?? "Markdown image"}
            loading="lazy"
            {...props}
            className={`my-4 inline-block h-auto max-w-full rounded-lg object-contain shadow-sm ${props.className || ""}`}
          />
        );
      },
      video: ({
        src,
        controls,
        children,
        poster,
        ...props
      }: React.ComponentPropsWithoutRef<"video">) => {
        const normalizedSrc = normalizeAssetUrl(src, project?.url);
        return normalizedSrc ? (
          <video
            src={normalizedSrc}
            controls={controls ?? true}
            poster={normalizeAssetUrl(poster, project?.url)}
            className="my-4 w-full rounded-2xl border border-white/10 bg-black shadow-lg"
            {...props}
          >
            {children}
          </video>
        ) : null;
      },
      source: ({ src, ...props }: React.ComponentPropsWithoutRef<"source">) => {
        const normalizedSrc = normalizeAssetUrl(src, project?.url);
        return normalizedSrc ? <source src={normalizedSrc} {...props} /> : null;
      },
      iframe: ({
        src,
        title,
        ...props
      }: React.ComponentPropsWithoutRef<"iframe">) => {
        const normalizedSrc = normalizeAssetUrl(src, project?.url);
        return normalizedSrc ? (
          <iframe
            src={normalizedSrc}
            title={title ?? "Embedded content"}
            className="my-4 aspect-video w-full rounded-2xl border border-white/10 bg-black shadow-lg"
            allowFullScreen
            {...props}
          />
        ) : null;
      },
      table: ({ children }: { children?: React.ReactNode }) => (
        <div className="my-4 w-full overflow-x-auto pb-2">
          <table className="w-full min-w-[400px] border-collapse text-sm">
            {children}
          </table>
        </div>
      ),
      th: ({ children }: { children?: React.ReactNode }) => (
        <th
          className={`border-b p-2 text-left font-semibold ${isDarkMode ? "border-white/20" : "border-gray-300"}`}
        >
          {children}
        </th>
      ),
      td: ({ children }: { children?: React.ReactNode }) => (
        <td
          className={`border-b p-2 ${isDarkMode ? "border-white/10" : "border-gray-200"}`}
        >
          {children}
        </td>
      ),
      h1: ({ children }: { children?: React.ReactNode }) => (
        <h1 className="mb-4 text-2xl font-bold tracking-tight">{children}</h1>
      ),
      h2: ({ children }: { children?: React.ReactNode }) => (
        <h2 className="mt-6 mb-3 text-xl font-semibold">{children}</h2>
      ),
      h3: ({ children }: { children?: React.ReactNode }) => (
        <h3 className="mt-5 mb-2 text-lg font-semibold">{children}</h3>
      ),
      p: ({ children }: { children?: React.ReactNode }) => (
        <p className="mb-3 leading-7">{children}</p>
      ),
      ul: ({ children }: { children?: React.ReactNode }) => (
        <ul className="mb-3 list-disc space-y-1 pl-6">{children}</ul>
      ),
      ol: ({ children }: { children?: React.ReactNode }) => (
        <ol className="mb-3 list-decimal space-y-1 pl-6">{children}</ol>
      ),
      li: ({ children }: { children?: React.ReactNode }) => (
        <li className="leading-7">{children}</li>
      ),
      a: ({
        href,
        children,
      }: {
        href?: string;
        children?: React.ReactNode;
      }) => (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className={
            isDarkMode
              ? "text-cyan-300 hover:text-cyan-200 break-words"
              : "text-cyan-700 hover:text-cyan-800 break-words"
          }
        >
          {children}
        </a>
      ),
      code: ({
        inline,
        children,
      }: {
        inline?: boolean;
        children?: React.ReactNode;
      }) =>
        inline ? (
          <code
            className={`rounded px-1 py-0.5 text-[0.85em] ${isDarkMode ? "bg-white/10 text-white" : "bg-black/5 text-gray-900"}`}
          >
            {children}
          </code>
        ) : (
          <code
            className={`block overflow-x-auto rounded-2xl border p-4 text-sm ${isDarkMode ? "border-white/10 bg-black/30 text-gray-100" : "border-gray-200 bg-gray-50 text-gray-900"}`}
          >
            {children}
          </code>
        ),
      pre: ({ children }: { children?: React.ReactNode }) => (
        <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-gray-100">
          {children}
        </pre>
      ),
      blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote
          className={`border-l-4 pl-4 italic ${isDarkMode ? "border-white/20 text-gray-300" : "border-gray-300 text-gray-700"}`}
        >
          {children}
        </blockquote>
      ),
    }),
    [isDarkMode, project?.url], // تحديث هام جداً هنا
  );

  useEffect(() => {
    if (project) return;

    let cancelled = false;

    const loadProjects = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/github/projects", {
          cache: "no-store",
        });
        const data = (await response.json()) as ApiResponse;

        if (!response.ok) {
          throw new Error(data.message ?? "Failed to load projects");
        }

        if (!cancelled) {
          setProjects(data.projects);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Unable to load GitHub projects",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, [project]);

  const summaryProjects = useMemo(() => projects, [projects]);

  if (project) {
    return (
      <div className={`h-full overflow-y-auto ${panelBg} ${textColor}`}>
        <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-6 p-6 lg:p-8">
          <div
            className={`overflow-hidden rounded-3xl border ${borderColor} shadow-2xl`}
          >
            <div className="relative h-72 overflow-hidden">
              {project.coverImageUrl ? (
                <Image
                  src={project.coverImageUrl}
                  alt={project.name}
                  fill
                  sizes="(min-width: 1024px) 100vw, 100vw"
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-slate-950" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />

              <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-white/75">
                      <Github className="h-4 w-4" />
                      {project.nameWithOwner}
                    </div>
                    <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-white lg:text-5xl">
                      {project.name}
                    </h2>
                    <p className="max-w-3xl text-sm text-white/80 lg:text-base">
                      {project.description ?? "No description provided."}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white backdrop-blur-md">
                    <Star className="h-5 w-5" />
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                        Stars
                      </div>
                      <div className="text-lg font-semibold">
                        {project.stargazerCount}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* التعديل هنا: استخدام grid-cols-1 للشاشات الصغيرة، و 3 أعمدة للكبيرة لمرونة أكبر */}
            <div className="grid gap-6 p-6 lg:grid-cols-3 lg:p-8">
              {/* القسم الأول: التفاصيل والـ README (يأخذ عمودين من أصل 3) */}
              <div className="space-y-5 lg:col-span-2 min-w-0">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div
                    className={`rounded-2xl border ${borderColor} bg-white/5 p-4`}
                  >
                    <p
                      className={`text-xs uppercase tracking-[0.2em] ${mutedTextColor}`}
                    >
                      Language
                    </p>
                    <p className="mt-2 font-semibold">
                      {project.primaryLanguage?.name ?? "Unknown"}
                    </p>
                  </div>
                  <div
                    className={`rounded-2xl border ${borderColor} bg-white/5 p-4`}
                  >
                    <p
                      className={`text-xs uppercase tracking-[0.2em] ${mutedTextColor}`}
                    >
                      Updated
                    </p>
                    <p className="mt-2 font-semibold">
                      {formatUpdatedAt(project.updatedAt)}
                    </p>
                  </div>
                  <div
                    className={`rounded-2xl border ${borderColor} bg-white/5 p-4`}
                  >
                    <p
                      className={`text-xs uppercase tracking-[0.2em] ${mutedTextColor}`}
                    >
                      Source
                    </p>
                    <p className="mt-2 font-semibold capitalize">
                      {project.source}
                    </p>
                  </div>
                </div>

                <div
                  className={`rounded-3xl border ${borderColor} bg-white/5 p-5`}
                >
                  <div className="mb-4 flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4" />
                    README File
                  </div>
                  <div
                    className={`max-h-[32rem] overflow-x-hidden overflow-y-auto break-words rounded-2xl border p-4 text-sm leading-7 ${isDarkMode ? "border-white/10 bg-black/20 text-gray-200" : "border-gray-200 bg-white text-gray-800"}`}
                  >
                    {project.readmePreview ? (
                      <ReactMarkdown
                        rehypePlugins={[rehypeRaw]}
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {project.readmePreview}
                      </ReactMarkdown>
                    ) : (
                      <p className={mutedTextColor}>
                        No README preview was found for this repository.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* القسم الثاني: Actions (يأخذ عموداً واحداً، ومكانه مضمون ولن يختفي) */}
              <div className="space-y-4 lg:col-span-1 min-w-0">
                <div
                  className={`rounded-3xl border ${borderColor} bg-white/5 p-5 sticky top-6`}
                >
                  <div className="mb-4 flex items-center gap-2 text-sm font-medium">
                    <ArrowUpRight className="h-4 w-4" />
                    Actions
                  </div>

                  <div className="flex flex-col gap-3">
                    <Link
                      href={project.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition-opacity hover:opacity-90"
                    >
                      <Github className="h-4 w-4" />
                      Open on GitHub
                      <ExternalLink className="h-4 w-4" />
                    </Link>

                    {project.homepageUrl ? (
                      <Link
                        href={project.homepageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold transition-colors hover:bg-white/10"
                      >
                        <Globe className="h-4 w-4" />
                        Open Live Demo
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full overflow-y-auto ${panelBg} ${textColor}`}>
      <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-6 p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight">Projects</h2>
            <p className={mutedTextColor}>
              Featured repositories pulled from your GitHub pinned projects.
            </p>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {isLoading
              ? "Loading pinned repositories..."
              : `${summaryProjects.length} projects`}
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-[24rem] items-center justify-center rounded-3xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading project folders...
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {summaryProjects.map((item) => (
              <ProjectCard
                key={item.id}
                project={item}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
