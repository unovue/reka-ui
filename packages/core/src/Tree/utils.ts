/**
 * Every item and its descendants, depth-first. Children are read through
 * `getChildren` (the `TreeRoot` prop), so a custom children schema is followed
 * at every level, not only the first. Defaults to `item.children`.
 */
export function flatten<T>(
  items: readonly T[],
  getChildren: (item: T) => readonly T[] | undefined = item => (item as { children?: T[] }).children,
): T[] {
  return items.reduce((acc: T[], item: T) => {
    acc.push(item)

    const children = getChildren(item)
    if (children)
      acc.push(...flatten(children, getChildren))

    return acc
  }, [])
}
