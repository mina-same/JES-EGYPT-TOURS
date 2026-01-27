export const PERMISSIONS = {
  BLOG_CREATE: 'blog:create',
  BLOG_READ: 'blog:read',
  BLOG_UPDATE: 'blog:update',
  BLOG_DELETE: 'blog:delete',

  TOUR_CREATE: 'tour:create',
  TOUR_READ: 'tour:read',
  TOUR_UPDATE: 'tour:update',
  TOUR_DELETE: 'tour:delete',

  BOOKING_READ: 'booking:read',
  BOOKING_UPDATE: 'booking:update',
  BOOKING_DELETE: 'booking:delete',

  CONTACT_READ: 'contact:read',
  CONTACT_UPDATE: 'contact:update',
  CONTACT_DELETE: 'contact:delete',

  TAILOR_MADE_READ: 'tailor_made:read',
  TAILOR_MADE_UPDATE: 'tailor_made:update',
  TAILOR_MADE_DELETE: 'tailor_made:delete',

  REVIEW_READ: 'review:read',
  REVIEW_UPDATE: 'review:update',
  REVIEW_DELETE: 'review:delete',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

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
  PERMISSIONS.REVIEW_READ,
  PERMISSIONS.REVIEW_UPDATE,
];

export type PermissionPresetId =
  | 'default_admin'
  | 'read_only'
  | 'contact_view'
  | 'contact_view_update'
  | 'booking_view'
  | 'booking_view_update'
  | 'support_agent'
  | 'content_manager'
  | 'tour_manager';

export interface PermissionPreset {
  id: PermissionPresetId;
  name: string;
  description: string;
  permissions: Permission[];
}

export const PERMISSION_PRESETS: PermissionPreset[] = [
  {
    id: 'default_admin',
    name: 'Default Admin',
    description: 'Recommended default set for most admins (read/update across main modules).',
    permissions: DEFAULT_ADMIN_PERMISSIONS,
  },
  {
    id: 'read_only',
    name: 'Read Only',
    description: 'Can view everything but cannot update/delete.',
    permissions: [
      PERMISSIONS.BLOG_READ,
      PERMISSIONS.TOUR_READ,
      PERMISSIONS.BOOKING_READ,
      PERMISSIONS.CONTACT_READ,
      PERMISSIONS.TAILOR_MADE_READ,
      PERMISSIONS.REVIEW_READ,
    ],
  },
  {
    id: 'contact_view',
    name: 'Contact Forms: View Only',
    description: 'Can view contact submissions only.',
    permissions: [PERMISSIONS.CONTACT_READ],
  },
  {
    id: 'contact_view_update',
    name: 'Contact Forms: View + Update',
    description: 'Can view and update contact submissions (no delete).',
    permissions: [PERMISSIONS.CONTACT_READ, PERMISSIONS.CONTACT_UPDATE],
  },
  {
    id: 'booking_view',
    name: 'Bookings: View Only',
    description: 'Can view bookings only.',
    permissions: [PERMISSIONS.BOOKING_READ],
  },
  {
    id: 'booking_view_update',
    name: 'Bookings: View + Update',
    description: 'Can view and update bookings (no delete).',
    permissions: [PERMISSIONS.BOOKING_READ, PERMISSIONS.BOOKING_UPDATE],
  },
  {
    id: 'support_agent',
    name: 'Support Agent (Bookings + Contact)',
    description: 'Can manage customer requests: bookings + contact + tailor-made (no delete).',
    permissions: [
      PERMISSIONS.BOOKING_READ,
      PERMISSIONS.BOOKING_UPDATE,
      PERMISSIONS.CONTACT_READ,
      PERMISSIONS.CONTACT_UPDATE,
      PERMISSIONS.TAILOR_MADE_READ,
      PERMISSIONS.TAILOR_MADE_UPDATE,
    ],
  },
  {
    id: 'content_manager',
    name: 'Content Manager (Blogs)',
    description: 'Can create/update blogs and view related items.',
    permissions: [
      PERMISSIONS.BLOG_READ,
      PERMISSIONS.BLOG_CREATE,
      PERMISSIONS.BLOG_UPDATE,
      PERMISSIONS.TOUR_READ,
    ],
  },
  {
    id: 'tour_manager',
    name: 'Tour Manager',
    description: 'Can create/update tours and view bookings.',
    permissions: [
      PERMISSIONS.TOUR_READ,
      PERMISSIONS.TOUR_CREATE,
      PERMISSIONS.TOUR_UPDATE,
      PERMISSIONS.BOOKING_READ,
    ],
  },
];
