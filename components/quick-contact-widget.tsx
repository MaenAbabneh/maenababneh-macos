"use client";

import { useState, useRef, useEffect } from "react";
import { Mail, MessageCircle, Send, X, Loader2, Check } from "lucide-react";
import { WHATSAPP_URL } from "@/constants/media-links";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function QuickContactWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPanelMounted, setIsPanelMounted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputsRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsPanelMounted(true);
    }
  }, [isOpen]);

  useGSAP(
    () => {
      if (
        isOpen &&
        isPanelMounted &&
        panelRef.current &&
        inputsRef.current &&
        buttonsRef.current
      ) {
        const timeline = gsap.timeline();

        // Panel slide in with fade
        timeline.fromTo(
          panelRef.current,
          { opacity: 0, y: 20, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.7)" },
          0,
        );

        // Input fields stagger
        timeline.fromTo(
          inputsRef.current.querySelectorAll("input, textarea"),
          { opacity: 0, y: 10, x: 20 },
          {
            opacity: 1,
            y: 0,
            x: 0,
            duration: 0.4,
            stagger: 0.08,
            ease: "power2.out",
          },
          0.15,
        );

        // Action buttons stagger
        timeline.fromTo(
          buttonsRef.current.querySelectorAll("button, a"),
          { opacity: 0, scale: 0.8 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.3,
            stagger: 0.1,
            ease: "back.out(1.5)",
          },
          0.35,
        );
      } else if (!isOpen && isPanelMounted && panelRef.current) {
        // Close animation
        gsap.to(panelRef.current, {
          opacity: 0,
          y: 20,
          scale: 0.9,
          duration: 0.28,
          ease: "power2.in",
          onComplete: () => {
            setIsPanelMounted(false);
          },
        });
      }
    },
    { dependencies: [isOpen, isPanelMounted], revertOnUpdate: true },
  );

  // Icon rotation animation on button
  useEffect(() => {
    if (buttonRef.current) {
      const icon = buttonRef.current.querySelector("svg");
      if (icon) {
        if (isOpen) {
          gsap.to(icon, { rotation: 180, duration: 0.4, ease: "power2.out" });
        } else {
          gsap.to(icon, { rotation: 0, duration: 0.4, ease: "power2.out" });
        }
      }
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !message) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setName("");
        setEmail("");
        setPhone("");
        setMessage("");
        setTimeout(() => {
          setIsOpen(false);
        }, 1500);
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-28 right-6 z-[80] sm:bottom-8 sm:right-8"
    >
      {isPanelMounted ? (
        <div
          ref={panelRef}
          className="w-[min(92vw,360px)] rounded-3xl border border-white/15 bg-zinc-950/92 p-4 text-white shadow-2xl backdrop-blur-xl"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Let&apos;s Talk</p>
              <p className="text-xs text-white/60">Email or WhatsApp</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Close quick contact"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-0">
            <div ref={inputsRef} className="space-y-2.5">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Name"
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-white/10 bg-white/7 px-3 py-2.5 text-sm outline-none placeholder:text-white/40 focus:border-blue-400/50 disabled:opacity-50"
              />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                type="email"
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-white/10 bg-white/7 px-3 py-2.5 text-sm outline-none placeholder:text-white/40 focus:border-blue-400/50 disabled:opacity-50"
              />
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Phone"
                type="tel"
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-white/10 bg-white/7 px-3 py-2.5 text-sm outline-none placeholder:text-white/40 focus:border-blue-400/50 disabled:opacity-50"
              />
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Message"
                rows={4}
                disabled={isSubmitting}
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/7 px-3 py-2.5 text-sm outline-none placeholder:text-white/40 focus:border-blue-400/50 disabled:opacity-50"
              />
            </div>

            {submitStatus === "success" && (
              <div className="mt-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-400">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">Message sent!</span>
                </div>
              </div>
            )}

            {submitStatus === "error" && (
              <div className="mt-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-center">
                <span className="text-sm font-medium text-red-400">
                  Failed to send. Try again.
                </span>
              </div>
            )}

            <div ref={buttonsRef} className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="submit"
                disabled={isSubmitting || !name || !email || !phone || !message}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-blue-500 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-blue-400 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isSubmitting ? "Sending" : "Send"}
              </button>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-500 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-400"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </form>
        </div>
      ) : (
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-2xl shadow-blue-500/30 transition hover:scale-105 hover:bg-blue-400"
          aria-label="Open quick contact"
        >
          <Mail className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
