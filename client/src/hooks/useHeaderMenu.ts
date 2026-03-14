"use client";

import { useEffect, useState } from 'react';
import { menuService, type Menu } from '@/services/menuService';

export const useHeaderMenu = (key: string = 'header-main') => {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await menuService.getPublicByKey(key);
        if (mounted) setMenu(data);
      } catch (e: any) {
        console.error('Failed to load header menu', e);
        if (mounted) setError(e?.message || 'Failed to load menu');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [key]);

  return { menu, loading, error };
};
