import axios from './axios';

export interface Comment {
  _id: string;
  tour: string;
  name: string;
  email: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  avatar?: string;
}

export const reviewsAPI = {
  // Get reviews for a tour
  getReviewsByTour: async (tourId: string) => {
    try {
      const response = await axios.get(`/reviews/tour/${tourId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  },

  // Submit a new review
  submitReview: async (data: {
    tourId: string;
    name: string;
    email: string;
    rating: number;
    comment: string;
    avatar?: string;
  }) => {
    try {
      const response = await axios.post('/reviews', data);
      return response.data;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  },

  // Admin: Get all reviews
  getAdminReviews: async (params?: { tourId?: string; status?: string }) => {
    try {
      const response = await axios.get('/reviews/admin', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching admin reviews:', error);
      throw error;
    }
  },

  // Admin: Update review status
  updateStatus: async (id: string, status: 'approved' | 'rejected' | 'pending') => {
    try {
      const response = await axios.patch(`/reviews/${id}/status`, { status });
      return response.data;
    } catch (error) {
       console.error('Error updating review status:', error);
       throw error;
    }
  },

  // Admin: Delete review
  deleteReview: async (id: string) => {
    try {
      const response = await axios.delete(`/reviews/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }
};
