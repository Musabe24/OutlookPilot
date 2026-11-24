import { test } from 'node:test';
import assert from 'node:assert/strict';

test('temporary CI failure probe', () => {
  assert.fail('Intentional failure to verify CI');
});
