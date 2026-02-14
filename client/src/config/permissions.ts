export const PERMISSIONS = {
  // Blog
  BLOG_CREATE: 'blog:create',
  BLOG_READ: 'blog:read',
  BLOG_UPDATE: 'blog:update',
  BLOG_DELETE: 'blog:delete',
  
  // Tour
  TOUR_CREATE: 'tour:create',
  TOUR_READ: 'tour:read',
  TOUR_UPDATE: 'tour:update',
  TOUR_DELETE: 'tour:delete',
  
  // Booking
  BOOKING_READ: 'booking:read',
  BOOKING_UPDATE: 'booking:update',
  BOOKING_DELETE: 'booking:delete',
  
  // Contact
  CONTACT_READ: 'contact:read',
  CONTACT_UPDATE: 'contact:update',
  CONTACT_DELETE: 'contact:delete',
  
  // Tailor Made
  TAILOR_MADE_READ: 'tailor_made:read',
  TAILOR_MADE_UPDATE: 'tailor_made:update',
  TAILOR_MADE_DELETE: 'tailor_made:delete',
  
  // Review
  REVIEW_READ: 'review:read',
  REVIEW_UPDATE: 'review:update',
  REVIEW_DELETE: 'review:delete',
  
  // User (superadmin only)
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
