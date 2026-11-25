#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

async function main(): Promise<void> {
  if (process.argv[2] !== 'serve' || process.argv.length !== 3) {
    console.error('Usage: outlookpilot serve');
    process.exitCode = 1;
    return;
  }
  const server = new McpServer({ name: 'outlookpilot', version: '0.1.0' });
  server.server.registerCapabilities({ tools: {} });
  server.server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [] }));
  await server.connect(new StdioServerTransport());
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  main().catch((error: unknown) => {
    console.error('Failed to start server:', error);
    process.exitCode = 1;
  });
}
