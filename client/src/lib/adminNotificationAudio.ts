export interface SoundSettings { enabled: boolean; volume: number; duration: number }
const DEFAULTS: SoundSettings = { enabled: true, volume: 0.6, duration: 15 };
const normalizeVolume = (value: unknown) => typeof value === 'number' && Number.isFinite(value)
  ? Math.min(1, Math.max(0, value)) : DEFAULTS.volume;
export const AUDIO_STATE_CHANGED = 'admin:audio-state';
/** One audio owner. Toast expiry and counter renders never control playback. */
export class NotificationAudio {
  private context: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private activeId: string | null = null;
  private finish: (() => void) | null = null;
  settings = { ...DEFAULTS };
  get ready() { return this.context?.state === 'running'; }
  load() {
    try { const saved = JSON.parse(localStorage.getItem('jes:notification-sound') || '{}'); this.settings = { enabled: saved.enabled !== false, volume: normalizeVolume(saved.volume), duration: [5, 15, 60].includes(saved.duration) ? saved.duration : DEFAULTS.duration }; } catch { /* defaults */ }
  }
  configure(patch: Partial<SoundSettings>) {
    this.settings = { ...this.settings, ...patch };
    this.settings.volume = normalizeVolume(this.settings.volume);
    try { localStorage.setItem('jes:notification-sound', JSON.stringify(this.settings)); } catch { /* optional */ }
    if (!this.settings.enabled) this.stop();
    this.changed();
  }
  private changed() { if (typeof window !== 'undefined') window.dispatchEvent(new Event(AUDIO_STATE_CHANGED)); }
  async unlock() {
    try {
      if (!this.context || this.context.state === 'closed') this.context = new AudioContext();
      if (this.context.state === 'suspended') await this.context.resume();
      this.changed();
      return this.ready;
    } catch { this.changed(); return false; }
  }
  stop(id?: string) {
    if (id && this.activeId !== id) return;
    try { this.oscillator?.stop(); } catch { /* already ended */ }
    this.oscillator?.disconnect(); this.gain?.disconnect();
    this.oscillator = null; this.gain = null; this.activeId = null;
    this.finish?.(); this.finish = null;
  }
  async play(id: string, testing = false): Promise<void> {
    if (!this.ready || (!testing && !this.settings.enabled)) return;
    this.stop();
    const ctx = this.context!, osc = ctx.createOscillator(), gain = ctx.createGain();
    this.oscillator = osc; this.gain = gain; this.activeId = id;
    const duration = testing ? 4 : this.settings.duration, t = ctx.currentTime;
    // A harmonic piano-like tone with a quick hammer attack and decaying notes.
    // Keep one source so stop/ownership remains atomic across the whole melody.
    osc.setPeriodicWave(ctx.createPeriodicWave(
      new Float32Array(9),
      new Float32Array([0, 1, 0.45, 0.24, 0.12, 0.06, 0.03, 0.015, 0.008]),
    ));
    gain.gain.setValueAtTime(0.0001, t);
    const peak = Math.max(0.0001, this.settings.volume);
    for (let offset = 0; offset < duration; offset += 4.2) {
      [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
        const start = t + offset + index * 0.65;
        if (start >= t + duration) return;
        const end = Math.min(start + (index === 3 ? 1.4 : 0.6), t + duration);
        osc.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(peak, start + 0.008);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * 0.4), Math.min(start + 0.4, end));
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
      });
    }
    osc.connect(gain); gain.connect(ctx.destination);
    const ended = new Promise<void>(resolve => { this.finish = resolve; });
    osc.onended = () => { if (this.activeId === id) this.stop(id); };
    osc.start(); osc.stop(t + duration + 0.1);
    await ended;
  }
}
export const notificationAudio = new NotificationAudio();
/** Web Locks gives exact one-tab ownership. The fallback lease covers older
 * browsers; a short arbitration delay makes simultaneous claims converge. */
export async function playAcrossTabs(account: string, id: string) {
  const name = `jes:notification-audio:${account}`;
  const heardKey = `${name}:heard`;
  const play = async () => {
    let heard: string[] = [];
    try { const saved = JSON.parse(localStorage.getItem(heardKey) || '[]'); heard = Array.isArray(saved) ? saved.filter(item => typeof item === 'string') : []; } catch { /* optional */ }
    if (heard.includes(id) || !notificationAudio.ready || !notificationAudio.settings.enabled) return;
    try { localStorage.setItem(heardKey, JSON.stringify([...heard, id].slice(-100))); } catch { /* optional */ }
    await notificationAudio.play(id);
  };
  if (navigator.locks?.request) {
    await navigator.locks.request(name, { ifAvailable: true }, async lock => { if (lock) await play(); });
    return;
  }
  const owner = crypto.randomUUID(), lease = { owner, until: Date.now() + 65000 };
  let storageAvailable = true;
  try {
    const current = JSON.parse(localStorage.getItem(name) || 'null');
    if (current?.until > Date.now()) return;
    localStorage.setItem(name, JSON.stringify(lease));
  } catch { storageAvailable = false; }
  await new Promise(resolve => setTimeout(resolve, 50));
  try {
    if (storageAvailable && JSON.parse(localStorage.getItem(name) || 'null')?.owner !== owner) return;
    await play();
  } finally {
    try { if (JSON.parse(localStorage.getItem(name) || 'null')?.owner === owner) localStorage.removeItem(name); } catch { /* optional */ }
  }
}

export function stopAcrossTabs(account: string, id?: string) {
  notificationAudio.stop(id);
  try { localStorage.setItem(`jes:admin-audio-stop:${account}`, JSON.stringify({ id, nonce: crypto.randomUUID() })); } catch { /* optional storage */ }
}
