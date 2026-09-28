import axiosInstance from './axios';

export interface CurrencyRates {
  baseCurrency: string;
  rates: {
    USD: number;
    EUR: number;
    GBP: number;
  };
  updatedAt: string;
}

export const currencyAPI = {
  /**
   * Get current exchange rates (Public)
   */
  getRates: async (): Promise<{ success: boolean; data?: CurrencyRates; message?: string }> => {
    try {
      const response = await axiosInstance.get('/currency/rates');
      return response.data;
    } catch (error: any) {
      // CurrencyProvider falls back to cached/default rates, so an unreachable
      // API is not an error worth the dev overlay — console.error would raise it.
      console.warn('Currency rates unavailable, using fallback rates:', error?.message);
      return error.response?.data || { success: false, message: 'Failed to fetch rates' };
    }
  },

  /**
   * Update exchange rates (Admin)
   */
  updateRates: async (rates: { EUR: number; GBP: number }): Promise<{ success: boolean; data?: CurrencyRates; message?: string }> => {
    try {
      const response = await axiosInstance.put('/currency/rates', rates);
      return response.data;
    } catch (error: any) {
      return error.response?.data || { success: false, message: 'Failed to update rates' };
    }
  },
};
