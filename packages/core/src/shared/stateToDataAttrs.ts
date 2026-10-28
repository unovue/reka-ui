import { mergeProps } from 'vue'

/** Semantic state of a rendered part; each key becomes a `data-<kebab>` attribute. */
export type PartState = Record<string, string | number | boolean | null | undefined>

/**
 * Per-key override of the default state → `data-*` mapping. A mapped key's
 * returned record is merged in as-is (its own attribute names, `undefined`
 * values dropped by the renderer); returning `undefined` emits nothing.
 */
export type StateAttributesMapping<S extends PartState>
  = { [K in keyof S]?: (value: S[K]) => Record<string, string | undefined> | undefined }

/**
 * State key → `data-*` attribute name. The state vocabulary is a small fixed
 * set of keys, so each is kebab-cased once per page instead of by a regex on
 * every render of every part.
 */
const attrNames = new Map<string, string>()

function attrName(key: string): string {
  let name = attrNames.get(key)
  if (name === undefined) {
    name = `data-${key.replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase()}`
    attrNames.set(key, name)
  }
  return name
}

/** Keys Vue's `mergeProps` treats specially: `class`/`style` are normalised, `on*` listeners chained, `''` dropped. */
function isSpecialKey(key: string): boolean {
  return key === 'class' || key === 'style' || key === ''
    || (key.charCodeAt(0) === 111 /* o */ && key.charCodeAt(1) === 110 /* n */)
}

/**
 * Writes `state` into `out` as `data-*` attributes (see `stateToDataAttrs`).
 * Returns whether a `mapping` entry wrote a key `mergeProps` treats specially,
 * so a merge with props must go through it.
 */
function writeStateAttrs<S extends PartState>(
  out: Record<string, any>,
  state: S,
  mapping: StateAttributesMapping<S> | undefined,
): boolean {
  let special = false
  for (const key in state) {
    const value = state[key]
    const map = mapping?.[key]
    if (map) {
      const mapped = map(value)
      if (mapped) {
        for (const name in mapped) {
          out[name] = mapped[name]
          if (!special && isSpecialKey(name))
            special = true
        }
      }
      continue
    }
    if (value === false || value == null)
      continue
    out[attrName(key)] = value === true ? '' : String(value)
  }
  return special
}

/**
 * Whether merging `props` over plain `data-*` attributes needs Vue's
 * `mergeProps`: it normalises `class`/`style`, and drops falsy listeners and
 * the `''` key. Anything else is a plain assignment.
 */
function propsNeedMerge(props: Record<string, any>): boolean {
  for (const key in props) {
    if (key === 'class' || key === 'style' || key === '' || (!props[key] && isSpecialKey(key)))
      return true
  }
  return false
}

/**
 * `mergeProps(stateToDataAttrs(state, mapping), props)` in one allocation: the
 * `data-*` attributes first, then `props` assigned over them (explicit props
 * win, as with `mergeProps`). Hands off to Vue's `mergeProps` only when either
 * side holds a key it normalises.
 *
 * @internal
 */
export function mergeStateAttrs<S extends PartState>(
  state: S | undefined,
  mapping: StateAttributesMapping<S> | undefined,
  props: Record<string, any> | null | undefined,
): Record<string, any> {
  const out: Record<string, any> = {}
  const special = state ? writeStateAttrs(out, state, mapping) : false
  if (!props)
    return out
  if (special || propsNeedMerge(props))
    return mergeProps(out, props)
  for (const key in props)
    out[key] = props[key]
  return out
}

/**
 * Maps a part's semantic `state` object to `data-*` attributes — the single
 * implementation behind `useRender` (#2722) and `PartSurface.attrs` (#2723).
 * `true` → `data-<kebab>=""`; `false`/`null`/`undefined` → omitted; string/number
 * → `data-<kebab>="<value>"`; a `mapping` entry replaces the default for its key.
 *
 * @internal
 */
export function stateToDataAttrs<S extends PartState>(
  state: S | undefined,
  mapping?: StateAttributesMapping<S>,
): Record<string, string> {
  const out: Record<string, string> = {}
  if (state)
    writeStateAttrs(out, state, mapping)
  return out
}
