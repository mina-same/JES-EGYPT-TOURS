import { localizePreservingSlugs } from '../utils/localize';
import { Request, Response } from 'express';
import Menu from '../models/Menu';

/**
 * Recursively normalize `displayVariant` on the incoming items tree.
 * - "promotion" is honored ONLY for top-level items (level 0).
 * - Every other value (child items, missing, or invalid) becomes "default".
 * This rejects any admin-supplied value that is not exactly "promotion" and
 * enforces the top-level-only product rule server-side. All other item
 * properties (label, url, isActive, order, _id, ...) are preserved untouched.
 * A new array/objects are produced so req.body is not mutated.
 */
const MENU_LOCALES = ['en', 'de', 'it', 'es'] as const;

/** Trims a single path and guarantees internal paths start with "/"
 *  (absolute http(s) URLs pass through untouched). */
const cleanPath = (value: any): string => {
  const s = typeof value === 'string' ? value.trim() : '';
  if (!s) return '';
  if (/^https?:\/\//i.test(s) || s.startsWith('/') || s.startsWith('#')) return s;
  return `/${s}`;
};

/** Normalizes an item URL to the localized { en, de, it, es } shape.
 *  Accepts legacy plain strings (become the English path, used as fallback
 *  for the other languages by the client). Returns undefined when empty. */
const normalizeMenuUrl = (url: any): Record<string, string> | undefined => {
  if (typeof url === 'string') {
    const en = cleanPath(url);
    return en ? { en, de: '', it: '', es: '' } : undefined;
  }
  if (url && typeof url === 'object') {
    const out: Record<string, string> = {};
    let hasAny = false;
    for (const l of MENU_LOCALES) {
      out[l] = cleanPath(url[l]);
      if (out[l]) hasAny = true;
    }
    return hasAny ? out : undefined;
  }
  return undefined;
};

const sanitizeMenuItems = (items: any[], level = 0): any[] => {
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => ({
    ...item,
    // Array position IS the order (the admin editor's arrows are the single
    // source of truth) — keeps the public sort stable and predictable.
    order: index,
    url: normalizeMenuUrl(item?.url),
    displayVariant: level === 0 && item?.displayVariant === 'promotion' ? 'promotion' : 'default',
    children: sanitizeMenuItems(Array.isArray(item?.children) ? item.children : [], level + 1),
  }));
};

const sortItems = (items: any[]): any[] => {
  const arr = Array.isArray(items) ? items : [];
  return arr
    .slice()
    .sort((a, b) => (Number(a?.order) || 0) - (Number(b?.order) || 0))
    .map((i) => ({
      ...i,
      children: sortItems(Array.isArray(i?.children) ? i.children : []),
    }));
};

const filterActiveItems = (items: any[]): any[] => {
  const arr = Array.isArray(items) ? items : [];
  return arr
    .filter((i) => i && i.isActive !== false)
    .map((i) => ({
      ...i,
      children: filterActiveItems(Array.isArray(i?.children) ? i.children : []),
    }));
};

/**
 * @desc    Get menu by key (public)
 * @route   GET /api/menus/:key
 * @access  Public
 */
export const getMenuByKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const key = String(req.params.key || '').toLowerCase();
    const menu = await Menu.findOne({ key, isActive: true }).lean();

    if (!menu) {
      res.status(404).json({ success: false, error: 'Menu not found' });
      return;
    }

    const items = sortItems(filterActiveItems((menu as any).items || []));

    res.status(200).json({
      success: true,
      // The header menu is fetched on EVERY page, so four languages of every
      // label and url rode along with every single request. The header resolves
      // each item with getLocalizedValue(item.url, language), which is just as
      // happy with a plain string, and the language switcher builds its targets
      // from the route — not from this menu — so narrowing is safe here.
      data: localizePreservingSlugs(
        {
          _id: (menu as any)._id,
          key: (menu as any).key,
          title: (menu as any).title,
          isActive: (menu as any).isActive,
          items,
          createdAt: (menu as any).createdAt,
          updatedAt: (menu as any).updatedAt,
        },
        req.locale
      ),
    });
  } catch (error: any) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch menu' });
  }
};

/**
 * @desc    Admin: list menus
 * @route   GET /api/menus/admin/list
 * @access  Private/Admin
 */
export const adminListMenus = async (_req: Request, res: Response): Promise<void> => {
  try {
    const menus = await Menu.find({}).sort({ updatedAt: -1 }).lean();
    res.status(200).json({ success: true, count: menus.length, data: menus });
  } catch (error: any) {
    console.error('Error listing menus:', error);
    res.status(500).json({ success: false, error: 'Failed to list menus' });
  }
};

/**
 * @desc    Admin: get menu by id
 * @route   GET /api/menus/admin/:id
 * @access  Private/Admin
 */
export const adminGetMenuById = async (req: Request, res: Response): Promise<void> => {
  try {
    const menu = await Menu.findById(req.params.id).lean();
    if (!menu) {
      res.status(404).json({ success: false, error: 'Menu not found' });
      return;
    }
    res.status(200).json({ success: true, data: menu });
  } catch (error: any) {
    console.error('Error fetching menu (admin):', error);
    res.status(500).json({ success: false, error: 'Failed to fetch menu' });
  }
};

/**
 * @desc    Admin: create menu
 * @route   POST /api/menus/admin
 * @access  Private/Admin
 */
export const adminCreateMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const key = String(req.body?.key || '').toLowerCase().trim();
    const { title, isActive, items } = req.body;

    if (!key || !title?.en) {
      res.status(400).json({ success: false, error: 'key and English title are required' });
      return;
    }

    const existing = await Menu.findOne({ key });
    if (existing) {
      res.status(400).json({ success: false, error: 'Menu key already exists' });
      return;
    }

    const menu = await Menu.create({
      key,
      title,
      isActive: isActive !== false,
      items: sanitizeMenuItems(Array.isArray(items) ? items : []),
    });

    res.status(201).json({ success: true, message: 'Menu created', data: menu });
  } catch (error: any) {
    console.error('Error creating menu:', error);
    res.status(500).json({ success: false, error: 'Failed to create menu' });
  }
};

/**
 * @desc    Admin: update menu
 * @route   PUT /api/menus/admin/:id
 * @access  Private/Admin
 */
export const adminUpdateMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const updates: any = {};
    if (req.body?.title !== undefined) updates.title = req.body.title;
    if (req.body?.isActive !== undefined) updates.isActive = !!req.body.isActive;
    if (req.body?.items !== undefined) updates.items = sanitizeMenuItems(Array.isArray(req.body.items) ? req.body.items : []);

    const menu = await Menu.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!menu) {
      res.status(404).json({ success: false, error: 'Menu not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Menu updated', data: menu });
  } catch (error: any) {
    console.error('Error updating menu:', error);
    res.status(500).json({ success: false, error: 'Failed to update menu' });
  }
};

/**
 * @desc    Admin: delete menu
 * @route   DELETE /api/menus/admin/:id
 * @access  Private/Admin
 */
export const adminDeleteMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) {
      res.status(404).json({ success: false, error: 'Menu not found' });
      return;
    }

    await menu.deleteOne();
    res.status(200).json({ success: true, message: 'Menu deleted' });
  } catch (error: any) {
    console.error('Error deleting menu:', error);
    res.status(500).json({ success: false, error: 'Failed to delete menu' });
  }
};
