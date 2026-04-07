"use client";

import type React from "react";
import { useState, useRef, useEffect, memo, useCallback } from "react";

import gsap from "gsap";
import TextPlugin from "gsap/TextPlugin";

import {
  GITHUB_URL,
  LINKEDIN_URL,
  MAIL_TO_URL,
  RESUME_URL,
  WEBSITE_URL,
  YOUTUBE_CHANNEL_URL,
} from "@/constants/media-links";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useUISound } from "@/hooks/useUISounds";

gsap.registerPlugin(TextPlugin);

type LineRole = "prompt" | "output" | "blank";
type LineAnimation = "none" | "typewriter";
type LineVariant = "normal" | "matrix";

type TerminalLine = {
  id: number;
  role: LineRole;
  text: string;
  animation: LineAnimation;
  variant: LineVariant;
};

const OPEN_TARGETS = [
  "github",
  "linkedin",
  "youtube",
  "website",
  "resume",
  "mail",
] as const;

const COMMANDS = [
  "help",
  "clear",
  "echo",
  "date",
  "ls",
  "whoami",
  "about",
  "skills",
  "contact",
  "resume",
  "matrix",
  "neofetch",
  "fetch",
  "open",
  "theme",
  "hack",
  "sudo",
  "history",
] as const;

const TYPEWRITER_CHAR_SEC = 0.012;
const TYPEWRITER_MIN_DURATION = 0.03;
const MATRIX_CHAR_SEC = 0.0025;
const MATRIX_MIN_DURATION = 0.02;
const MATRIX_MAX_DURATION = 0.12;

const getTypeDuration = (text: string, variant: LineVariant) => {
  const charCount = text.length;
  if (charCount === 0) return 0;

  if (variant === "matrix") {
    const duration = Math.max(charCount * MATRIX_CHAR_SEC, MATRIX_MIN_DURATION);
    return Math.min(duration, MATRIX_MAX_DURATION);
  }

  return Math.max(charCount * TYPEWRITER_CHAR_SEC, TYPEWRITER_MIN_DURATION);
};

const TerminalHistoryLine = memo(function TerminalHistoryLine({
  line,
  registerEl,
  prefersReducedMotion,
}: {
  line: TerminalLine;
  registerEl: (id: number, el: HTMLSpanElement | null) => void;
  prefersReducedMotion: boolean;
}) {
  const spanRef = useRef<HTMLSpanElement | null>(null);

  const setEl = useCallback(
    (el: HTMLSpanElement | null) => {
      spanRef.current = el;
      registerEl(line.id, el);
    },
    [line.id, registerEl],
  );

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    if (line.animation !== "typewriter") return;
    if (line.variant !== "matrix") return;
    if (prefersReducedMotion) {
      el.textContent = line.text;
      return;
    }

    gsap.killTweensOf(el);
    el.textContent = "";
    gsap.to(el, {
      duration: getTypeDuration(line.text, "matrix"),
      text: line.text,
      ease: "none",
      overwrite: "auto",
    });
  }, [line.animation, line.text, line.variant, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return <div className="whitespace-pre-wrap">{line.text}</div>;
  }

  if (line.animation === "typewriter") {
    return (
      <div className="whitespace-pre-wrap">
        <span ref={setEl} />
      </div>
    );
  }

  return <div className="whitespace-pre-wrap">{line.text}</div>;
});

interface TerminalProps {
  isDarkMode?: boolean;
}

