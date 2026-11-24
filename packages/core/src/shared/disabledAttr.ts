/**
 * Whether `disabled: false` can be dropped on this tag: a plain element without the property would
 * render `disabled="false"`. A custom element (its name has a `-`) may declare `disabled` with a
 * default of `true`, so it keeps `false`, like a component.
 */
export function isPlainTag(tag: unknown): tag is string {
  return typeof tag === 'string' && !tag.includes('-')
}

/**
 * The value to bind as `disabled` on a `Primitive`. For a plain tag `false` becomes `undefined`, so an
 * enabled part doesn't render `disabled="false"`. A component or custom element gets the boolean
 * unchanged, so its own `disabled` default doesn't apply. With `asChild` or `as="template"` the element
 * is unknown here, and `Slot` drops the `false` once it sees a plain tag.
 */
export function disabledAttr(disabled: boolean | undefined, as: unknown, asChild?: boolean): boolean | undefined {
  return !asChild && as !== 'template' && isPlainTag(as) ? disabled || undefined : disabled
}

// Elements the native `disabled` attribute works on
const NATIVE_DISABLED_TAGS = ['button', 'input', 'select', 'textarea', 'fieldset', 'option', 'optgroup']

/**
 * The `aria-disabled` to add to an element rendered with the native `disabled` attribute. Only form
 * controls support `disabled`, so on any other plain tag (`div`, `span`, `a`, …) the disabled state is
 * only exposed with `aria-disabled="true"`. Returns `undefined` when the element isn't disabled, is a
 * native control, a component or a custom element, or already has an `aria-disabled` (pass `null` to
 * opt out). `Primitive` and `Slot` call it with the element they render.
 */
export function ariaDisabledAttr(tag: unknown, props: Record<string, any>): 'true' | undefined {
  const disabled = props.disabled
  return disabled != null && disabled !== false && props['aria-disabled'] === undefined && props.ariaDisabled === undefined
    && isPlainTag(tag) && tag !== 'template' && !NATIVE_DISABLED_TAGS.includes(tag)
    ? 'true'
    : undefined
}
