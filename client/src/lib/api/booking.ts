import axiosInstance from './axios';
import { API_URL } from '@/config/api';
import {
  BOOKING_IDEMPOTENCY_HEADER,
  clearBookingAttempt,
  getOrCreateBookingAttempt,
  type BookingIdempotencyPayload,
} from '@/lib/bookingIdempotency';

const BASE_URL = `${API_URL}/bookings`;

import { ILocalizedString } from '@/types/tour';

export interface IBooking {
  _id?: string;
  id?: string;
  tour: string | {
    _id: string;
    heading: ILocalizedString | string;
    slug: string;
    images?: Array<{ url: string; fileName: string }>;
  };
  name: string;
  email: string;
  phone?: string;
  nationality?: string;
  dateFrom: string | Date;
  dateTo: string | Date;
  adults: number;
  children: number;
  infants: number;
  requirements?: string;
  /** What the visitor was LOOKING AT when they booked: the currency selected in
   *  the header and the per-person starting price the card displayed. Kept so a
   *  "but the site said €64" conversation can be settled from the record. */
  currency?: 'USD' | 'EUR' | 'GBP';
  quotedPrice?: number;
  /** Which pricing tier the enquiry is about, or 'NOT_SURE'. Present even when
   *  the visitor was never asked — a day tour records its single plan — so the
   *  office can price the enquiry without opening the tour. */
  selectedPackage?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  adminNotes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export type BookingFormData = BookingIdempotencyPayload;

export interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  completed: number;
}

export interface BookingListResponse {
  success: boolean;
  data: IBooking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface BookingResponse {
  success: boolean;
  message?: string;
  error?: string;
  data: IBooking;
  idempotentReplay?: boolean;
}

export interface BookingStatsResponse {
  success: boolean;
  data: BookingStats;
}

// Create a new booking (Public)
export const createBooking = async (data: BookingFormData): Promise<BookingResponse> => {
  const attempt = getOrCreateBookingAttempt(data);
  try {
    const response = await axiosInstance.post<BookingResponse>(BASE_URL, data, {
      headers: {
        [BOOKING_IDEMPOTENCY_HEADER]: attempt.idempotencyKey,
      },
    });

    if (response.data.success) {
      clearBookingAttempt(attempt);
    }

    return response.data;
  } catch (error: unknown) {
    const apiCode = (
      error as { response?: { data?: { code?: string } } }
    ).response?.data?.code;
    if (apiCode === 'IDEMPOTENCY_KEY_REUSED') {
      // A corrupt storage entry or an extraordinarily rare client-hash
      // collision must not trap every later retry on the same rejected key.
      clearBookingAttempt(attempt);
    }
    throw error;
  }
};

// Get all bookings (Admin only)
export const getAllBookings = async (
  params?: {
    status?: string;
    tour?: string;
    page?: number;
    limit?: number;
    search?: string;
  }
): Promise<BookingListResponse> => {
  const response = await axiosInstance.get<BookingListResponse>(BASE_URL, {
    params,
  });
  return response.data;
};

// Get single booking by ID (Admin only)
export const getBookingById = async (id: string): Promise<BookingResponse> => {
  const response = await axiosInstance.get<BookingResponse>(`${BASE_URL}/${id}`);
  return response.data;
};

// Update booking (Admin only)
export const updateBooking = async (
  id: string,
  data: { status?: string; adminNotes?: string }
): Promise<BookingResponse> => {
  const response = await axiosInstance.patch<BookingResponse>(
    `${BASE_URL}/${id}`,
    data
  );
  return response.data;
};

// Delete booking (Admin only)
export const deleteBooking = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await axiosInstance.delete<{ success: boolean; message: string }>(
    `${BASE_URL}/${id}`
  );
  return response.data;
};

// Get booking statistics (Admin only)
export const getBookingStats = async (): Promise<BookingStatsResponse> => {
  const response = await axiosInstance.get<BookingStatsResponse>(`${BASE_URL}/stats`);
  return response.data;
};

