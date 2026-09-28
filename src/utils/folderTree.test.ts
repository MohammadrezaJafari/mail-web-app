import { describe, expect, it } from 'vitest';
import { buildFolderTree, flattenTree } from './folderTree';
import type { Folder } from '@/types/api';

const f = (path: string, role: Folder['role'] = null): Folder => ({
  path,
  name: path.split('.').pop()!,
  role,
  unread: 0,
  total: 0,
  uidnext: 1,
  uidvalidity: 1,
  delimiter: '.',
});

describe('folderTree', () => {
  it('nests children and keeps system folders first', () => {
    const tree = buildFolderTree([
      f('Projects.Alpha'),
      f('Projects'),
      f('INBOX', 'inbox'),
      f('Trash', 'trash'),
      f('Projects.Alpha.Docs'),
    ]);
    expect(tree.map((n) => n.path)).toEqual(['INBOX', 'Trash', 'Projects']);
    expect(tree[2]!.children[0]!.path).toBe('Projects.Alpha');
    expect(tree[2]!.children[0]!.children[0]!.depth).toBe(2);
    expect(flattenTree(tree, new Set(['Projects'])).map((n) => n.path)).toEqual([
      'INBOX',
      'Trash',
      'Projects',
    ]);
    expect(flattenTree(tree, new Set()).length).toBe(5);
  });
});
