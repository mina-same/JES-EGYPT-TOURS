"use client";

import React, { useEffect, useRef } from "react";
import { type Socket } from "socket.io-client";
import { toast } from "@/hooks/use-toast";
import { useBooking } from "@/contexts/BookingContext";
import { useContactForm } from "@/contexts/ContactFormContext";
import { useTailorMade } from "@/contexts/TailorMadeContext";
import { useRouter } from "next/navigation";
import { Mail, ChevronRight, Calendar, MessageSquare } from "lucide-react";
import { getAdminSocket } from "@/lib/realtime/adminSocket";
import { API_ENDPOINTS } from "@/config/api";

import { ILocalizedString } from "@/types/tour";

type AdminNotificationType = "booking" | "tailorMade" | "contact";

interface AdminNotificationPayload {
  type: AdminNotificationType;
  title: string | ILocalizedString;
  entityId: string;
  createdAt: string;
}

export default function AdminRealtimeListener() {
  const router = useRouter();
  const { refreshUnreadCount } = useTailorMade();
  const { refreshCount: refreshContactCount } = useContactForm();
  const { refreshCount: refreshBookingCount } = useBooking();

  const socketRef = useRef<Socket | null>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeOscRef = useRef<OscillatorNode | null>(null);
  const activeGainRef = useRef<GainNode | null>(null);

  const stopNotificationSound = () => {
    try {
      const osc = activeOscRef.current;
      const gain = activeGainRef.current;
      const ctx = audioCtxRef.current;
      if (gain && ctx) {
        const t = ctx.currentTime;
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(gain.gain.value || 0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
      }
      if (osc) {
        try {
          osc.stop();
        } catch {
          // ignore
        }
        try {
          osc.disconnect();
        } catch {
          // ignore
        }
      }
      if (gain) {
        try {
          gain.disconnect();
        } catch {
          // ignore
        }
      }
    } finally {
      activeOscRef.current = null;
      activeGainRef.current = null;
    }
  };

  const ensureAudioContext = async () => {
    if (typeof window === "undefined") return null;
    const AnyAudioContext = (window.AudioContext || (window as any).webkitAudioContext) as
      | typeof AudioContext
      | undefined;
    if (!AnyAudioContext) return null;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AnyAudioContext();
    }

    if (audioCtxRef.current.state === "suspended") {
      try {
        await audioCtxRef.current.resume();
      } catch {
        return null;
      }
    }

    return audioCtxRef.current;
  };

  const playNotificationSound = async () => {
    try {
      const ctx = await ensureAudioContext();
      if (!ctx) return;

      stopNotificationSound();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const t0 = ctx.currentTime;
      const totalDurationSeconds = 60;
      const beepIntervalSeconds = 0.6;
      const beepDurationSeconds = 0.28;
      const beepCount = Math.max(1, Math.floor(totalDurationSeconds / beepIntervalSeconds));

      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, t0);

      gain.gain.setValueAtTime(0.0001, t0);
      for (let i = 0; i < beepCount; i++) {
        const ts = t0 + i * beepIntervalSeconds;
        gain.gain.setValueAtTime(0.0001, ts);
        gain.gain.exponentialRampToValueAtTime(0.9, ts + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ts + beepDurationSeconds);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      activeOscRef.current = osc;
      activeGainRef.current = gain;
      osc.onended = () => {
        if (activeOscRef.current === osc) {
          activeOscRef.current = null;
        }
        if (activeGainRef.current === gain) {
          activeGainRef.current = null;
        }
      };

      osc.start();
      osc.stop(t0 + totalDurationSeconds + 0.1);
    } catch (e) {
      console.warn("Notification sound failed to play", e);
    }
  };

  useEffect(() => {
    let unlockCleanup: (() => void) | null = null;
    let socket: Socket | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const unlock = () => {
      void ensureAudioContext();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };

    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    unlockCleanup = () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };

    socket = getAdminSocket();
    socketRef.current = socket;

    const onConnect = () => {
      console.log("Admin realtime connected", { id: socket?.id });
      refreshBookingCount();
      refreshContactCount();
      void refreshUnreadCount();
    };

    const onNotificationNew = (payload: AdminNotificationPayload) => {
        console.log("Admin notification received", payload);
        const key = `${payload.type}:${payload.entityId}`;
        if (seenRef.current.has(key)) return;
        seenRef.current.add(key);

        void playNotificationSound();

        if (payload.type === "booking") {
          toast({
            title: (
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white">
                  <Calendar size={16} />
                </span>
                <span className="text-sm font-semibold">New Booking</span>
              </div>
            ),
            description: (
              <div className="mt-1 flex items-center justify-between gap-3">
                <span className="text-sm opacity-90 line-clamp-2">
                  {typeof payload.title === 'object' ? payload.title.en : payload.title}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium opacity-80">
                  Open
                  <ChevronRight size={14} />
                </span>
              </div>
            ),
            variant: "success",
            className: "cursor-pointer hover:bg-emerald-100",
            onOpenChange: (open) => {
              if (!open) stopNotificationSound();
            },
            onClick: () => {
              stopNotificationSound();
              router.push("/admin/tour/booking");
            },
          });
          refreshBookingCount();
          return;
        }

        if (payload.type === "tailorMade") {
          toast({
            title: (
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-amber-600 text-white">
                  <MessageSquare size={16} />
                </span>
                <span className="text-sm font-semibold">New Tailor-Made</span>
              </div>
            ),
            description: (
              <div className="mt-1 flex items-center justify-between gap-3">
                <span className="text-sm opacity-90 line-clamp-2">
                  {typeof payload.title === 'object' ? payload.title.en : payload.title}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium opacity-80">
                  Open
                  <ChevronRight size={14} />
                </span>
              </div>
            ),
            variant: "warning",
            className: "cursor-pointer hover:bg-amber-100",
            onOpenChange: (open) => {
              if (!open) stopNotificationSound();
            },
            onClick: () => {
              stopNotificationSound();
              router.push("/admin/contact-forms/tailor-made");
            },
          });
          void refreshUnreadCount();
          return;
        }

        toast({
          title: (
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white">
                <Mail size={16} />
              </span>
              <span className="text-sm font-semibold">New Contact Form</span>
            </div>
          ),
          description: (
            <div className="mt-1 flex items-center justify-between gap-3">
              <span className="text-sm opacity-90 line-clamp-2">
                {typeof payload.title === 'object' ? payload.title.en : payload.title}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium opacity-80">
                Open
                <ChevronRight size={14} />
              </span>
            </div>
          ),
          variant: "info",
          className: "cursor-pointer hover:bg-blue-100",
          onOpenChange: (open) => {
            if (!open) stopNotificationSound();
          },
          onClick: () => {
            stopNotificationSound();
            router.push("/admin/contact-forms/contact-form");
          },
        });
        refreshContactCount();
    };

    const onConnectError = (err: any) => {
      console.warn("Admin realtime connect_error", err);
    };

    if (socket) {
      socket.on("connect", onConnect);
      socket.on("notification:new", onNotificationNew);
      socket.on("connect_error", onConnectError);
    }

    const poll = async () => {
      try {
        const token = window.localStorage.getItem("authToken") || window.localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${API_ENDPOINTS.NOTIFICATIONS.BASE}?status=unread&limit=1`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!res.ok) return;
        const json = await res.json();
        const latest = Array.isArray(json?.data) ? json.data[0] : undefined;
        const id = latest?._id as string | undefined;
        if (!id) return;

        const type = latest?.type as AdminNotificationType | undefined;
        const entityId = (latest?.entityId as string | undefined) || id;
        const title = (latest?.title as string | undefined) || "New notification";
        const key = `${type || "notification"}:${entityId}`;

        if (seenRef.current.has(key)) return;
        seenRef.current.add(key);

        void playNotificationSound();

        if (type === "booking") {
          toast({
            title: (
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white">
                  <Calendar size={16} />
                </span>
                <span className="text-sm font-semibold">New Booking</span>
              </div>
            ),
            description: (
              <div className="mt-1 flex items-center justify-between gap-3">
                <span className="text-sm opacity-90 line-clamp-2">
                  {typeof title === 'object' ? (title as any).en : title}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium opacity-80">
                  Open
                  <ChevronRight size={14} />
                </span>
              </div>
            ),
            variant: "success",
            className: "cursor-pointer hover:bg-emerald-100",
            onOpenChange: (open) => {
              if (!open) stopNotificationSound();
            },
            onClick: () => {
              stopNotificationSound();
              router.push("/admin/tour/booking");
            },
          });
          refreshBookingCount();
          return;
        }

        if (type === "tailorMade") {
          toast({
            title: (
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-amber-600 text-white">
                  <MessageSquare size={16} />
                </span>
                <span className="text-sm font-semibold">New Tailor-Made</span>
              </div>
            ),
            description: (
              <div className="mt-1 flex items-center justify-between gap-3">
                <span className="text-sm opacity-90 line-clamp-2">
                  {typeof title === 'object' ? (title as any).en : title}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium opacity-80">
                  Open
                  <ChevronRight size={14} />
                </span>
              </div>
            ),
            variant: "warning",
            className: "cursor-pointer hover:bg-amber-100",
            onOpenChange: (open) => {
              if (!open) stopNotificationSound();
            },
            onClick: () => {
              stopNotificationSound();
              router.push("/admin/contact-forms/tailor-made");
            },
          });
          void refreshUnreadCount();
          return;
        }

        toast({
          title: (
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white">
                <Mail size={16} />
              </span>
              <span className="text-sm font-semibold">New Contact Form</span>
            </div>
          ),
          description: (
            <div className="mt-1 flex items-center justify-between gap-3">
              <span className="text-sm opacity-90 line-clamp-2">
                {typeof title === 'object' ? (title as any).en : title}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium opacity-80">
                Open
                <ChevronRight size={14} />
              </span>
            </div>
          ),
          variant: "info",
          className: "cursor-pointer hover:bg-blue-100",
          onOpenChange: (open) => {
            if (!open) stopNotificationSound();
          },
          onClick: () => {
            stopNotificationSound();
            router.push("/admin/contact-forms/contact-form");
          },
        });
        refreshContactCount();
      } catch (e) {
        console.warn("Admin notifications polling failed", e);
      }
    };

    void poll();
    pollInterval = setInterval(() => {
      void poll();
    }, 15000);

    return () => {
      unlockCleanup?.();
      if (pollInterval) clearInterval(pollInterval);
      socket?.off("connect", onConnect);
      socket?.off("notification:new", onNotificationNew);
      socket?.off("connect_error", onConnectError);
      socketRef.current = null;
      stopNotificationSound();
    };
  }, [refreshUnreadCount, refreshContactCount, refreshBookingCount]);

  return null;
}
