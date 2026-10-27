import type { SelectRootEmits } from './SelectRoot.vue'
import type { SelectModelValue } from './useSelect'
/**
 * Compile-time type tests for the `SelectRoot` value emits, validated by
 * `vue-tsc` (see `shared/useEmitAsProps.test-d.ts`).
 *
 * No interaction clears a single select, so its `update:modelValue` carries
 * `T` (as in v2), never `null`: a v2 handler `(value: string) => …` still
 * type-checks. A `multiple` select carries `T[]`.
 */

type Expect<T extends true> = T
type Equal<A, B> = (<X>() => X extends A ? 1 : 2) extends (<X>() => X extends B ? 1 : 2) ? true : false

type UpdateValue<T, M extends boolean> = SelectRootEmits<T, M>['update:modelValue'][0]
type BeforeUpdateValue<T, M extends boolean> = SelectRootEmits<T, M>['beforeUpdate:modelValue'][0]

export type Tests = [
  Expect<Equal<SelectModelValue<string, false>, string>>,
  Expect<Equal<SelectModelValue<string, true>, string[]>>,
  Expect<Equal<SelectModelValue<string, boolean>, string | string[]>>,

  Expect<Equal<UpdateValue<string, false>, string>>,
  Expect<Equal<UpdateValue<{ id: number }, false>, { id: number }>>,
  Expect<Equal<UpdateValue<string, true>, string[]>>,
  Expect<Equal<BeforeUpdateValue<string, false>, string>>,
  Expect<Equal<BeforeUpdateValue<string, true>, string[]>>,
]
