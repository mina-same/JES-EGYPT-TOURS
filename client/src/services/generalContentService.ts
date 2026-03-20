import axiosInstance from '@/lib/api/axios';
import { ILocalizedString, ILocalizedMixed } from '@/types/tour';

export interface GeneralContentItem {
  _id: string;
  slug: string;
  title: ILocalizedString;
  subtitle?: ILocalizedString;
  content: ILocalizedMixed;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

class GeneralContentService {
  /**
   * Fetch all general content blocks (admin only)
   */
  async getAll(): Promise<GeneralContentItem[]> {
    try {
      // In the future we might add pagination, but for now it's a small list
      const response = await axiosInstance.get('/general-content/admin/list');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching general content:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Get single content by slug
   */
  async getBySlug(slug: string): Promise<GeneralContentItem> {
    try {
      const response = await axiosInstance.get(`/general-content/${slug}`);
      return response.data.data;
    } catch (error: any) {
      console.error(`Error fetching general content for slug ${slug}:`, error);
      throw error.response?.data || error;
    }
  }

  /**
   * Upsert content (Admin)
   */
  async upsert(data: Partial<GeneralContentItem>): Promise<GeneralContentItem> {
    try {
      const response = await axiosInstance.post(`/general-content`, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating general content:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Toggle active status
   */
  async toggleActive(slug: string): Promise<GeneralContentItem> {
    try {
      const response = await axiosInstance.patch(`/general-content/${slug}/toggle-active`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error toggling general content status:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Delete content
   */
  async delete(slug: string): Promise<void> {
    try {
      await axiosInstance.delete(`/general-content/${slug}`);
    } catch (error: any) {
      console.error('Error deleting general content:', error);
      throw error.response?.data || error;
    }
  }
}

export const generalContentService = new GeneralContentService();
