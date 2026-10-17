import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import vm from 'node:vm';

export async function runRequestBrowser({ base, token, admin, call, questionId }: any) {
  const { chromium, expect } = require('../../client/node_modules/@playwright/test');
  process.env.NODE_ENV = 'development';
  process.env.NEXT_PUBLIC_API_URL = base.replace('/api', '');
  process.env.NEXT_TELEMETRY_DISABLED = '1';
  const next = require('../../client/node_modules/next');
  // A separate project directory also isolates Next's dev-server registry/lock.
  // The employee's already-running development server is left alone.
  const source = path.resolve(__dirname, '../../client');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jes-request-browser-'));
  const dir = path.join(root, 'client');
  fs.mkdirSync(dir);
  for (const folder of ['src', 'public']) fs.cpSync(path.join(source, folder), path.join(dir, folder), { recursive: true });
  for (const name of ['package.json', 'tsconfig.json', 'next.config.ts', 'postcss.config.js', 'tailwind.config.js']) fs.copyFileSync(path.join(source, name), path.join(dir, name));
  fs.symlinkSync(path.join(source, 'node_modules'), path.join(dir, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  fs.mkdirSync(path.join(root, 'server/src/config'), { recursive: true });
  fs.copyFileSync(path.resolve(__dirname, '../src/config/tourFilters.json'), path.join(root, 'server/src/config/tourFilters.json'));
  const originalCwd = process.cwd();
  process.chdir(dir);
  const frontend = next({ dev: true, webpack: true, dir, hostname: '127.0.0.1', port: 3108 });
  await frontend.prepare();
  const server = http.createServer(frontend.getRequestHandler());
  await new Promise<void>(resolve => server.listen(3108, '127.0.0.1', resolve));
  let browser: any;
  try {
    // Next dev can start serving HTML while its large client chunk is still
    // being written. Validate the emitted assets before launching the browser.
    const html = await (await fetch('http://127.0.0.1:3108/admin/tour/booking')).text();
    const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match => match[1].replace(/&amp;/g, '&'));
    for (const script of scripts) {
      let valid = false;
      for (let attempt = 0; attempt < 30; attempt++) {
        try {
          const response = await fetch(new URL(script, 'http://127.0.0.1:3108'));
          if (!response.ok) throw new Error('Asset is not ready');
          new vm.Script(await response.text());
          valid = true; break;
        } catch { await new Promise(resolve => setTimeout(resolve, 200)); }
      }
      if (!valid) throw new Error(`Client asset did not finish compiling: ${script}`);
    }
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const context = await browser.newContext();
    await context.addInitScript(({ token, admin }: any) => {
      if (!sessionStorage.getItem('request-test-auth')) {
        localStorage.setItem('authToken', token); localStorage.setItem('user', JSON.stringify(admin)); sessionStorage.setItem('request-test-auth', '1');
      }
      (window as any).__audioStarts = 0;
      (window as any).__audioActive = false;
      const Original = window.AudioContext;
      window.AudioContext = class extends Original {
        createOscillator() {
          const osc = super.createOscillator(), start = osc.start.bind(osc), stop = osc.stop.bind(osc);
          osc.start = (...args: any[]) => { (window as any).__audioStarts++; (window as any).__audioActive = true; start(...args); };
          osc.stop = (...args: any[]) => { if (!args.length) (window as any).__audioActive = false; stop(...args); };
          osc.addEventListener('ended', () => { (window as any).__audioActive = false; });
          return osc;
        }
      };
    }, { token, admin });
    const page = await context.newPage();
    const debugging = await context.newCDPSession(page);
    await debugging.send('Debugger.enable');
    await debugging.send('Runtime.enable');
    debugging.on('Runtime.exceptionThrown', (event: any) => {
      const info = event.exceptionDetails;
      console.log('Runtime exception location:', info.url, info.lineNumber, info.columnNumber, info.exception?.description);
    });
    debugging.on('Debugger.scriptFailedToParse', async (event: any) => {
      const { scriptSource } = await debugging.send('Debugger.getScriptSource', { scriptId: event.scriptId }).catch(() => ({ scriptSource: '' }));
      console.log('Script parse failure:', event.url, 'line', event.startLine, 'characters', scriptSource.length, scriptSource.slice(0, 180));
      fs.writeFileSync(path.join(root, 'failed-browser-script.js'), scriptSource);
    });
    const errors: string[] = [];
    page.on('pageerror', (error: Error) => { errors.push(error.message); console.log('Browser runtime error:', error.stack || error.message); });
    page.on('requestfailed', (request: any) => { if (!request.url().includes('socket.io')) console.log('Browser request failed:', request.url(), request.failure()?.errorText); });
    const unlock = async (target = page) => {
      const summary = target.locator('summary').filter({ hasText: 'Notifications:' });
      await summary.click();
      await target.getByRole('button', { name: 'Test sound', exact: true }).click();
      await expect.poll(() => target.evaluate(() => (window as any).__audioActive)).toBe(false);
      await summary.click();
      await target.evaluate(() => { (window as any).__audioStarts = 0; });
    };
    await page.goto('http://127.0.0.1:3108/admin/tour/booking');
    if (errors.length) throw new Error('Browser startup: ' + errors.join('; '));
    console.log('Browser reached:', page.url());
    await expect(page.getByText('Original tour name', { exact: true }).first()).toBeVisible({ timeout: 90000 });
    await unlock();
    const created = await call('/contact', { method: 'POST', headers: { 'Idempotency-Key': randomUUID() }, body: { name: 'Browser visitor', email: 'browser@example.travel', phone: '+201001234567', message: 'Browser lifecycle test', locale: 'en' } });
    assert.equal(created.status, 201);
    await expect(page.getByText('New Contact Form', { exact: true })).toBeVisible({ timeout: 45000 });
    await expect.poll(() => page.evaluate(() => (window as any).__audioStarts)).toBe(1);
    await page.waitForTimeout(6000);
    assert.equal(await page.evaluate(() => (window as any).__audioActive), true, 'Counters and toast expiry must not stop the alert');
    await page.getByText('New Contact Form', { exact: true }).click();
    await expect(page).toHaveURL(/contact-form\?id=/);
    await expect(page.getByText('browser@example.travel', { exact: true }).last()).toBeVisible({ timeout: 60000 });
    assert.equal(await page.evaluate(() => (window as any).__audioActive), false);
    await page.goto(`http://127.0.0.1:3108/admin/contact-forms/contact-form?id=${questionId}`);
    await expect(page.getByText('Question visitor', { exact: true }).last()).toBeVisible({ timeout: 60000 });
    await page.goto('http://127.0.0.1:3108/admin/notifications');
    await expect(page.getByRole('heading', { name: 'Notifications', exact: true })).toBeVisible({ timeout: 60000 });
    await page.getByTitle('Next page', { exact: true }).click();
    await expect(page.getByText(/Page 2 of/)).toBeVisible();
    const before = await page.getByTitle('Dismiss from my inbox').count();
    await page.route('**/api/notifications/*', (route: any) => route.request().method() === 'DELETE' ? route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Simulated server failure' }) }) : route.continue());
    await page.getByTitle('Dismiss from my inbox').first().click();
    await expect(page.getByText('Operation failed', { exact: true })).toBeVisible();
    assert.equal(await page.getByTitle('Dismiss from my inbox').count(), before);
    await page.unroute('**/api/notifications/*');
    // Two activated tabs must share one audible alert and remote Stop control.
    const second = await context.newPage();
    second.on('pageerror', (error: Error) => errors.push(error.message));
    await second.goto('http://127.0.0.1:3108/admin/notifications');
    await expect(second.getByRole('heading', { name: 'Notifications', exact: true })).toBeVisible({ timeout: 60000 });
    await unlock(page); await unlock(second);
    await call('/contact', { method: 'POST', headers: { 'Idempotency-Key': randomUUID() }, body: { name: 'Two-tab visitor', email: 'two-tabs@example.travel', phone: '+201001234567', message: 'Two-tab sound test', locale: 'en' } });
    const starts = async () => (await page.evaluate(() => (window as any).__audioStarts)) + (await second.evaluate(() => (window as any).__audioStarts));
    await expect.poll(starts, { timeout: 10000 }).toBe(1);
    await page.waitForTimeout(1500); assert.equal(await starts(), 1);
    await page.locator('summary').filter({ hasText: 'Notifications:' }).click();
    await page.getByRole('button', { name: 'Stop sound', exact: true }).click();
    await expect.poll(async () => (await page.evaluate(() => (window as any).__audioActive)) || (await second.evaluate(() => (window as any).__audioActive))).toBe(false);
    await page.locator('summary').filter({ hasText: 'Notifications:' }).click();
    await second.close();
    await page.route('**/socket.io/**', (route: any) => route.abort());
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Notifications', exact: true })).toBeVisible({ timeout: 60000 });
    await unlock();
    await call('/contact', { method: 'POST', headers: { 'Idempotency-Key': randomUUID() }, body: { name: 'Fallback visitor', email: 'fallback@example.travel', phone: '+201001234567', message: 'Polling fallback test', locale: 'en' } });
    await expect(page.getByText('fallback@example.travel', { exact: false }).first()).toBeVisible({ timeout: 45000 });
    assert.deepEqual(errors, [], 'No uncaught browser errors');
    console.log('Browser verified: actual admin rendering, sound activation/playback/stop, direct details outside pagination, inbox pagination, failed mutation feedback and HTTP fallback.');
  } finally {
    await browser?.close();
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    await frontend.close();
    process.chdir(originalCwd);
    const disposable = fs.realpathSync(root), temp = fs.realpathSync(os.tmpdir());
    const modules = path.join(dir, 'node_modules');
    if (path.dirname(disposable) !== temp || !path.basename(disposable).startsWith('jes-request-browser-')) throw new Error('Unexpected test cleanup path');
    if (!fs.lstatSync(modules).isSymbolicLink() || fs.realpathSync(modules) !== fs.realpathSync(path.join(source, 'node_modules'))) throw new Error('Unexpected test dependency link');
    fs.unlinkSync(modules); // Remove the junction before recursively removing our temporary copy.
    fs.rmSync(disposable, { recursive: true, force: true });
  }
}
