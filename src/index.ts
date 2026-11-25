#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

async function main(): Promise<void> {
  if (process.argv[2] !== 'serve' || process.argv.length !== 3) {
    console.error('Usage: outlookpilot serve');
    process.exitCode = 1;
    return;
  }
  // Authentication and a live Graph client are connected in the authentication milestone.
  const server = createServer({ list: async () => { throw new Error('Login required'); } });
  await server.connect(new StdioServerTransport());
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  main().catch((error: unknown) => {
    console.error('Failed to start server:', error);
    process.exitCode = 1;
  });
}
