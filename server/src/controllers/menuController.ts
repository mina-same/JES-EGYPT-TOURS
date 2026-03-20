import { Request, Response } from 'express';
import Menu from '../models/Menu';

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
      data: {
        _id: (menu as any)._id,
        key: (menu as any).key,
        title: (menu as any).title,
        isActive: (menu as any).isActive,
        items,
        createdAt: (menu as any).createdAt,
        updatedAt: (menu as any).updatedAt,
      },
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
      items: Array.isArray(items) ? items : [],
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
    if (req.body?.items !== undefined) updates.items = Array.isArray(req.body.items) ? req.body.items : [];

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
