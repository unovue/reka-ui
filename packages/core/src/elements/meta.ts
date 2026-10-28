import type { Component } from 'vue'
import type { HostSemantics } from './host'
import { toEventType } from './events'
import { hyphenate, semanticsForTag } from './host'

/**
 * How an attribute is turned into a prop value.
 *
 * - `boolean`: like an HTML boolean attribute, present → `true` whatever its value,
 *   absent → not set (the prop's default). The one exception is a prop that
 *   defaults to `true` (`modal`, `loop`, …): `"false"` turns it off, since an absent
 *   attribute cannot. Native attribute names (`disabled`, `open`, `required`, …)
 *   never take that exception.
 * - `booleanish`: a value, not a flag: `""` / `"true"` / the attribute's own name →
 *   `true`, `"false"` → `false`, any other string passes through
 *   (`model-value="indeterminate"` on a checkbox).
 * - `number`: `Number(value)`.
 * - `string`: the attribute value.
 * - `property`: no attribute; the prop is only settable as a DOM property
 *   (objects, arrays, functions, elements).
 */
export type AttributeKind = 'boolean' | 'booleanish' | 'number' | 'string' | 'property'

export interface RekaElementPartDefinition {
  component: Component
  /** Per-prop overrides of the kind inferred from the component's runtime prop types. */
  attributes?: Record<string, AttributeKind>
  /**
   * Native semantics of the element the part renders by default, when it cannot be
   * read from the component's `as` default (a part that delegates to another one).
   */
  semantics?: string | HostSemantics
  /**
   * The part renders elements next to itself that must be in the document, instead
   * of staying detached (hidden form fields excepted):
   * - `'after'` (or `true`): right after the element while rendered (a focus proxy);
   * - `'inside'`: appended inside the element (`StepperRoot`'s live region).
   */
  siblings?: boolean | 'after' | 'inside'
  /**
   * Props the element always passes, and does not expose as attributes or
   * properties: settings that only make sense for a native element the host can
   * never be (`FieldLabel`'s `nativeLabel`).
   */
  fixedProps?: Record<string, unknown>
  /**
   * Emits the part only gets a listener for while the element has a DOM listener
   * for their event: parts that behave differently when someone listens
   * (`FormRoot` prevents the native submission when `formSubmit` is listened to).
   */
  listenedEmits?: string[]
  /**
   * `'input'`: the part renders onto the element's `<input>` (or `<textarea>`)
   * child instead of onto the element, which is created when there is none. A
   * custom element cannot be a text field, so a part that renders an `<input>` in
   * Vue (`ComboboxInput`, `TagsInputInput`, …) works like `asChild` over one.
   */
  target?: 'input'
  /**
   * The part's fallback slot content (`SelectValue`'s selected label), shown as the
   * element's text while it has no children of its own. Called during the part's
   * render with the slot props and the element's props, so it can `inject()` the
   * part's context.
   */
  text?: (slotProps: Record<string, any>, props: Record<string, any>) => unknown
}

export interface RekaElementFamily {
  /** kebab-case family name, e.g. `dialog`. */
  readonly name: string
  /** Parts keyed by their component name; the tag is `<prefix>-<kebab-case name>`. */
  readonly parts: Readonly<Record<string, Component | RekaElementPartDefinition>>
}

export interface PropMeta {
  name: string
  attribute: string | null
  kind: AttributeKind
  /** A `boolean` prop that defaults to `true`: its attribute accepts `"false"`. */
  defaultTrue?: boolean
}

export interface PartMeta {
  props: PropMeta[]
  /** Every runtime prop name of the component, including `as` / `asChild`. */
  propNames: Set<string>
  byAttribute: Map<string, PropMeta>
  observedAttributes: string[]
  /** Props exposed as element properties (all but the ones `HTMLElement` already defines). */
  properties: string[]
  emits: string[]
  hasAsChild: boolean
  semantics: HostSemantics | undefined
  /** See {@link RekaElementPartDefinition.siblings}: `true` is `'after'`. */
  siblings: false | 'after' | 'inside'
  /**
   * Parts with a `name` are form-associated: they submit through `ElementInternals`,
   * and `<label for>`, `<fieldset disabled>` and form reset reach them.
   */
  formAssociated: boolean
  /** The part renders onto an `<input>` child: see {@link RekaElementPartDefinition.target}. */
  inputTarget: boolean
  text: RekaElementPartDefinition['text']
  fixedProps: Record<string, unknown>
  /** Event types (`form-submit`) of the emits only listened to while the element has a listener. */
  listenedEvents: Set<string>
}

