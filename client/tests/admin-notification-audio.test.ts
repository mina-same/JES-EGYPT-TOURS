import assert from 'node:assert/strict';
import test from 'node:test';
import { NotificationAudio } from '../src/lib/adminNotificationAudio';
import { notificationDestination } from '../src/lib/adminNotifications';
class FakeAudioContext {
  state = 'suspended'; currentTime = 0; destination = {};
  oscillators: Array<any> = [];
  gains: Array<any> = [];
  async resume() { this.state = 'running'; }
  createPeriodicWave(real: Float32Array, imag: Float32Array) { return { real, imag }; }
  createOscillator() {
    const frequencies: number[][] = [];
    const osc = { frequencies, wave: null as any, setPeriodicWave(wave: any) { this.wave = wave; }, frequency: { setValueAtTime(value: number, time: number) { frequencies.push([value, time]); } }, starts: 0, stops: [] as any[], connect() {}, disconnect() {}, start() { this.starts++; }, stop(time?: number) { this.stops.push(time); }, onended: null };
    this.oscillators.push(osc); return osc;
  }
  createGain() {
    const events: number[][] = [];
    const gain = { events, gain: { setValueAtTime(value: number, time: number) { events.push([value, time]); }, exponentialRampToValueAtTime(value: number, time: number) { events.push([value, time]); } }, connect() {}, disconnect() {} };
    this.gains.push(gain); return gain;
  }
}
test('audio requires activation, remains independent of renders, and only matching acknowledgments stop it', async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
  let context: FakeAudioContext;
  Object.defineProperty(globalThis, 'AudioContext', { configurable: true, value: class extends FakeAudioContext { constructor() { super(); context = this; } } });
  try {
    const audio = new NotificationAudio();
    assert.equal(audio.ready, false); await audio.play('before-activation');
    assert.equal(await audio.unlock(), true);
    audio.configure({ volume: 1 });
    const done = audio.play('new-request');
    assert.ok(context!.oscillators[0].wave.imag[2] > 0, 'Piano-like tone includes harmonics');
    assert.deepEqual(context!.oscillators[0].frequencies.slice(0, 4), [[523.25, 0], [659.25, 0.65], [783.99, 1.3], [1046.5, 0.65 * 3]]);
    assert.ok(context!.gains[0].events.some(([value, time]: number[]) => value === 1 && time === 0.008));
    assert.ok(context!.gains[0].events.some(([value, time]: number[]) => value === 0.0001 && time === 0.6));
    assert.ok(context!.gains[0].events.some(([value, time]: number[]) => value === 0.0001 && time === 0.65 * 3 + 1.4));
    assert.equal(context!.oscillators[0].starts, 1);
    assert.deepEqual(context!.oscillators[0].stops, [15.1]);
    audio.stop('old-request'); assert.deepEqual(context!.oscillators[0].stops, [15.1]);
    audio.stop('new-request'); await done;
    assert.deepEqual(context!.oscillators[0].stops, [15.1, undefined]);
    audio.configure({ enabled: false }); await audio.play('muted');
    assert.equal(context!.oscillators.length, 1);
    const preview = audio.play('test', true);
    assert.deepEqual(context!.oscillators[1].stops, [4.1]);
    assert.equal(context!.oscillators[1].frequencies.length, 4, 'Preview plays the complete four-note chime');
    audio.stop(); await preview;
  } finally { if (original) Object.defineProperty(globalThis, 'AudioContext', original); else Reflect.deleteProperty(globalThis, 'AudioContext'); }
});

test('full volume survives reload, preserves existing preferences and clamps invalid levels', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  let saved = '{}';
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => saved, setItem: (_key: string, value: string) => { saved = value; } } });
  try {
    const audio = new NotificationAudio(); audio.load();
    assert.equal(audio.settings.volume, 0.6);
    audio.configure({ volume: 1 });
    const reloaded = new NotificationAudio(); reloaded.load();
    assert.equal(reloaded.settings.volume, 1);
    saved = JSON.stringify({ volume: 0.5 }); reloaded.load();
    assert.equal(reloaded.settings.volume, 0.5);
    reloaded.configure({ volume: 3 }); assert.equal(reloaded.settings.volume, 1);
    reloaded.configure({ volume: -1 }); reloaded.load(); assert.equal(reloaded.settings.volume, 0);
  } finally { if (original) Object.defineProperty(globalThis, 'localStorage', original); else Reflect.deleteProperty(globalThis, 'localStorage'); }
});
test('every request notification links directly to its identity', () => {
  assert.equal(notificationDestination({ type: 'booking', entityId: 'booking-id' }), '/admin/tour/booking?id=booking-id');
  assert.equal(notificationDestination({ type: 'tailorMade', entityId: 'tailor-id' }), '/admin/contact-forms/tailor-made?id=tailor-id');
  assert.equal(notificationDestination({ type: 'contact', entityId: 'contact-id' }), '/admin/contact-forms/contact-form?id=contact-id');
});
