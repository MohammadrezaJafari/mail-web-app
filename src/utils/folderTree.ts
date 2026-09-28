import type { Folder, FolderNode } from '@/types/api';

const ORDER: Record<string, number> = {
  inbox: 0,
  drafts: 1,
  sent: 2,
  archive: 3,
  junk: 4,
  trash: 5,
};

/** Turns the flat IMAP folder list into a tree using each folder's delimiter. */
export function buildFolderTree(folders: Folder[]): FolderNode[] {
  const byPath = new Map<string, FolderNode>();
  const roots: FolderNode[] = [];

  const sorted = [...folders].sort((a, b) => a.path.length - b.path.length);
  for (const f of sorted) {
    const delimiter = f.delimiter || '/';
    const parts = f.path.split(delimiter);
    const node: FolderNode = {
      ...f,
      label: parts[parts.length - 1] ?? f.name,
      depth: 0,
      children: [],
    };
    byPath.set(f.path, node);

    const parentPath = parts.length > 1 ? parts.slice(0, -1).join(delimiter) : null;
    const parent = parentPath ? byPath.get(parentPath) : undefined;
    if (parent) {
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes: FolderNode[]) => {
    nodes.sort((a, b) => {
      const ra = a.role ? (ORDER[a.role] ?? 9) : 10;
      const rb = b.role ? (ORDER[b.role] ?? 9) : 10;
      return ra - rb || a.label.localeCompare(b.label);
    });
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);

  return roots;
}

/** Depth-first flatten honoring collapsed nodes. */
export function flattenTree(nodes: FolderNode[], collapsed: Set<string>): FolderNode[] {
  const out: FolderNode[] = [];
  const walk = (list: FolderNode[]) => {
    for (const n of list) {
      out.push(n);
      if (n.children.length && !collapsed.has(n.path)) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}
