export interface Folder {
  id: string;
  displayName: string;
}

export interface FolderSource {
  list(parentId?: string): Promise<Folder[]>;
}

type GraphGet = (path: string) => Promise<unknown>;

function parseFolder(value: unknown): Folder {
  if (typeof value !== 'object' || value === null ||
      typeof (value as Folder).id !== 'string' || typeof (value as Folder).displayName !== 'string') {
    throw new Error('Invalid folder response');
  }
  const { id, displayName } = value as Folder;
  return { id, displayName };
}

export class GraphFolders implements FolderSource {
  constructor(private readonly get: GraphGet) {}

  async list(parentId?: string): Promise<Folder[]> {
    const path = parentId === undefined ? '/me/mailFolders' : `/me/mailFolders/${encodeURIComponent(parentId)}/childFolders`;
    const response = await this.get(path);
    if (typeof response !== 'object' || response === null || !Array.isArray((response as { value?: unknown }).value)) {
      throw new Error('Invalid folder response');
    }
    const folders = (response as { value: unknown[] }).value.map(parseFolder);
    if (parentId === undefined) {
      for (const name of ['archive', 'deleteditems']) {
        const folder = parseFolder(await this.get(`/me/mailFolders/${name}`));
        if (!folders.some(existing => existing.id === folder.id)) folders.push(folder);
      }
    }
    return folders;
  }
}
