export const ADMIN_REQUESTS_CHANGED = 'admin:requests-changed';
export const ADMIN_NOTIFICATIONS_CHANGED = 'admin:notifications-changed';
export const STOP_ADMIN_SOUND = 'admin:stop-sound';
export interface AdminNotification {
  _id: string;
  type: 'booking' | 'contact' | 'tailorMade' | 'system';
  title: string;
  message?: string;
  entityId?: string;
  createdAt: string;
  isRead?: boolean;
}
export function notificationDestination(notification: Pick<AdminNotification, 'type' | 'entityId'>): string | null {
  const base = { booking: '/admin/tour/booking', contact: '/admin/contact-forms/contact-form', tailorMade: '/admin/contact-forms/tailor-made', system: '/admin/notifications' }[notification.type];
  return base ? base + (notification.entityId ? `?id=${encodeURIComponent(notification.entityId)}` : '') : null;
}
export function announceRequestsChanged() { window.dispatchEvent(new Event(ADMIN_REQUESTS_CHANGED)); }
export async function adminFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('authToken');
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token || ''}`);
  const response = await fetch(url, { ...options, headers, cache: 'no-store', signal: options.signal || AbortSignal.timeout(15000) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.success) {
    if (response.status === 401) {
      localStorage.setItem('auth_redirect', window.location.pathname + window.location.search);
      localStorage.removeItem('authToken'); localStorage.removeItem('user');
      window.location.assign('/login');
    }
    throw Object.assign(new Error(body.error || 'Unable to complete the request. Please try again.'), { status: response.status });
  }
  return body;
}
