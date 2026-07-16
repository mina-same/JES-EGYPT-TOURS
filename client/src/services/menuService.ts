import axiosInstance from '@/lib/api/axios';
import { ILocalizedString } from '@/types/tour';

export type MenuDisplayVariant = 'default' | 'promotion';

export interface MenuItem {
  _id?: string;
  label: ILocalizedString;
  /** Per-language destination path; legacy items may hold a plain string
   *  (used for every language). */
  url?: ILocalizedString | string;
  isActive: boolean;
  order: number;
  displayVariant?: MenuDisplayVariant;
  children?: MenuItem[];
}

export interface Menu {
  _id: string;
  key: string;
  title: ILocalizedString;
  isActive: boolean;
  items: MenuItem[];
  createdAt: string;
  updatedAt: string;
}

class MenuService {
  async getPublicByKey(key: string): Promise<Menu> {
    const response = await axiosInstance.get(`/menus/${encodeURIComponent(key)}`);
    return response.data.data;
  }

  async adminList(): Promise<Menu[]> {
    const response = await axiosInstance.get('/menus/admin/list');
    return response.data.data;
  }

  async adminGetById(id: string): Promise<Menu> {
    const response = await axiosInstance.get(`/menus/admin/${id}`);
    return response.data.data;
  }

  async adminCreate(payload: Partial<Menu>): Promise<Menu> {
    const response = await axiosInstance.post('/menus/admin', payload);
    return response.data.data;
  }

  async adminUpdate(id: string, payload: Partial<Menu>): Promise<Menu> {
    const response = await axiosInstance.put(`/menus/admin/${id}`, payload);
    return response.data.data;
  }

  async adminDelete(id: string): Promise<void> {
    await axiosInstance.delete(`/menus/admin/${id}`);
  }
}

export const menuService = new MenuService();
