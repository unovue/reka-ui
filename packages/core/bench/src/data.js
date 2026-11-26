// Data for the fixtures. `items` is the fixture's collection size: a handful for the
// per-family census, 1,000 / 5,000 for the large-collection scenarios.
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'

// Labels start with a rotating letter, so one typeahead character always has a next match.
export function makeOpts(items) {
  return Array.from({ length: items }, (_, i) => ({ value: `v${i}`, label: `${LETTERS[i % 26]} option ${i}` }))
}

// Folders of ten (one folder + nine files), all expanded: `items` visible rows.
export function makeTree(items) {
  const roots = []
  for (let i = 0; i < items; i++) {
    const node = { title: `${LETTERS[i % 26]} node ${i}` }
    if (i % 10 === 0)
      roots.push({ ...node, children: [] })
    else
      roots.at(-1).children.push(node)
  }
  return roots
}
export const folderKeys = tree => tree.filter(n => n.children.length).map(n => n.title)
