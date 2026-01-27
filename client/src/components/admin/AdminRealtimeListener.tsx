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

type AdminNotificationType = "booking" | "tailorMade" | "contact";

interface AdminNotificationPayload {
  type: AdminNotificationType;
  title: string;
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

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const t0 = ctx.currentTime;
      const t1 = t0 + 0.18;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, t0);
      osc.frequency.setValueAtTime(1320, t1);

      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.6, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);

      gain.gain.setValueAtTime(0.0001, t1);
      gain.gain.exponentialRampToValueAtTime(0.6, t1 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(t1 + 0.14);
    } catch (e) {
      console.warn("Notification sound failed to play", e);
    }
  };

  useEffect(() => {
    let unlockCleanup: (() => void) | null = null;
    let socket: Socket | null = null;

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
    if (!socket) {
      return () => {
        unlockCleanup?.();
      };
    }

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
                <span className="text-sm opacity-90 line-clamp-2">{payload.title}</span>
                <span className="inline-flex items-center gap-1 text-xs font-medium opacity-80">
                  Open
                  <ChevronRight size={14} />
                </span>
              </div>
            ),
            variant: "success",
            className: "cursor-pointer hover:bg-emerald-100",
            onClick: () => {
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
                <span className="text-sm opacity-90 line-clamp-2">{payload.title}</span>
                <span className="inline-flex items-center gap-1 text-xs font-medium opacity-80">
                  Open
                  <ChevronRight size={14} />
                </span>
              </div>
            ),
            variant: "warning",
            className: "cursor-pointer hover:bg-amber-100",
            onClick: () => {
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
              <span className="text-sm opacity-90 line-clamp-2">{payload.title}</span>
              <span className="inline-flex items-center gap-1 text-xs font-medium opacity-80">
                Open
                <ChevronRight size={14} />
              </span>
            </div>
          ),
          variant: "info",
          className: "cursor-pointer hover:bg-blue-100",
          onClick: () => {
            router.push("/admin/contact-forms/contact-form");
          },
        });
        refreshContactCount();
    };

    const onConnectError = (err: any) => {
      console.warn("Admin realtime connect_error", err);
    };

    socket.on("connect", onConnect);
    socket.on("notification:new", onNotificationNew);
    socket.on("connect_error", onConnectError);

    return () => {
      unlockCleanup?.();
      socket?.off("connect", onConnect);
      socket?.off("notification:new", onNotificationNew);
      socket?.off("connect_error", onConnectError);
      socketRef.current = null;
    };
  }, [refreshUnreadCount, refreshContactCount, refreshBookingCount]);

  return null;
}
