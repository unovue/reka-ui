export type PartState = Record<string, string | number | boolean | null | undefined>

function kebab(key: string): string {
  return key.replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * Maps a headless composable's semantic `state` object to `data-*` attributes.
 * `true` → `data-<kebab>=""`; `false`/`null`/`undefined` → omitted; string/number
 * → `data-<kebab>="<value>"`. Semantics match `useRender`'s `getStateAttributes`
 * (#2722), so a part built on `useX()` can later pass `state` straight into
 * `useRender` and this helper is consolidated away.
 */
export function stateToDataAttrs(state: PartState): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key in state) {
    const value = state[key]
    if (value === false || value == null)
      continue
    out[`data-${kebab(key)}`] = value === true ? '' : String(value)
  }
  return out
}
