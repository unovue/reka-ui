/**
 * Sentinel default for props that must stay `undefined` when the consumer does
 * not pass them.
 *
 * Vue resolves an absent `Boolean` prop to `false` unless the prop declares a
 * `default` (see `resolvePropValue`: the cast is skipped when
 * `hasOwn(opt, 'default')`). Components that distinguish "not set" from `false`
 * — controlled vs. uncontrolled `open`, `unmountOnHide` inherited from a root,
 * … — therefore have to declare an explicit `undefined` default.
 *
 * A literal `undefined` cannot be used there under `exactOptionalPropertyTypes`,
 * because Vue types the defaults object as `InferDefaults<T>`, whose values are
 * stripped of `undefined`. This sentinel is `undefined` at runtime and
 * assignable to any default type, so it keeps both the compiler and the Boolean
 * cast opt-out happy.
 *
 * ```ts
 * withDefaults(defineProps<CollapsibleRootProps>(), {
 *   open: UNDEFINED_DEFAULT,
 * })
 * ```
 */
export const UNDEFINED_DEFAULT = undefined as unknown as never
