/**
 * Whether `disabled: false` can be dropped on this tag: a plain element without the property would
 * render `disabled="false"`. A custom element (its name has a `-`) may declare `disabled` with a
 * default of `true`, so it keeps `false`, like a component.
 */
export function isPlainTag(tag: unknown): tag is string {
  return typeof tag === 'string' && !tag.includes('-')
}

const nativeDisabledTags = new Set(['button', 'fieldset', 'input', 'optgroup', 'option', 'select', 'textarea'])

// Components and custom elements can implement their own disabled prop.
export function acceptsDisabled(tag: unknown): boolean {
  return !isPlainTag(tag) || nativeDisabledTags.has(tag.toLowerCase())
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