export default function Terminal({ isDarkMode }: TerminalProps) {
  const { playError, playRight } = useUISound();
  const [input, setInput] = useState("");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);
  const shouldReduceMotion = prefersReducedMotion || reduceMotion;
  const nextLineIdRef = useRef(1);
  const historyRef = useRef<TerminalLine[]>([]);
  const lineElsRef = useRef(new Map<number, HTMLSpanElement>());
  const typewriterTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const pendingTypewriterIdsRef = useRef<number[]>([]);
  const instantFillIdsRef = useRef(new Set<number>());

  const makeLine = (
    text: string,
    role: LineRole,
    animation: LineAnimation,
    variant: LineVariant = "normal",
  ): TerminalLine => ({
    id: nextLineIdRef.current++,
    role,
    text,
    animation,
    variant,
  });

  const [history, setHistory] = useState<TerminalLine[]>(() => {
    const initial: TerminalLine[] = [
      makeLine(`Last login: ${new Date().toLocaleString()}`, "output", "none"),
      makeLine("Welcome to macOS Terminal", "output", "none"),
      makeLine("Type 'help' to see available commands", "output", "none"),
      makeLine("", "blank", "none"),
    ];

    historyRef.current = initial;
    return initial;
  });
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isMatrixMode, setIsMatrixMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const matrixIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const HISTORY_CAP = 300;

  // Terminal is always dark
  const bgColor = "bg-black";
  const textColor = isMatrixMode ? "text-green-300" : "text-green-400";
  const caretColor = isMatrixMode ? "caret-green-300" : "caret-green-400";

  const stopMatrixMode = useCallback(() => {
    if (matrixIntervalRef.current) {
      clearInterval(matrixIntervalRef.current);
      matrixIntervalRef.current = null;
    }
    setIsMatrixMode(false);
  }, []);

  const setInputWithCaret = (nextValue: string, caret: number) => {
    setInput(nextValue);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  const registerEl = useCallback((id: number, el: HTMLSpanElement | null) => {
    if (!el) {
      lineElsRef.current.delete(id);
      return;
    }

    lineElsRef.current.set(id, el);

    if (instantFillIdsRef.current.has(id)) {
      const line = historyRef.current.find((l) => l.id === id);
      if (line) {
        gsap.killTweensOf(el);
        el.textContent = line.text;
      }
      instantFillIdsRef.current.delete(id);
    }
  }, []);

  const flushTypewriter = () => {
    if (typewriterTimelineRef.current) {
      typewriterTimelineRef.current.kill();
      typewriterTimelineRef.current = null;
    }
    for (const id of pendingTypewriterIdsRef.current) {
      instantFillIdsRef.current.add(id);
    }
    pendingTypewriterIdsRef.current = [];

    const lines = historyRef.current;
    for (const line of lines) {
      if (line.animation !== "typewriter") continue;
      const el = lineElsRef.current.get(line.id);
      if (!el) {
        instantFillIdsRef.current.add(line.id);
        continue;
      }
      gsap.killTweensOf(el);
      el.textContent = line.text;
    }
  };

  const interruptOutput = () => {
    if (typewriterTimelineRef.current) {
      typewriterTimelineRef.current.kill();
      typewriterTimelineRef.current = null;
    }

    pendingTypewriterIdsRef.current = [];
    instantFillIdsRef.current.clear();

    for (const el of lineElsRef.current.values()) {
      gsap.killTweensOf(el);
    }

    stopMatrixMode();
  };

  const clearScreen = () => {
    flushTypewriter();
    stopMatrixMode();
    pendingTypewriterIdsRef.current = [];
    lineElsRef.current.clear();
    instantFillIdsRef.current.clear();
    updateHistory(() => [makeLine("", "blank", "none")]);
  };

  const updateHistory = (updater: (prev: TerminalLine[]) => TerminalLine[]) => {
    setHistory((prev) => {
      const next = updater(prev);
      historyRef.current = next;
      return next;
    });
  };

  const appendLines = (lines: TerminalLine[]) => {
    updateHistory((prev) => {
      const next = [...prev, ...lines];

      if (next.length <= HISTORY_CAP) return next;

      const removed = next.slice(0, next.length - HISTORY_CAP);
      const removedIds = new Set(removed.map((l) => l.id));
      for (const line of removed) {
        lineElsRef.current.delete(line.id);
      }

      if (pendingTypewriterIdsRef.current.length > 0) {
        pendingTypewriterIdsRef.current =
          pendingTypewriterIdsRef.current.filter((id) => !removedIds.has(id));
      }
      for (const id of removedIds) {
        instantFillIdsRef.current.delete(id);
      }
      return next.slice(next.length - HISTORY_CAP);
    });
  };

  const appendPrompt = (raw: string) => {
    appendLines([makeLine(`maen@macbook-pro ~ $ ${raw}`, "prompt", "none")]);
    appendLines([makeLine("", "blank", "none")]);
  };

  const appendOutput = (texts: string[], variant: LineVariant = "normal") => {
    const lines: TerminalLine[] = texts.map((t) => {
      if (t.length === 0) return makeLine("", "blank", "none", variant);
      return makeLine(
        t,
        "output",
        shouldReduceMotion ? "none" : "typewriter",
        variant,
      );
    });

    if (!shouldReduceMotion && variant === "normal") {
      for (const line of lines) {
        if (line.animation === "typewriter") {
          pendingTypewriterIdsRef.current.push(line.id);
        }
      }
    }

    appendLines(lines);
  };

  const pumpTypewriterQueue = () => {
    if (shouldReduceMotion) return;

    if (pendingTypewriterIdsRef.current.length === 0) return;

    if (!typewriterTimelineRef.current) {
      typewriterTimelineRef.current = gsap.timeline({
        defaults: { ease: "none" },
      });
    }

    const tl = typewriterTimelineRef.current;

    // Keep adding tweens in order, only if the line DOM is mounted.
    while (pendingTypewriterIdsRef.current.length > 0) {
      const id = pendingTypewriterIdsRef.current[0];
      const el = lineElsRef.current.get(id);
      if (!el) break;

      pendingTypewriterIdsRef.current.shift();

      const line = historyRef.current.find((l) => l.id === id);
      if (!line) continue;

      gsap.killTweensOf(el);
      el.textContent = "";
      tl.to(el, {
        duration: getTypeDuration(line.text, "normal"),
        text: line.text,
      });
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const syncReducedMotion = () => {
      setPrefersReducedMotion(media?.matches ?? false);
    };

    syncReducedMotion();
    media?.addEventListener("change", syncReducedMotion);

    // Focus input when terminal is clicked
    const handleClick = () => {
      inputRef.current?.focus();
    };

    const terminal = terminalRef.current;
    if (terminal) {
      terminal.addEventListener("click", handleClick);
    }

    return () => {
      media?.removeEventListener("change", syncReducedMotion);
      if (terminal) {
        terminal.removeEventListener("click", handleClick);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      flushTypewriter();
      if (matrixIntervalRef.current) {
        clearInterval(matrixIntervalRef.current);
        matrixIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom when history changes
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    pumpTypewriterQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isCtrlC =
      e.ctrlKey &&
      (e.key === "c" || e.key === "C" || ("code" in e && e.code === "KeyC"));

    const isCtrlL =
      e.ctrlKey &&
      (e.key === "l" || e.key === "L" || ("code" in e && e.code === "KeyL"));
    const isCtrlU =
      e.ctrlKey &&
      (e.key === "u" || e.key === "U" || ("code" in e && e.code === "KeyU"));
    const isCtrlA =
      e.ctrlKey &&
      (e.key === "a" || e.key === "A" || ("code" in e && e.code === "KeyA"));
    const isCtrlE =
      e.ctrlKey &&
      (e.key === "e" || e.key === "E" || ("code" in e && e.code === "KeyE"));
    const isCtrlW =
      e.ctrlKey &&
      (e.key === "w" || e.key === "W" || ("code" in e && e.code === "KeyW"));

    if (isCtrlC) {
      const selectionText =
        typeof window !== "undefined"
          ? (window.getSelection?.()?.toString() ?? "")
          : "";
      const target = e.currentTarget;
      const hasInputSelection =
        target.selectionStart !== null &&
        target.selectionEnd !== null &&
        target.selectionStart !== target.selectionEnd;

      // If the user is selecting text (either in the input or in the terminal output),
      // keep the browser's native copy behavior.
      if (hasInputSelection || selectionText.length > 0) return;

      e.preventDefault();
      interruptOutput();
      setInput("");
      appendLines([
        makeLine("^C", "output", "none"),
        makeLine("", "blank", "none"),
      ]);
      return;
    }

    if (isCtrlL) {
      e.preventDefault();
      clearScreen();
      return;
    }

    if (isCtrlA) {
      e.preventDefault();
      setInputWithCaret(input, 0);
      return;
    }

    if (isCtrlE) {
      e.preventDefault();
      setInputWithCaret(input, input.length);
      return;
    }

    if (isCtrlU) {
      e.preventDefault();
      const target = e.currentTarget;
      const cursor = target.selectionStart ?? input.length;
      const nextValue = input.slice(cursor);
      setInputWithCaret(nextValue, 0);
      return;
    }

    if (isCtrlW) {
      e.preventDefault();
      const target = e.currentTarget;
      const cursor = target.selectionStart ?? input.length;
      let i = cursor;
      while (i > 0 && /\s/.test(input[i - 1] ?? "")) i -= 1;
      while (i > 0 && !/\s/.test(input[i - 1] ?? "")) i -= 1;
      const nextValue = input.slice(0, i) + input.slice(cursor);
      setInputWithCaret(nextValue, i);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const cursor = target.selectionStart ?? input.length;

      // Keep it simple: only autocomplete when cursor is at the end.
      if (cursor !== input.length) return;

      const trimmed = input.trimStart();
      const leadingSpaces = input.length - trimmed.length;
      const parts = trimmed.split(/\s+/).filter(Boolean);

      if (parts.length === 0) return;

      const first = (parts[0] ?? "").toLowerCase();

      if (parts.length === 1) {
        const prefix = first;
        const matches = COMMANDS.filter((c) => c.startsWith(prefix));

        if (matches.length === 1) {
          const nextValue =
            " ".repeat(leadingSpaces) +
            matches[0] +
            (input.endsWith(" ") ? "" : " ");
          setInputWithCaret(nextValue, nextValue.length);
          return;
        }

        if (matches.length > 1) {
          flushTypewriter();
          appendOutput([matches.join("  "), ""]);
        }

        return;
      }

      if (first === "open" && parts.length === 2) {
        const secondRaw = parts[1] ?? "";
        const prefix = secondRaw.toLowerCase();
        const matches = OPEN_TARGETS.filter((t) => t.startsWith(prefix));

        if (matches.length === 1) {
          const prefixIndex = input
            .toLowerCase()
            .lastIndexOf(secondRaw.toLowerCase());
          const head = prefixIndex >= 0 ? input.slice(0, prefixIndex) : input;
          const nextValue =
            head + matches[0] + (input.endsWith(" ") ? "" : " ");
          setInputWithCaret(nextValue, nextValue.length);
          return;
        }

        if (matches.length > 1) {
          flushTypewriter();
          appendOutput([matches.join("  "), ""]);
        }
      }
    }

    if (e.key === "Enter" && input.trim()) {
      executeCommand(input);
      setCommandHistory((prev) => [...prev, input]);
      setHistoryIndex(-1);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      navigateHistory(-1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      navigateHistory(1);
    }
  };

  const navigateHistory = (direction: number) => {
    if (commandHistory.length === 0) return;

    const newIndex = historyIndex + direction;

    if (newIndex >= commandHistory.length) {
      setHistoryIndex(-1);
      setInput("");
    } else if (newIndex >= 0) {
      setHistoryIndex(newIndex);
      setInput(commandHistory[commandHistory.length - 1 - newIndex]);
    }
  };

  const executeCommand = (cmd: string) => {
    flushTypewriter();

    const raw = cmd.trim();
    const parts = raw.split(/\s+/).filter(Boolean);
    const mainCommand = (parts[0] ?? "").toLowerCase();
    const args = parts.slice(1);

    const isSafeUrl = (value: string) =>
      /^(https?:\/\/|mailto:|\/)/i.test(value.trim());

    const openUrl = (url: string) => {
      if (typeof window === "undefined") {
        appendOutput(["Cannot open URL in this environment.", ""]);
        return;
      }

      const safe = url.trim();
      if (!isSafeUrl(safe)) {
        appendOutput([
          "Refusing to open unsafe URL scheme.",
          "Allowed schemes: http, https, mailto",
          "",
        ]);
        return;
      }

      window.open(safe, "_blank", "noopener,noreferrer");
    };

    const randomMatrixLine = () => {
      const alphabet = "01abcdef0123456789#$%&*@";
      const length = 44 + Math.floor(Math.random() * 32);
      let out = "";
      for (let i = 0; i < length; i += 1) {
        out += alphabet[Math.floor(Math.random() * alphabet.length)];
      }
      return out;
    };

    // Add command to history (تم تغيير اسم المستخدم هنا)
    appendPrompt(raw);

    let commandSucceeded = false;

    switch (mainCommand) {
      case "help":
        appendOutput([
          "Available commands:",
          "  help     - Show this help message",
          "  clear    - Clear the terminal",
          "  echo     - Print text",
          "  date     - Show current date and time",
          "  ls       - List files",
          "  whoami   - Show current user",
          "  about    - About me",
          "  skills   - My technical skills",
          "  contact  - Contact information",
          "  resume   - Open resume in new tab",
          "  matrix   - Toggle matrix mode",
          "  neofetch - Show system info",
          "  fetch    - Alias for neofetch",
          "  open     - Open a link (try: open github)",
          "  history  - Show recent commands",
          "  theme    - Show theme info",
          "  hack     - Definitely not hacking",
          "  sudo     - ...nope",
          "",
          "Shortcuts:",
          "  Ctrl+C - Interrupt output",
          "  Ctrl+L - Clear screen",
          "  Ctrl+U - Clear input before cursor",
          "  Ctrl+W - Delete previous word",
          "  Ctrl+A / Ctrl+E - Move cursor to start/end",
          "  Tab    - Autocomplete commands",
          "",
        ]);
        commandSucceeded = true;
        break;

      case "clear":
        clearScreen();
        commandSucceeded = true;
        break;

      case "echo":
        appendOutput([args.join(" "), ""]);
        commandSucceeded = true;
        break;

      case "date":
        appendOutput([new Date().toString(), ""]);
        commandSucceeded = true;
        break;

      case "ls":
        appendOutput([
          "Documents",
          "Projects",
          "Downloads",
          "Desktop",
          "3D_Models",
          "Animations",
          "GTA_VI_Clone",
          "",
        ]);
        commandSucceeded = true;
        break;

      case "whoami":
        appendOutput(["maen_ababneh", ""]);
        commandSucceeded = true;
        break;

      case "about":
        appendOutput([
          "┌──────────────────────────────────────────┐",
          "│ Maen Ababneh                             │",
          "│ Software Engineer & CS Student           │",
          "└──────────────────────────────────────────┘",
          "",
          "Welcome to my digital workspace!",
          "I am a software engineer and CS student at",
          "Al-Balqa Applied University in Jordan.",
          "I specialize in crafting high-performance,",
          "immersive web experiences that bridge the gap",
          "between complex logic and exceptional UI design.",
          "I have a deep passion for 3D on the web and",
          "micro-animations.",
          "",
        ]);
        commandSucceeded = true;
        break;

      case "skills":
        appendOutput([
          "┌──────────────┐",
          "│   Skills     │",
          "└──────────────┘",
          "",
          "Frontend & Architecture:",
          "• React / Next.js (App Router)",
          "• TypeScript / JavaScript",
          "• Tailwind CSS",
          "• State Management (Zustand, Redux)",
          "• Clean Architecture & Performance",
          "",
          "Animation & 3D Web:",
          "• GSAP (Timeline, ScrollTrigger, FLIP)",
          "• Framer Motion",
          "• Three.js / React Three Fiber",
          "• WebGL",
          "",
          "Backend & Tools:",
          "• Node.js / Express",
          "• Git / GitHub",
          "• Vercel / Deployment pipelines",
          "",
        ]);
        commandSucceeded = true;
        break;

      case "contact":
        appendOutput([
          "┌─────────┐",
          "│ Contact │",
          "└─────────┘",
          "",
          "Email:    hi@maenababneh.dev",
          "Website:  maenababneh.dev",
          "GitHub:   github.com/maenababneh",
          "LinkedIn: linkedin.com/in/maenababneh",
          "YouTube:  The Compass Tech",
          "",
        ]);
        commandSucceeded = true;
        break;

      case "resume":
        appendOutput(["Opening resume...", ""]);
        openUrl(RESUME_URL);
        commandSucceeded = true;
        break;

      case "sudo":
        appendOutput(["Nice try! This incident will be reported. 🤨", ""]);
        commandSucceeded = true;
        break;

      case "matrix":
        if (matrixIntervalRef.current) {
          flushTypewriter();
          stopMatrixMode();
          appendOutput(["Matrix mode disabled.", ""]);
          commandSucceeded = true;
          break;
        }

        setIsMatrixMode(true);
        appendOutput(["Matrix mode enabled.", ""]);
        matrixIntervalRef.current = setInterval(() => {
          appendOutput([randomMatrixLine()], "matrix");
        }, 60);
        commandSucceeded = true;
        break;

      case "neofetch":
      case "fetch":
        appendOutput([
          "                 -`                    maen@macbook-pro",
          "                .o+`                   ----------------",
          "               `ooo/                   OS: macOS (sim)",
          "              `+oooo:                  Shell: zsh (sim)",
          "             `+oooooo:                 Stack: Next.js / React / TS",
          "             -+oooooo+:                UI: Tailwind / GSAP",
          "           `/:-:++oooo+:               Website: maenababneh.dev",
          "          `/++++/+++++++:              GitHub: github.com/maenababneh",
          "         `/++++++++++++++:             LinkedIn: linkedin.com/in/maenababneh",
          "        `/+++ooooooooooooo/`           YouTube: @thecompasstech",
          "       ./ooosssso++osssssso+`",
          "      .oossssso-````/ossssss+`",
          "     -osssssso.      :ssssssso.",
          "    :osssssss/        osssso+++.",
          "   /ossssssss/        +ssssooo/-",
          "  `/ossssso+/:-        -:/+osssso+-",
          " `+sso+:-`                 `.-/+oso:",
          "`++:.                           `-/+/",
          "",
          "Tip: try `open github` or `matrix`",
          "",
        ]);
        commandSucceeded = true;
        break;

      case "open": {
        const targetRaw = args.join(" ").trim();
        const target = targetRaw.toLowerCase();

        if (!targetRaw) {
          appendOutput([
            "Usage: open <github|linkedin|youtube|website|resume|mail>",
            `Available: ${OPEN_TARGETS.join(", ")}`,
            "",
          ]);
          break;
        }

        const byTarget: Record<string, string> = {
          github: GITHUB_URL,
          linkedin: LINKEDIN_URL,
          youtube: YOUTUBE_CHANNEL_URL,
          website: WEBSITE_URL,
          resume: RESUME_URL,
          mail: MAIL_TO_URL,
        };

        if (byTarget[target]) {
          appendOutput([`Opening ${target}...`, ""]);
          openUrl(byTarget[target]);
          commandSucceeded = true;
          break;
        }

        if (isSafeUrl(targetRaw)) {
          appendOutput(["Opening URL...", ""]);
          openUrl(targetRaw);
          commandSucceeded = true;
          break;
        }

        appendOutput([
          `Unknown target: ${targetRaw}`,
          `Available: ${OPEN_TARGETS.join(", ")}`,
          "",
        ]);
        break;
      }

      case "history": {
        const max = 20;
        const slice = commandHistory.slice(
          Math.max(0, commandHistory.length - max),
        );
        const startIndex = commandHistory.length - slice.length + 1;

        if (slice.length === 0) {
          appendOutput(["No history yet.", ""]);
          break;
        }

        appendOutput([...slice.map((c, i) => `${startIndex + i}  ${c}`), ""]);
        commandSucceeded = true;
        break;
      }

      case "theme": {
        const systemTheme =
          typeof isDarkMode === "boolean"
            ? isDarkMode
              ? "dark"
              : "light"
            : "unknown";
        appendOutput([
          `System theme: ${systemTheme}`,
          "Terminal: always dark",
          "",
        ]);
        commandSucceeded = true;
        break;
      }

      case "hack":
        appendOutput([
          "Establishing secure connection...",
          "Bypassing firewall...",
          "Access granted.",
          "",
        ]);
        commandSucceeded = true;
        break;

      default:
        playError();
        appendOutput([
          `Command not found: ${mainCommand}`,
          'Type "help" to see available commands',
          "",
        ]);
    }

    if (commandSucceeded) {
      playRight();
    }
  };

  return (
    <div
      ref={terminalRef}
      className={`h-full ${bgColor} ${textColor} p-4 font-mono text-sm overflow-auto`}
    >
      {history.map((line) => (
        <TerminalHistoryLine
          key={line.id}
          line={line}
          registerEl={registerEl}
          prefersReducedMotion={shouldReduceMotion}
        />
      ))}

      <div className="flex">
        {/* تم تغيير اسم المستخدم في سطر الإدخال هنا أيضاً */}
        <span className="mr-2">maen@macbook-pro ~ $</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className={`flex-1 bg-transparent outline-none ${caretColor} ${textColor}`}
          autoFocus
        />
      </div>
    </div>
  );
}
