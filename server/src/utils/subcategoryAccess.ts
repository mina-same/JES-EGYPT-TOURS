import type { Request } from 'express';
import { PERMISSIONS } from '../permissions';

export const canReadDraftSubcategories = (req: { user?: Request['user'] }): boolean => {
  const user = req.user;
  return !!user && (user.role === 'superadmin' ||
    (Array.isArray(user.permissions) && user.permissions.includes(PERMISSIONS.TOUR_READ)));
};

export const subcategoryVisibility = (req: { user?: Request['user'] }) =>
  canReadDraftSubcategories(req) ? {} : { isActive: { $ne: false } };

// Categories and subcategories share the same tour editor permissions.
export const categoryVisibility = subcategoryVisibility;
