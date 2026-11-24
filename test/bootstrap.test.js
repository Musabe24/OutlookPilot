import { test } from 'node:test';

test('the built entry module loads', async () => {
  await import('../dist/index.js');
});
