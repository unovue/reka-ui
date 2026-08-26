export interface FileNode {
  name: string
  icon?: string
  children?: FileNode[]
}

export const initialFiles: FileNode[] = [
  {
    name: 'components',
    children: [
      { name: 'Card.vue', icon: 'vscode-icons:file-type-vue' },
      { name: 'Button.vue', icon: 'vscode-icons:file-type-vue' },
    ],
  },
  {
    name: 'composables',
    children: [
      { name: 'useAuth.ts', icon: 'vscode-icons:file-type-typescript' },
      { name: 'useUser.ts', icon: 'vscode-icons:file-type-typescript' },
    ],
  },
  { name: 'app.vue', icon: 'vscode-icons:file-type-vue' },
  { name: 'nuxt.config.ts', icon: 'vscode-icons:file-type-nuxt' },
]

/** Depth-first search for the node holding `name`, plus the array it lives in. */
export function locate(
  nodes: FileNode[],
  name: string,
): { parent: FileNode[], node: FileNode } | undefined {
  for (const node of nodes) {
    if (node.name === name)
      return { parent: nodes, node }
    if (node.children) {
      const found = locate(node.children, name)
      if (found)
        return found
    }
  }
}

/** Tree keys must stay unique, so a rename or a new file resolves collisions. */
export function uniqueName(siblings: FileNode[], desired: string, ignore?: FileNode) {
  const taken = new Set(siblings.filter(node => node !== ignore).map(node => node.name))
  if (!taken.has(desired))
    return desired

  const dot = desired.lastIndexOf('.')
  const stem = dot > 0 ? desired.slice(0, dot) : desired
  const ext = dot > 0 ? desired.slice(dot) : ''

  let counter = 2
  while (taken.has(`${stem} ${counter}${ext}`))
    counter += 1

  return `${stem} ${counter}${ext}`
}
