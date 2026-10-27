import type { RekaElementFamily } from './meta'
import type { ResolvedElementOptions, ResolvedPart } from './RekaElement'
import { hyphenate } from './host'
import { getPartMeta, toPartDefinition } from './meta'
import { registeredPrefixes, RekaElement } from './RekaElement'

export interface DefineRekaElementsOptions {
  /**
   * Tag prefix: `<prefix>-<part>`, e.g. `acme` registers `<acme-dialog-root>`.
   * @defaultValue 'reka'
   */
  prefix?: string
  /**
   * Give every element a shadow root holding a single default `<slot>`. Children
   * stay in the light DOM (slotted), so styling, focus, ARIA id references and form
   * participation work the same as without it; the shadow root is a place for
   * encapsulated styles (`styles`) and `:host(...)` rules.
   * @defaultValue false
   */
  shadowRoot?: boolean | ShadowRootInit
  /** Stylesheets adopted by every element's shadow root. Requires `shadowRoot`. */
  styles?: CSSStyleSheet[]
}

const VALID_PREFIX = /^[a-z][\w.-]*$/

function resolveOptions(options: DefineRekaElementsOptions = {}): ResolvedElementOptions {
  const { prefix = 'reka', shadowRoot = false, styles = [] } = options
  if (!VALID_PREFIX.test(prefix))
    throw new Error(`[reka-ui] defineRekaElements: invalid tag prefix "${prefix}"`)
  return {
    prefix,
    shadowRoot: shadowRoot === true ? { mode: 'open' } : shadowRoot,
    styles,
  }
}

function createElementClass(part: ResolvedPart): typeof RekaElement {
  class RekaPartElement extends RekaElement {
    static override rekaPart = part
    static formAssociated = part.meta.formAssociated
  }
  for (const name of part.meta.properties) {
    Object.defineProperty(RekaPartElement.prototype, name, {
      configurable: true,
      enumerable: true,
      get(this: RekaElement) {
        return this._getProp(name)
      },
      set(this: RekaElement, value: unknown) {
        this._setProp(name, value)
      },
    })
  }
  return RekaPartElement
}

/**
 * Registers the custom elements of the given families. Registration is explicit
 * (importing `reka-ui/elements` defines nothing) and idempotent: a tag that is
 * already defined is skipped.
 *
 * @example
 * ```ts
 * import { defineRekaElements, dialogElements, switchElements } from 'reka-ui/elements'
 *
 * defineRekaElements([dialogElements, switchElements])
 * ```
 * @returns the tags of the given families, defined now or before.
 */
export function defineRekaElements(
  families: readonly RekaElementFamily[],
  options?: DefineRekaElementsOptions,
): string[] {
  if (typeof customElements === 'undefined')
    return []
  const resolved = resolveOptions(options)
  registeredPrefixes.add(resolved.prefix)

  const tags: string[] = []
  for (const family of families) {
    for (const [name, rawPart] of Object.entries(family.parts)) {
      const tag = `${resolved.prefix}-${hyphenate(name)}`
      tags.push(tag)
      const existing = customElements.get(tag)
      if (existing) {
        // eslint-disable-next-line node/prefer-global/process
        if (!(existing.prototype instanceof RekaElement) && process.env.NODE_ENV !== 'production')
          console.warn(`[reka-ui] <${tag}> is already defined by something else, skipping it.`)
        continue
      }
      const definition = toPartDefinition(rawPart)
      customElements.define(tag, createElementClass({
        name,
        tag,
        component: definition.component,
        meta: getPartMeta(definition),
        options: resolved,
      }))
    }
  }
  return tags
}
