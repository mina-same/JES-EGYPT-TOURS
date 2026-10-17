import Notification from '../models/Notification';
import Booking from '../models/Booking';
import TailorMadeRequest from '../models/TailorMadeRequest';
import ContactSubmission from '../models/ContactSubmission';
import { emitAdminNotification, emitDashboardStatsUpdate } from '../realtime/socket';
import type { RequestNotificationType } from './notificationAccess';
const models = { booking: Booking, contact: ContactSubmission, tailorMade: TailorMadeRequest };
/** Upsert by a unique delivery key before broadcasting. The request retains its
 * durable pending flag until persistence succeeds, including after a restart. */
export async function notifySubmission(type: RequestNotificationType, document: any, title: string, message: string) {
  try {
    await Notification.init();
    const eventKey = `${type}:${document._id}`;
    let notification;
    try {
      notification = await Notification.findOneAndUpdate({ eventKey }, { $setOnInsert: { eventKey, type, title, message, entityId: document._id } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
      notification = await Notification.findOne({ eventKey });
    }
    if (!notification) throw new Error('Notification was not persisted');
    await (models[type] as any).updateOne({ _id: document._id }, { $set: { notificationPending: false } }, { timestamps: false });
    try {
      await emitAdminNotification({ id: notification._id.toString(), type, title, entityId: document._id.toString(), createdAt: notification.createdAt.toISOString() });
    } catch (error) { console.warn('Persisted notification will be delivered by HTTP synchronization:', error); }
    void emitDashboardStatsUpdate();
  } catch (error) {
    console.error('Notification pending; it will be retried:', error);
  }
}
let draining: Promise<void> | null = null;
export function drainSubmissionNotifications(): Promise<void> {
  if (draining) return draining;
  draining = (async () => {
    for (const type of Object.keys(models) as RequestNotificationType[]) {
      const documents = await (models[type] as any).find({ notificationPending: true }).sort({ createdAt: 1 }).limit(100);
      for (const document of documents) {
        const name = document.fullName || document.name;
        const title = type === 'booking' ? 'New Booking' : type === 'tailorMade' ? 'New Tailor-Made' : document.source === 'tour-question' ? 'New Tour Question' : document.source === 'travel-trade' ? 'New Travel Trade Inquiry' : 'New Contact Form';
        await notifySubmission(type, document, title, `${name} (${document.email})`);
      }
    }
  })().finally(() => { draining = null; });
  return draining;
}
export function startNotificationDelivery() {
  const run = () => { void drainSubmissionNotifications().catch(error => console.error('Notification recovery failed:', error)); };
  run();
  const timer = setInterval(run, 15000);
  timer.unref();
  return () => clearInterval(timer);
}
