"use client";
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { notificationAudio, AUDIO_STATE_CHANGED, stopAcrossTabs } from '@/lib/adminNotificationAudio';
export default function AdminNotificationControls() {
  const { user } = useAuth();
  const { connected, syncError } = useNotifications();
  const [sound, setSound] = useState({ ...notificationAudio.settings, ready: false });
  useEffect(() => {
    notificationAudio.load();
    const update = () => setSound({ ...notificationAudio.settings, ready: notificationAudio.ready });
    update(); window.addEventListener(AUDIO_STATE_CHANGED, update);
    return () => window.removeEventListener(AUDIO_STATE_CHANGED, update);
  }, []);
  return <details className="relative text-xs">
    <summary className="cursor-pointer rounded-md border px-3 py-2" title={syncError || (connected ? 'Realtime connected' : 'Automatic refresh is active')}>
      {syncError ? 'Notifications: retrying' : connected ? 'Notifications: live' : 'Notifications: auto refresh'} ? {sound.enabled && sound.ready ? 'Sound on' : 'Sound off'}
    </summary>
    <div className="absolute right-0 z-50 mt-2 w-64 space-y-3 rounded-lg border bg-background p-4 shadow-lg">
      {syncError && <p role="status">{syncError}</p>}
      <button type="button" className="rounded border px-2 py-1" onClick={async () => { await notificationAudio.unlock(); notificationAudio.configure({ enabled: !sound.enabled || !sound.ready }); }}> {sound.enabled && sound.ready ? 'Mute sound' : 'Enable sound'}</button>
      <label className="block">Volume <input aria-label="Notification volume" type="range" min="0.05" max="0.5" step="0.05" value={sound.volume} onChange={e => notificationAudio.configure({ volume: Number(e.target.value) })} /></label>
      <label className="block">Alert duration <select className="ml-2 rounded border bg-background" value={sound.duration} onChange={e => notificationAudio.configure({ duration: Number(e.target.value) })}><option value={5}>5 seconds</option><option value={15}>15 seconds</option><option value={60}>60 seconds</option></select></label>
      <div className="flex gap-2"><button type="button" className="rounded border px-2 py-1" onClick={async () => { if (await notificationAudio.unlock()) void notificationAudio.play('test', true); }}>Test sound</button><button type="button" className="rounded border px-2 py-1" onClick={() => { if (user) stopAcrossTabs(user.id); }}>Stop sound</button></div>
      {!sound.ready && <p>Click Enable sound, then test that you can hear the alert.</p>}
    </div>
  </details>;
}
