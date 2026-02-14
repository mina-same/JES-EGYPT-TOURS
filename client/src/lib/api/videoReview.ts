import axiosInstance from './axios';

export interface VideoReview {
  _id?: string;
  title: string;
  url: string;
  videoId: string;
  tourName: string;
  thumbnail?: string;
  isActive: boolean;
  order: number;
}

export const videoReviewAPI = {
  /**
   * Get all active video reviews
   */
  getAll: async () => {
    try {
      const response = await axiosInstance.get('/video-reviews');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching video reviews:', error);
      return error.response?.data || { success: false, message: 'Failed to fetch video reviews' };
    }
  },

  /**
   * Get all video reviews for admin
   */
  getAdminList: async () => {
    try {
      const response = await axiosInstance.get('/video-reviews/admin/list');
      return response.data;
    } catch (error: any) {
      return error.response?.data || { success: false, message: 'Failed to fetch admin video reviews' };
    }
  },

  /**
   * Upsert video review (Admin)
   */
  upsert: async (data: any) => {
    try {
      const response = await axiosInstance.post('/video-reviews', data);
      return response.data;
    } catch (error: any) {
      return error.response?.data || { success: false, message: 'Failed to save video review' };
    }
  },

  /**
   * Toggle active status (Admin)
   */
  toggleStatus: async (id: string) => {
    try {
      const response = await axiosInstance.patch(`/video-reviews/toggle/${id}`);
      return response.data;
    } catch (error: any) {
      return error.response?.data || { success: false, message: 'Failed to toggle status' };
    }
  },

  /**
   * Delete video review (Admin)
   */
  delete: async (id: string) => {
    try {
      const response = await axiosInstance.delete(`/video-reviews/${id}`);
      return response.data;
    } catch (error: any) {
      return error.response?.data || { success: false, message: 'Failed to delete video review' };
    }
  }
};
