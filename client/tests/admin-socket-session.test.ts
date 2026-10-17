import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
test('switching accounts or clearing the session disconnects the old socket', () => {
  const source = fs.readFileSync(new URL('../src/lib/realtime/adminSocket.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  let token: string | null = 'account-A', disconnected = 0;
  const connections: any[] = [], module = { exports: {} as any };
  vm.runInNewContext(code, { exports: module.exports, window: { localStorage: { getItem: () => token } }, require: (name: string) => name === 'socket.io-client' ? { io: (_url: string, options: any) => { const socket = { auth: options.auth, disconnect: () => disconnected++ }; connections.push(socket); return socket; } } : { API_BASE_URL: 'http://local-test' } });
  const first = module.exports.getAdminSocket(); token = 'account-B';
  const second = module.exports.getAdminSocket(); assert.notEqual(first, second); assert.equal(second.auth.token, 'account-B'); assert.equal(disconnected, 1);
  token = null; assert.equal(module.exports.getAdminSocket(), null); assert.equal(disconnected, 2); assert.equal(connections.length, 2);
});
