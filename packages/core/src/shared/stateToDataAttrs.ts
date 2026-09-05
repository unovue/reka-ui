/** Semantic state of a rendered part; each key becomes a `data-<kebab>` attribute. */
export type PartState = Record<string, string | number | boolean | null | undefined>

/**
 * Per-key override of the default state → `data-*` mapping. A mapped key's
 * returned record is merged in as-is (its own attribute names, `undefined`
 * values dropped by the renderer); returning `undefined` emits nothing.
 */
export type StateAttributesMapping<S extends PartState>
  = { [K in keyof S]?: (value: S[K]) => Record<string, string | undefined> | undefined }

function kebab(key: string): string {
  return key.replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * Maps a part's semantic `state` object to `data-*` attributes — the single
 * implementation behind `useRender` (#2722) and `PartSurface.attrs` (#2723).
 * `true` → `data-<kebab>=""`; `false`/`null`/`undefined` → omitted; string/number
 * → `data-<kebab>="<value>"`; a `mapping` entry replaces the default for its key.
 *
 * @internal — consumers bind `surface.attrs` / `renderProps` and never see this.
 */
export function stateToDataAttrs<S extends PartState>(
  state: S | undefined,
  mapping?: StateAttributesMapping<S>,
): Record<string, string> {
  const out: Record<string, string> = {}
  if (!state)
    return out
  for (const key in state) {
    const value = state[key]
    if (mapping?.[key]) {
      Object.assign(out, mapping[key]!(value) ?? {})
      continue
    }
    if (value === false || value == null)
      continue
    out[`data-${kebab(key)}`] = value === true ? '' : String(value)
  }
  return out
}
