import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification';
import Booking from '../models/Booking';
import ContactSubmission from '../models/ContactSubmission';
import TailorMadeRequest from '../models/TailorMadeRequest';
import User from '../models/User';
import Tour from '../models/Tour';
import { PERMISSIONS } from '../permissions';
import { notificationScope, canRead } from '../utils/notificationAccess';
import { paginationInput, respondSubmissionError } from '../utils/submission';
import { drainSubmissionNotifications } from '../utils/submissionNotification';
import { getBookingToday } from '../utils/booking';
const userOf = (req: Request) => (req as any).user;
function serialize(document: any, userId: unknown) {
  const value = { ...(document.toObject ? document.toObject() : document) };
  const readBy = value.readBy || [];
  for (const key of ['readBy', 'announcedBy', 'hiddenBy', 'eventKey']) Reflect.deleteProperty(value, key);
  return { ...value, isRead: readBy.some((id: unknown) => String(id) === String(userId)) };
}
export async function requestCounts(user: any) {
  const [bookingsPending, contactNew, tailorMadePending] = await Promise.all([
    canRead(user, PERMISSIONS.BOOKING_READ) ? Booking.countDocuments({ status: 'pending' }) : 0,
    canRead(user, PERMISSIONS.CONTACT_READ) ? ContactSubmission.countDocuments({ status: 'new' }) : 0,
    canRead(user, PERMISSIONS.TAILOR_MADE_READ) ? TailorMadeRequest.countDocuments({ status: 'pending' }) : 0,
  ]);
  return { bookingsPending, contactNew, tailorMadePending, updatedAt: new Date().toISOString() };
}
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = userOf(req), { page, limit, skip } = paginationInput(req.query, 20);
    const query: any = notificationScope(user);
    if (req.query.type && req.query.type !== 'all') query.$and = [{ type: req.query.type }];
    if (req.query.status === 'read') query.readBy = user._id;
    if (req.query.status === 'unread') query.readBy = { $ne: user._id };
    const [documents, total] = await Promise.all([Notification.find(query).sort({ _id: -1 }).skip(skip).limit(limit), Notification.countDocuments(query)]);
    res.json({ success: true, data: documents.map(doc => serialize(doc, user._id)), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { respondSubmissionError(res, error, 'Failed to fetch notifications'); }
};
/** Pending announcements are acknowledged explicitly. Lost HTTP responses and
 * out-of-order database inserts remain recoverable; old inbox rows are not new. */
export const syncNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = userOf(req);
    await drainSubmissionNotifications();
    if (!user.notificationBaselineReady) {
      const initialized = user.notificationBaselineAt ? user : await User.findOneAndUpdate({ _id: user._id, notificationBaselineAt: { $exists: false } }, { $set: { notificationBaselineAt: new Date() } }, { new: true, timestamps: false });
      const baseline = initialized?.notificationBaselineAt || (await User.findById(user._id))?.notificationBaselineAt;
      if (!baseline) throw new Error('Unable to initialize notification delivery');
      await Notification.updateMany({ createdAt: { $lte: baseline } }, { $addToSet: { announcedBy: user._id } });
      await User.updateOne({ _id: user._id }, { $set: { notificationBaselineReady: true } }, { timestamps: false });
    }
    const scope: any = notificationScope(user);
    const [rows, unreadCount, counts] = await Promise.all([
      Notification.find({ ...scope, announcedBy: { $ne: user._id }, readBy: { $ne: user._id } }).sort({ _id: 1 }).limit(101),
      Notification.countDocuments({ ...scope, readBy: { $ne: user._id } }), requestCounts(user),
    ]);
    res.json({ success: true, data: rows.slice(0, 100).map(doc => serialize(doc, user._id)), hasMore: rows.length > 100, unreadCount, counts });
  } catch (error) { respondSubmissionError(res, error, 'Failed to synchronize notifications'); }
};
export const acknowledgeNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const ids = req.body.ids;
    if (!Array.isArray(ids) || ids.length > 100 || !ids.every(id => typeof id === 'string' && mongoose.isValidObjectId(id))) { res.status(400).json({ success: false, error: 'Invalid notification identities' }); return; }
    const user = userOf(req);
    await Notification.updateMany({ ...notificationScope(user), _id: { $in: ids } }, { $addToSet: { announcedBy: user._id } });
    res.json({ success: true });
  } catch (error) { respondSubmissionError(res, error, 'Failed to acknowledge notifications'); }
};
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = userOf(req);
    const result = await Notification.updateOne({ ...notificationScope(user), _id: req.params.id }, { $addToSet: { readBy: user._id, announcedBy: user._id } });
    if (!result.matchedCount) { res.status(404).json({ success: false, error: 'Notification not found' }); return; }
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) { respondSubmissionError(res, error, 'Failed to mark notification as read'); }
};
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = userOf(req);
    await Notification.updateMany(notificationScope(user), { $addToSet: { readBy: user._id, announcedBy: user._id } });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) { respondSubmissionError(res, error, 'Failed to mark notifications as read'); }
};
/** Dismiss only for this employee. Never remove a colleague's inbox item. */
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = userOf(req);
    const result = await Notification.updateOne({ ...notificationScope(user), _id: req.params.id }, { $addToSet: { hiddenBy: user._id, readBy: user._id, announcedBy: user._id } });
    if (!result.matchedCount) { res.status(404).json({ success: false, error: 'Notification not found' }); return; }
    res.json({ success: true, message: 'Notification dismissed' });
  } catch (error) { respondSubmissionError(res, error, 'Failed to dismiss notification'); }
};
export const getAdminOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = userOf(req), counts = await requestCounts(user);
    const today = new Date(getBookingToday() + 'T00:00:00Z');
    const dates = Array.from({ length: 14 }, (_, i) => new Date(today.getTime() - (13 - i) * 86400000).toISOString().slice(0, 10));
    const start = new Date(today.getTime() - 14 * 86400000);
    const trend = (model: any, permission: string, extra = {}) => canRead(user, permission) ? model.aggregate([
      { $match: { createdAt: { $gte: start }, ...extra } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Africa/Cairo' } }, count: { $sum: 1 } } },
    ]) : [];
    const [bookingDays, contactDays, tailorDays, bookings, contacts, tailorMade, usersTotal, toursTotal, toursActive, specialOffers] = await Promise.all([
      trend(Booking, PERMISSIONS.BOOKING_READ), trend(ContactSubmission, PERMISSIONS.CONTACT_READ, { isSpam: { $ne: true } }), trend(TailorMadeRequest, PERMISSIONS.TAILOR_MADE_READ),
      canRead(user, PERMISSIONS.BOOKING_READ) ? Booking.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(5).populate('tour', 'heading slug images') : [],
      canRead(user, PERMISSIONS.CONTACT_READ) ? ContactSubmission.find({ status: 'new' }).sort({ createdAt: -1 }).limit(5) : [],
      canRead(user, PERMISSIONS.TAILOR_MADE_READ) ? TailorMadeRequest.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(5) : [],
      canRead(user, PERMISSIONS.USER_READ) ? User.countDocuments() : null,
      canRead(user, PERMISSIONS.TOUR_READ) ? Tour.countDocuments() : null,
      canRead(user, PERMISSIONS.TOUR_READ) ? Tour.countDocuments({ isActive: true }) : null,
      canRead(user, PERMISSIONS.TOUR_READ) ? Tour.countDocuments({ isSpecialOffer: true }) : null,
    ]);
    const series = (rows: any[]) => dates.map(date => rows.filter(row => row._id === date).reduce((n, row) => n + row.count, 0));
    res.json({ success: true, counts: { ...counts, usersTotal, toursTotal, toursActive, specialOffers }, queues: { bookings, contacts, tailorMade }, analytics: { dates, bookings: series(bookingDays), leads: series([...contactDays, ...tailorDays]) } });
  } catch (error) { respondSubmissionError(res, error, 'Failed to load dashboard'); }
};

export const markEntityAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, entityId } = req.body, user = userOf(req);
    if (!['booking', 'contact', 'tailorMade'].includes(type) || typeof entityId !== 'string' || !mongoose.isValidObjectId(entityId)) { res.status(400).json({ success: false, error: 'Invalid request identity' }); return; }
    // Combine, never overwrite, the permission constraint with the chosen type.
    await Notification.updateMany({ ...notificationScope(user), $and: [{ type }], entityId }, { $addToSet: { readBy: user._id, announcedBy: user._id } });
    res.json({ success: true });
  } catch (error) { respondSubmissionError(res, error, 'Failed to update notification read status'); }
};
