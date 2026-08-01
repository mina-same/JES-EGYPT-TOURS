export const PERMISSIONS = {
  // Blog permissions
  BLOG_CREATE: 'blog:create',
  BLOG_READ: 'blog:read',
  BLOG_UPDATE: 'blog:update',
  BLOG_DELETE: 'blog:delete',

  // Tour permissions
  TOUR_CREATE: 'tour:create',
  TOUR_READ: 'tour:read',
  TOUR_UPDATE: 'tour:update',
  TOUR_DELETE: 'tour:delete',

  // Booking permissions
  BOOKING_READ: 'booking:read',
  BOOKING_UPDATE: 'booking:update',
  BOOKING_DELETE: 'booking:delete',

  // Contact permissions
  CONTACT_READ: 'contact:read',
  CONTACT_UPDATE: 'contact:update',
  CONTACT_DELETE: 'contact:delete',

  // Tailor Made permissions
  TAILOR_MADE_READ: 'tailor_made:read',
  TAILOR_MADE_UPDATE: 'tailor_made:update',
  TAILOR_MADE_DELETE: 'tailor_made:delete',

  // Review permissions

  // User management (superadmin only)
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const DEFAULT_ADMIN_PERMISSIONS: Permission[] = [
  PERMISSIONS.BLOG_READ,
  PERMISSIONS.BLOG_UPDATE,
  PERMISSIONS.TOUR_READ,
  PERMISSIONS.TOUR_UPDATE,
  PERMISSIONS.BOOKING_READ,
  PERMISSIONS.BOOKING_UPDATE,
  PERMISSIONS.CONTACT_READ,
  PERMISSIONS.CONTACT_UPDATE,
  PERMISSIONS.TAILOR_MADE_READ,
  PERMISSIONS.TAILOR_MADE_UPDATE,
];
