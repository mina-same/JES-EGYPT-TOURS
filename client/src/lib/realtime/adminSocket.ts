"use client";

import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "@/config/api";

let socket: Socket | null = null;

const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem("authToken") || window.localStorage.getItem("token");
  } catch {
    return null;
  }
};

export const getAdminSocket = (): Socket | null => {
  const token = getAuthToken();
  if (!token) return null;

  if (socket) return socket;

  socket = io(API_BASE_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 500,
  });

  return socket;
};

export const disconnectAdminSocket = () => {
  if (!socket) return;
  socket.disconnect();
  socket = null;
};
