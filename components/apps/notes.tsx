"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useNotesStore } from "@/store/useNotesStore";
import { useSettingsStore } from "@/store/useSettingsStore";

interface NotesProps {
  isDarkMode?: boolean;
}

type ViewMode = "preview" | "edit";

export default function Notes({ isDarkMode = true }: NotesProps) {
  const notes = useNotesStore((s) => s.notes);
  const selectedNoteId = useNotesStore((s) => s.selectedNoteId);
  const selectNote = useNotesStore((s) => s.selectNote);
  const updateSelectedNoteContent = useNotesStore(
    (s) => s.updateSelectedNoteContent,
  );
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);

  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const prefersReducedMotionRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const selectedNote = notes.find((note) => note.id === selectedNoteId);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateSelectedNoteContent(e.target.value);
  };

  const textColor = isDarkMode ? "text-white" : "text-gray-800";
  const bgColor = isDarkMode ? "bg-gray-900" : "bg-white";
  const sidebarBg = isDarkMode ? "bg-gray-800" : "bg-gray-100";
  const borderColor = isDarkMode ? "border-gray-700" : "border-gray-200";
  const hoverBg = isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200";
  const selectedBg = isDarkMode ? "bg-gray-700" : "bg-gray-300";
  const toggleBg = isDarkMode ? "bg-gray-800" : "bg-gray-100";
  const toggleHoverBg = isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200";
  const toggleText = isDarkMode ? "text-gray-200" : "text-gray-700";

  useEffect(() => {
    if (typeof window === "undefined") return;
    prefersReducedMotionRef.current =
      (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ??
        false) || reduceMotion;
  }, [reduceMotion]);

  useGSAP(
    () => {
      const el = contentRef.current;
      if (!el) return;

      if (prefersReducedMotionRef.current) {
        gsap.set(el, { opacity: 1, y: 0, clearProps: "transform" });
        return;
      }

      gsap.killTweensOf(el);
      gsap.fromTo(
        el,
        { opacity: 0, y: 6 },
        {
          opacity: 1,
          y: 0,
          duration: 0.18,
          ease: "power2.out",
          overwrite: "auto",
        },
      );
    },
    { scope: contentRef, dependencies: [selectedNoteId, viewMode] },
  );

  const markdownComponents = useMemo(() => {
    const normalizeHref = (rawHref?: string) => {
      if (!rawHref) return undefined;
      if (rawHref.startsWith("#")) return rawHref;
      if (rawHref.startsWith("/")) return rawHref;
      if (rawHref.startsWith("//")) return `https:${rawHref}`;

      // If it already has a scheme (https:, mailto:, tel:, etc.), keep it.
      if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(rawHref)) return rawHref;

      return `https://${rawHref}`;
    };

    const linkClass = isDarkMode
      ? "text-blue-400 hover:text-blue-300"
      : "text-blue-600 hover:text-blue-700";
    const inlineCodeClass = isDarkMode
      ? "bg-gray-800 text-gray-100"
      : "bg-gray-100 text-gray-800";
    const blockBg = isDarkMode ? "bg-gray-800" : "bg-gray-100";
    const blockBorder = isDarkMode ? "border-gray-700" : "border-gray-200";

    return {
      h1: ({ children }: { children?: React.ReactNode }) => (
        <h1 className="text-2xl font-bold mb-4">{children}</h1>
      ),
      h2: ({ children }: { children?: React.ReactNode }) => (
        <h2 className="text-xl font-semibold mt-6 mb-3">{children}</h2>
      ),
      h3: ({ children }: { children?: React.ReactNode }) => (
        <h3 className="text-lg font-semibold mt-5 mb-2">{children}</h3>
      ),
      p: ({ children }: { children?: React.ReactNode }) => (
        <p className="leading-7 mb-3">{children}</p>
      ),
      ul: ({ children }: { children?: React.ReactNode }) => (
        <ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul>
      ),
      ol: ({ children }: { children?: React.ReactNode }) => (
        <ol className="list-decimal pl-6 mb-3 space-y-1">{children}</ol>
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
          href={normalizeHref(href)}
          className={linkClass}
          target="_blank"
          rel="noopener noreferrer"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            if (!normalizeHref(href)) e.preventDefault();
          }}
        >
          {children}
        </a>
      ),
      pre: ({ children }: { children?: React.ReactNode }) => (
        <pre
          className={`p-3 rounded-lg overflow-x-auto border ${blockBorder} ${blockBg} mb-3`}
        >
          {children}
        </pre>
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
            className={`px-1 py-0.5 rounded ${inlineCodeClass} text-[0.85em]`}
          >
            {children}
          </code>
        ) : (
          <code className="text-sm">{children}</code>
        ),
    };
  }, [isDarkMode]);

  return (
    <div className={`flex h-full ${bgColor} ${textColor}`}>
      {/* Sidebar */}
      <div
        className={`w-64 ${sidebarBg} border-r ${borderColor} flex flex-col`}
      >
        <div className="p-3 border-b border-gray-700 flex justify-between items-center">
          <h2 className="font-medium">Notes</h2>
          <button className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {notes.map((note) => (
            <button
              key={note.id}
              type="button"
              className={`w-full text-left p-3 ${selectedNoteId === note.id ? selectedBg : hoverBg}`}
              onClick={() => selectNote(note.id)}
            >
              <h3 className="font-medium truncate">{note.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{note.date}</p>
              <p
                className={`text-sm mt-1 truncate ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                {note.content.split("\n")[0].replace(/^#+ /, "")}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Note content */}
      <div className="flex-1 flex flex-col">
        {selectedNote && (
          <>
            <div
              className={`p-3 border-b ${borderColor} flex items-start justify-between gap-3`}
            >
              <div>
                <h2 className="font-medium">{selectedNote.title}</h2>
                <p className="text-xs text-gray-500">{selectedNote.date}</p>
              </div>
              <button
                type="button"
                className={`px-2 py-1 text-xs rounded border ${borderColor} ${toggleBg} ${toggleHoverBg} ${toggleText}`}
                onClick={() =>
                  setViewMode((m) => (m === "preview" ? "edit" : "preview"))
                }
              >
                {viewMode === "preview" ? "Edit" : "Preview"}
              </button>
            </div>

            <div className="flex-1 relative overflow-hidden bg-inherit">
              {viewMode === "preview" ? (
                // حاوية وضع القراءة
                <div
                  ref={contentRef}
                  className="absolute inset-0 overflow-y-auto p-5 md:p-8"
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    skipHtml
                    components={markdownComponents}
                  >
                    {selectedNote.content}
                  </ReactMarkdown>
                </div>
              ) : (
                // حاوية وضع التعديل
                <textarea
                  className={`absolute inset-0 w-full h-full resize-none overflow-y-auto p-5 md:p-8 bg-transparent ${textColor} focus:outline-none leading-relaxed`}
                  value={selectedNote.content}
                  onChange={handleContentChange}
                  spellCheck="false"
                  placeholder="Start typing your note in Markdown..."
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
