"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { API_ENDPOINTS } from "@/config/api";

interface ContactFormContextType {
  newCount: number;
  refreshCount: () => void;
}

const ContactFormContext = createContext<ContactFormContextType>({
  newCount: 0,
  refreshCount: () => {},
});

export const useContactForm = () => useContext(ContactFormContext);

export const ContactFormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [newCount, setNewCount] = useState(0);

  const fetchCount = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      const res = await fetch(`${API_ENDPOINTS.CONTACT.BASE}?status=new`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setNewCount(json?.pagination?.total || 0);
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
    <ContactFormContext.Provider value={{ newCount, refreshCount }}>
      {children}
    </ContactFormContext.Provider>
  );
};
