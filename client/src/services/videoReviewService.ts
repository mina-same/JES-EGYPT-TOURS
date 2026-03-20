import axiosInstance from '@/lib/api/axios';
import { ILocalizedString } from '@/types/tour';

export interface VideoReviewItem {
  _id: string;
  title: ILocalizedString;
  url: string;
  videoId: string;
  tourName: ILocalizedString;
  thumbnail?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export const videoReviewService = {
  /**
   * Get all video reviews for admin
   */
  getAll: async (): Promise<VideoReviewItem[]> => {
    const response = await axiosInstance.get('/video-reviews/admin/list');
    return response.data.data;
  },

  /**
   * Create or update a video review
   */
  upsert: async (data: Partial<VideoReviewItem> & { id?: string }): Promise<VideoReviewItem> => {
    const response = await axiosInstance.post('/video-reviews', data);
    return response.data.data;
  },

  /**
   * Toggle active status
   */
  toggleActive: async (id: string): Promise<VideoReviewItem> => {
    const response = await axiosInstance.patch(`/video-reviews/toggle/${id}`);
    return response.data.data;
  },

  /**
   * Delete a video review
   */
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/video-reviews/${id}`);
  },

  /**
   * Get a single video review by ID from the list
   * (Since we don't have a specific GET /id, we'll fetch all and find)
   */
  getById: async (id: string): Promise<VideoReviewItem | undefined> => {
    const items = await videoReviewService.getAll();
    return items.find(item => item._id === id);
  }
};
