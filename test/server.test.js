import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { mkdtemp, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

async function checkServer(entryPoint) {
  const child = spawn(process.execPath, [entryPoint, 'serve'], { stdio: ['pipe', 'pipe', 'pipe'] });
  const lines = createInterface({ input: child.stdout });
  const responses = lines[Symbol.asyncIterator]();
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '1' } } }) + '\n');
  const init = JSON.parse((await responses.next()).value);
  assert.equal(init.id, 1);
  assert.ok(init.result.serverInfo);
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }) + '\n');
  const list = JSON.parse((await responses.next()).value);
  assert.deepEqual(list.result.tools.map(tool => tool.name), ['list_folders']);
  child.stdin.end();
  const [code] = await new Promise(resolve => child.on('exit', (...args) => resolve(args)));
  assert.equal(code, 0);
}

test('serve initializes MCP and lists tools over stdio', async () => {
  await checkServer('dist/index.js');
});

test('serve starts through a symlinked entry point', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'outlookpilot-test-'));
  try {
    const entryPoint = join(directory, 'outlookpilot');
    await symlink(resolve('dist/index.js'), entryPoint);
    await checkServer(entryPoint);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
