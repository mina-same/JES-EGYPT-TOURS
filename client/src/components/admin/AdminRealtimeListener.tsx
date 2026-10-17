"use client";
import { ToastAction } from '@/components/ui/toast';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { notificationDestination, STOP_ADMIN_SOUND } from '@/lib/adminNotifications';
import { notificationAudio, playAcrossTabs, stopAcrossTabs } from '@/lib/adminNotificationAudio';
export default function AdminRealtimeListener() {
  const { events } = useNotifications(), { user } = useAuth(), router = useRouter();
  const lastBatch = useRef('');
  useEffect(() => {
    notificationAudio.load();
    const unlock = () => { void notificationAudio.unlock(); };
    const stop = (event: Event) => notificationAudio.stop((event as CustomEvent<string | undefined>).detail);
    window.addEventListener('pointerdown', unlock, { once: true }); window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener(STOP_ADMIN_SOUND, stop);
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); window.removeEventListener(STOP_ADMIN_SOUND, stop); notificationAudio.stop(); };
  }, []);
  useEffect(() => {
    lastBatch.current = ''; notificationAudio.stop();
    const stop = (event: StorageEvent) => {
      if (event.key === `jes:admin-audio-stop:${user?.id}` && event.newValue) { try { notificationAudio.stop(JSON.parse(event.newValue).id); } catch {} }
    };
    window.addEventListener('storage', stop);
    return () => window.removeEventListener('storage', stop);
  }, [user?.id]);
  useEffect(() => {
    if (!user || !events.length) return;
    const latest = events[events.length - 1], batchId = latest._id;
    if (lastBatch.current === batchId) return;
    lastBatch.current = batchId;
    void playAcrossTabs(user.id, batchId).catch(() => {});
    const destination = events.length === 1 ? notificationDestination(latest) : '/admin/notifications';
    toast({
      title: events.length === 1 ? latest.title : `${events.length} new requests`,
      description: events.length === 1 ? (latest.message || 'Open request details') : 'Open your notifications to review all new requests.',
      duration: 15000, className: 'cursor-pointer',
      action: <ToastAction altText="Silence this alert" onClick={event => { event.stopPropagation(); stopAcrossTabs(user.id, batchId); }}>Silence</ToastAction>,
      onClick: () => { stopAcrossTabs(user.id, batchId); if (destination) router.push(destination); },
      // Expiry deliberately does not silence a newer or still-unacknowledged alert.
    });
  }, [events, user, router]);
  return null;
}