/** Props the element API does not expose: the host is always the rendered element. */
const HIDDEN_PROPS = new Set(['as', 'asChild'])

/** HTML boolean attribute names: presence means `true`, whatever the value. */
export const NATIVE_BOOLEAN_ATTRIBUTES = new Set([
  'autofocus',
  'checked',
  'disabled',
  'hidden',
  'inert',
  'multiple',
  'open',
  'readonly',
  'required',
  'selected',
])

type PropType = ((...args: any[]) => unknown) | null | undefined

function propTypes(option: unknown): PropType[] {
  if (option === null || typeof option !== 'object') {
    // `props: { foo: String }` or `props: { foo: null }`
    return [option as PropType]
  }
  const type = (option as { type?: unknown }).type
  return Array.isArray(type) ? type : [type as PropType]
}

function inferKind(types: PropType[]): AttributeKind {
  if (types.includes(Boolean))
    return 'boolean'
  if (types.includes(String))
    return 'string'
  if (types.includes(Number))
    return 'number'
  // Untyped (generic) props: the attribute value is passed as a string.
  if (types.some(type => type == null))
    return 'string'
  return 'property'
}

function isPartDefinition(part: Component | RekaElementPartDefinition): part is RekaElementPartDefinition {
  return typeof part === 'object' && part !== null && 'component' in part
}

export function toPartDefinition(part: Component | RekaElementPartDefinition): RekaElementPartDefinition {
  return isPartDefinition(part) ? part : { component: part }
}

export function getPartMeta(definition: RekaElementPartDefinition): PartMeta {
  const component = definition.component as {
    props?: Record<string, unknown> | string[]
    emits?: Record<string, unknown> | string[]
  }
  const rawProps = component.props ?? {}
  const propOptions: Record<string, unknown> = Array.isArray(rawProps)
    ? Object.fromEntries(rawProps.map(name => [name, null]))
    : rawProps

  const props: PropMeta[] = []
  const fixedProps = definition.fixedProps ?? {}
  for (const [name, option] of Object.entries(propOptions)) {
    if (HIDDEN_PROPS.has(name) || name in fixedProps)
      continue
    const kind = definition.attributes?.[name] ?? inferKind(propTypes(option))
    const attribute = kind === 'property' ? null : hyphenate(name)
    const defaultTrue = kind === 'boolean'
      && (option as { default?: unknown } | null)?.default === true
      && !NATIVE_BOOLEAN_ATTRIBUTES.has(attribute!)
    props.push({ name, kind, attribute, ...(defaultTrue ? { defaultTrue } : undefined) })
  }

  const asOption = propOptions.as as { default?: unknown } | undefined
  const semantics = typeof definition.semantics === 'string'
    ? semanticsForTag(definition.semantics)
    : definition.semantics ?? semanticsForTag(asOption?.default)

  const rawEmits = component.emits ?? []
  const emits = Array.isArray(rawEmits) ? rawEmits : Object.keys(rawEmits)
  const byAttribute = new Map(props.filter(prop => prop.attribute).map(prop => [prop.attribute!, prop]))

  return {
    props,
    propNames: new Set(Object.keys(propOptions)),
    byAttribute,
    observedAttributes: [...byAttribute.keys()],
    properties: props
      .map(prop => prop.name)
      .filter(name => typeof HTMLElement === 'undefined' || !(name in HTMLElement.prototype)),
    emits,
    hasAsChild: 'asChild' in propOptions,
    semantics,
    formAssociated: 'name' in propOptions,
    siblings: definition.siblings === true ? 'after' : definition.siblings || false,
    fixedProps,
    listenedEvents: new Set((definition.listenedEmits ?? []).map(toEventType)),
    inputTarget: definition.target === 'input',
    text: definition.text,
  }
}

export function parseAttribute(prop: Pick<PropMeta, 'kind' | 'attribute' | 'defaultTrue'>, value: string | null): unknown {
  if (value === null)
    return undefined
  switch (prop.kind) {
    case 'boolean':
      return !(prop.defaultTrue && value === 'false')
    case 'booleanish':
      if (value === 'false')
        return false
      return value === '' || value === 'true' || value === prop.attribute ? true : value
    case 'number': {
      const number = Number(value)
      return Number.isNaN(number) ? undefined : number
    }
    default:
      return value
  }
}
