import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { FolderSource } from './folders.js';

export function createServer(folders: FolderSource): McpServer {
  const server = new McpServer({ name: 'outlookpilot', version: '0.1.0' });
  server.registerTool('list_folders', {
    description: 'List root mail folders or the children of a folder. Pagination will be added in a later task.',
    inputSchema: { parentId: z.string().min(1).optional().describe('Parent folder ID; omit to list root folders.') },
  }, async ({ parentId }) => {
    try {
      return { content: [{ type: 'text', text: JSON.stringify(await folders.list(parentId)) }] };
    } catch {
      return { isError: true, content: [{ type: 'text', text: 'Unable to list folders. Check account access and try again.' }] };
    }
  });
  return server;
}
