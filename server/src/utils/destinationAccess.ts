import type { Request } from 'express';
import type { PopulateOptions } from 'mongoose';
import { PERMISSIONS } from '../permissions';
import { publicDestinationPopulate } from '../models/Destination';

/**
 * Who may read draft destinations through the reads the Admin and the visitor
 * site share.
 *
 * Those routes are public (optionalProtect). An anonymous caller gets landing
 * pages only (PUBLIC_DESTINATION_FILTER), so an unfinished page is not readable
 * through the API. The Admin's requests carry its token and see every
 * destination: its editors, whose saved references must come back whole or a
 * save would drop them, and the tour form's Places Visited picker, which may
 * select a draft.
 */
export const canReadAllDestinations = (req: { user?: Request['user'] }): boolean => {
  const user = req.user;
  if (!user) return false;
  if (user.role === 'superadmin') return true;
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  return permissions.includes(PERMISSIONS.BLOG_READ) || permissions.includes(PERMISSIONS.TOUR_READ);
};

/**
 * Populates a destination reference on a read the Admin and the visitor site
 * share: every referenced destination for the Admin, published landing pages
 * for anyone else. A destination left out simply drops out of the populated
 * array; the stored reference is not touched.
 */
export const destinationPopulateFor = (
  req: { user?: Request['user'] },
  path: string,
  select?: string
): PopulateOptions =>
  canReadAllDestinations(req)
    ? { path, ...(select ? { select } : {}) }
    : publicDestinationPopulate(path, select);
