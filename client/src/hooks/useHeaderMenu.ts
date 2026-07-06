"use client";

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { menuService, type Menu } from '@/services/menuService';

const resolvedMenuCache = new Map<string, Menu>();
const pendingMenuRequests = new Map<string, Promise<Menu>>();

const getCachedHeaderMenu = (key: string, cacheKey: string) => {
  const cachedMenu = resolvedMenuCache.get(cacheKey);
  if (cachedMenu) {
    return Promise.resolve(cachedMenu);
  }

  const pendingRequest = pendingMenuRequests.get(cacheKey);
  if (pendingRequest) {
    return pendingRequest;
  }

  const request = menuService
    .getPublicByKey(key)
    .then((data) => {
      resolvedMenuCache.set(cacheKey, data);
      return data;
    })
    .finally(() => {
      pendingMenuRequests.delete(cacheKey);
    });

  pendingMenuRequests.set(cacheKey, request);
  return request;
};

export const useHeaderMenu = (key: string = 'header-main') => {
  const { i18n } = useTranslation();
  const cacheKey = `${key}:${i18n.language || 'default'}`;
  const cachedMenu = resolvedMenuCache.get(cacheKey) ?? null;
  const [menu, setMenu] = useState<Menu | null>(cachedMenu);
  const [loading, setLoading] = useState(!cachedMenu);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const existingMenu = resolvedMenuCache.get(cacheKey);
        if (existingMenu) {
          setMenu(existingMenu);
          setError(null);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);
        const data = await getCachedHeaderMenu(key, cacheKey);
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
  }, [cacheKey, key]);

  return { menu, loading, error };
};
