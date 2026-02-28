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

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem('tour_wishlist');
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch (e) {
        console.error('Failed to parse wishlist from localStorage', e);
      }
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('tour_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const addToWishlist = (tourId: string) => {
    setWishlist((prev) => {
      if (prev.includes(tourId)) return prev;
      const next = [...prev, tourId];
      try {
        localStorage.setItem('tour_wishlist', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const removeFromWishlist = (tourId: string) => {
    setWishlist((prev) => {
      const next = prev.filter((id) => id !== tourId);
      try {
        localStorage.setItem('tour_wishlist', JSON.stringify(next));
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
