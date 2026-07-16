'use client';

import { createContext, useContext } from 'react';
import type { Menu } from '@/services/menuService';

/**
 * Carries the SERVER-fetched header menu down to the client header
 * components. With the menu available synchronously at render time, the
 * navigation links are part of the initial server-rendered HTML — visible to
 * search engines — instead of appearing only after a client-side fetch.
 */
const HeaderMenuContext = createContext<Menu | null>(null);

export function HeaderMenuProvider({
  menu,
  children,
}: {
  menu: Menu | null;
  children: React.ReactNode;
}) {
  return <HeaderMenuContext.Provider value={menu}>{children}</HeaderMenuContext.Provider>;
}

export const useServerHeaderMenu = () => useContext(HeaderMenuContext);
