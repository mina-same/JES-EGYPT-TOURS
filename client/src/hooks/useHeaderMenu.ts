"use client";

import { useEffect, useState } from 'react';
import type { Menu } from '@/services/menuService';
import { publicGet } from '@/lib/api/publicGet';
import { useServerHeaderMenu } from '@/contexts/HeaderMenuContext';

/*
 * menuService.getPublicByKey(key) — same request, same `response.data.data`,
 * same rejection on failure — without axios. menuService is the admin's menu
 * client and imports the axios instance; this hook runs in the header and the
 * drawer on every visitor page.
 */
const getPublicMenuByKey = (key: string) =>
  publicGet(`/menus/${encodeURIComponent(key)}`).then((body) => body.data as Menu);

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

  const request = getPublicMenuByKey(key)
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
  // The API returns RAW localized objects (labels/urls in all languages) and
  // components resolve the active language themselves — so one fetch serves
  // every language; no per-language cache entries or refetches needed.
  const cacheKey = key;
  // SERVER-provided menu (from the visitor layout): available synchronously,
  // so the navigation is part of the server-rendered HTML (SEO) and no
  // client fetch is needed at all.
  const serverMenu = useServerHeaderMenu();
  const initialMenu =
    (serverMenu && serverMenu.key === key ? serverMenu : null) ??
    resolvedMenuCache.get(cacheKey) ??
    null;
  const [menu, setMenu] = useState<Menu | null>(initialMenu);
  const [loading, setLoading] = useState(!initialMenu);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        if (serverMenu && serverMenu.key === key) {
          resolvedMenuCache.set(cacheKey, serverMenu);
          setMenu(serverMenu);
          setError(null);
          setLoading(false);
          return;
        }

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
  }, [cacheKey, key, serverMenu]);

  return { menu, loading, error };
};
