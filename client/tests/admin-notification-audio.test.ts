import assert from 'node:assert/strict';
import test from 'node:test';
import { NotificationAudio } from '../src/lib/adminNotificationAudio';
import { notificationDestination } from '../src/lib/adminNotifications';
class FakeAudioContext {
  state = 'suspended'; currentTime = 0; destination = {};
  oscillators: Array<any> = [];
  async resume() { this.state = 'running'; }
  createOscillator() {
    const osc = { frequency: { setValueAtTime() {} }, starts: 0, stops: [] as any[], connect() {}, disconnect() {}, start() { this.starts++; }, stop(time?: number) { this.stops.push(time); }, onended: null };
    this.oscillators.push(osc); return osc;
  }
  createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
}
test('audio requires activation, remains independent of renders, and only matching acknowledgments stop it', async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
  let context: FakeAudioContext;
  Object.defineProperty(globalThis, 'AudioContext', { configurable: true, value: class extends FakeAudioContext { constructor() { super(); context = this; } } });
  try {
    const audio = new NotificationAudio();
    assert.equal(audio.ready, false); await audio.play('before-activation');
    assert.equal(await audio.unlock(), true);
    const done = audio.play('new-request');
    assert.equal(context!.oscillators[0].starts, 1);
    assert.deepEqual(context!.oscillators[0].stops, [15.1]);
    audio.stop('old-request'); assert.deepEqual(context!.oscillators[0].stops, [15.1]);
    audio.stop('new-request'); await done;
    assert.deepEqual(context!.oscillators[0].stops, [15.1, undefined]);
    audio.configure({ enabled: false }); await audio.play('muted');
    assert.equal(context!.oscillators.length, 1);
  } finally { if (original) Object.defineProperty(globalThis, 'AudioContext', original); else Reflect.deleteProperty(globalThis, 'AudioContext'); }
});
test('every request notification links directly to its identity', () => {
  assert.equal(notificationDestination({ type: 'booking', entityId: 'booking-id' }), '/admin/tour/booking?id=booking-id');
  assert.equal(notificationDestination({ type: 'tailorMade', entityId: 'tailor-id' }), '/admin/contact-forms/tailor-made?id=tailor-id');
  assert.equal(notificationDestination({ type: 'contact', entityId: 'contact-id' }), '/admin/contact-forms/contact-form?id=contact-id');
});
