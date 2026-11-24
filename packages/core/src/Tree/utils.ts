export function getDescendants<T>(item: T, getChildren: (item: T) => T[] | undefined): T[] {
  const descendants: T[] = []
  for (const child of getChildren(item) ?? []) {
    descendants.push(child, ...getDescendants(child, getChildren))
  }
  return descendants
}
