"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WishlistContextType {
  wishlist: string[];
  addToWishlist: (tourId: string) => void;
  removeFromWishlist: (tourId: string) => void;
  isInWishlist: (tourId: string) => boolean;
  toggleWishlist: (tourId: string) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const STORAGE_KEY = 'tour_wishlist';

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem(STORAGE_KEY);
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch (e) {
        console.error('Failed to parse wishlist from localStorage', e);
      }
    }
  }, []);

  /*
   * There is deliberately no "save on every change" effect: it ran once on
   * mount with the still-empty initial state and overwrote the stored list
   * before the load above could commit. Adding and removing write straight to
   * localStorage instead, so the only writes are the ones the visitor asked for.
   *
   * Mirror writes made by other tabs — the event never fires in the tab that
   * wrote it, so this cannot loop. Without it, two open tabs drift apart and
   * the header count contradicts the hearts.
   */
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      try {
        setWishlist(event.newValue ? JSON.parse(event.newValue) : []);
      } catch {
        // A malformed payload from another tab must not break this one.
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const addToWishlist = (tourId: string) => {
    setWishlist((prev) => {
      if (prev.includes(tourId)) return prev;
      const next = [...prev, tourId];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const removeFromWishlist = (tourId: string) => {
    setWishlist((prev) => {
      const next = prev.filter((id) => id !== tourId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const isInWishlist = (tourId: string) => {
    return wishlist.includes(tourId);
  };

  const toggleWishlist = (tourId: string) => {
    if (isInWishlist(tourId)) {
      removeFromWishlist(tourId);
    } else {
      addToWishlist(tourId);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
