export function flatten<U, T extends { children: any[] }>(items: T[]): U[] {
  return items.reduce((acc: any[], item: T) => {
    acc.push(item)

    if (item.children)
      acc.push(...flatten(item.children))

    return acc
  }, [])
}

export type FlattenedItem<T> = {
  _id: string
  index: number
  value: T
  level: number
  hasChildren: boolean
  parentItem?: T
  bind: {
    value: T
    level: number
    [key: string]: any
  }
}

export function flattenItems<T>(
  items: T[],
  ctx: {
    getKey: (item: T) => string
    getChildren: (item: T) => T[] | undefined
    expanded: string[]
  },
): FlattenedItem<T>[] {
  const expandedSet = new Set(ctx.expanded)
  const flatNoFilter = (items: T[], level: number, parentItem?: T) =>
    items.reduce((acc: FlattenedItem<T>[], item: T, index: number) => {
      const key = ctx.getKey(item)
      const children = ctx.getChildren(item)

      const flattenedItem: FlattenedItem<T> = {
        _id: key,
        value: item,
        index,
        level,
        parentItem,
        hasChildren: !!children,
        bind: {
          value: item,
          level,
          'aria-setsize': items.length,
          'aria-posinset': index + 1,
        },
      }
      acc.push(flattenedItem)

      if (children && expandedSet.has(key))
        acc.push(...flatNoFilter(children, level + 1, item))

      return acc
    }, [])

  return flatNoFilter(items, 1)
}

export function flattenFilter<T>(
  items: T[],
  ctx: {
    getKey: (item: T) => string
    getChildren: (item: T) => T[] | undefined
    predicate: (item: T) => boolean
    forceVisible: string[]
  },
): {
  result: FlattenedItem<T>[]
  expanded: string[]
} {
  const expanded: string[] = []
  const forceVisibleSet = new Set(ctx.forceVisible)

  const flatFilter = (
    itms: T[] | undefined,
    force: boolean,
    level: number,
    parentItem?: T,
  ) =>
    itms
      ? itms.reduce((acc: FlattenedItem<T>[], item: T, index: number) => {
        const iMatch = force || ctx.predicate(item)
        const key = ctx.getKey(item)
        const children = ctx.getChildren(item)
        //console.log('iMatch', iMatch, iKey, force)

        const cCnt = children ? children.length : 0

        const flattenedItem: FlattenedItem<T> = {
          _id: key,
          value: item,
          index,
          level,
          parentItem,
          hasChildren: cCnt > 0,
          bind: {
            value: item,
            level,
            'aria-setsize': items.length,
            'aria-posinset': index + 1,
          },
        }

        if (cCnt === 0) {
          if (iMatch) acc.push(flattenedItem)
          return acc
        }
        // check if children match, then add parent and add to expanded
        const cres = flatFilter(
          children,
          forceVisibleSet.has(key),
          level + 1,
          item,
        )
        if (cres.length > 0) {
          acc.push(flattenedItem)
          expanded.push(key)
          acc.push(...cres)
        } else if (iMatch) {
          acc.push(flattenedItem)
        }

        //console.log('return from flatFilter', acc)
        return acc
      }, [])
      : []
  const result = flatFilter(items, true, 1, undefined)
  return { result, expanded }
}
