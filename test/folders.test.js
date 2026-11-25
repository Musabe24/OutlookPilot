import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../dist/server.js';
import { GraphFolders } from '../dist/folders.js';

test('list_folders exposes root and child folders, including well-known destinations', async () => {
  const requests = [];
  const responses = {
    '/me/mailFolders': { value: [{ id: 'inbox', displayName: 'Inbox' }] },
    '/me/mailFolders/archive': { id: 'archive-id', displayName: 'Archive' },
    '/me/mailFolders/deleteditems': { id: 'deleted-id', displayName: 'Deleted Items' },
    '/me/mailFolders/parent%2Fid/childFolders': { value: [{ id: 'child', displayName: 'Projects' }] },
  };
  const graph = new GraphFolders(async path => {
    requests.push(path);
    assert.ok(responses[path], `unexpected path ${path}`);
    return responses[path];
  });
  const server = createServer(graph);
  const client = new Client({ name: 'test', version: '1' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  try {
    assert.ok((await client.listTools()).tools.some(tool => tool.name === 'list_folders'));
    const root = await client.callTool({ name: 'list_folders', arguments: {} });
    assert.deepEqual(JSON.parse(root.content[0].text), [
      { id: 'inbox', displayName: 'Inbox' },
      { id: 'archive-id', displayName: 'Archive' },
      { id: 'deleted-id', displayName: 'Deleted Items' },
    ]);
    const child = await client.callTool({ name: 'list_folders', arguments: { parentId: 'parent/id' } });
    assert.deepEqual(JSON.parse(child.content[0].text), [{ id: 'child', displayName: 'Projects' }]);
    assert.equal(requests.at(-1), '/me/mailFolders/parent%2Fid/childFolders');
  } finally {
    await client.close();
    await server.close();
  }
});
