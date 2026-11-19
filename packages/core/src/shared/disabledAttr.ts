/**
 * The value to bind as `disabled` on a `Primitive`. A plain tag without a `disabled` property
 * (`a`, `div`, `span`) would otherwise render `disabled="false"` while enabled, so `false` becomes
 * `undefined` there. A component given as `as` gets the boolean unchanged, so its own `disabled`
 * default doesn't apply. With `asChild` the element is unknown here, and `Slot` drops the `false`
 * once it sees a plain tag.
 */
export function disabledAttr(disabled: boolean | undefined, as: unknown, asChild?: boolean): boolean | undefined {
  return typeof as === 'string' && !asChild ? disabled || undefined : disabled
}
