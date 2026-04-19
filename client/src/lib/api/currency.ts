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
      console.error('Error fetching currency rates:', error);
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
