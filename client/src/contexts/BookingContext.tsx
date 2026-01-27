"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { getAllBookings } from "@/lib/api/booking";

interface BookingContextType {
  pendingCount: number;
  refreshCount: () => void;
}

const BookingContext = createContext<BookingContextType>({
  pendingCount: 0,
  refreshCount: () => {},
});

export const useBooking = () => useContext(BookingContext);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingCount, setPendingCount] = useState(0);

  const fetchCount = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      const res = await getAllBookings({ status: "pending", limit: 1 });
      if (res.success) {
        setPendingCount(res.pagination?.total || 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const refreshCount = () => {
    fetchCount();
  };

  return (
    <BookingContext.Provider value={{ pendingCount, refreshCount }}>
      {children}
    </BookingContext.Provider>
  );
};
