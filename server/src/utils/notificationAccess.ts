import { PERMISSIONS } from '../permissions';
export const notificationPermissions = { booking: PERMISSIONS.BOOKING_READ, contact: PERMISSIONS.CONTACT_READ, tailorMade: PERMISSIONS.TAILOR_MADE_READ } as const;
export type RequestNotificationType = keyof typeof notificationPermissions;
export function canRead(user: any, permission: string): boolean {
  return user?.role === 'superadmin' || (user?.permissions || []).includes(permission);
}
export function allowedNotificationTypes(user: any): string[] {
  return [...Object.entries(notificationPermissions).filter(([, permission]) => canRead(user, permission)).map(([type]) => type), ...(user?.role === 'superadmin' ? ['system'] : [])];
}
export function notificationScope(user: any): Record<string, unknown> {
  return { type: { $in: allowedNotificationTypes(user) }, hiddenBy: { $ne: user._id } };
}
