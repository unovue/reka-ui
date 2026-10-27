import type { ListboxModelValue, ListboxRootEmits } from './ListboxRoot.vue'
import type { AcceptableValue } from '@/shared/types'
/**
 * Compile-time type tests for the `ListboxRoot` value emits (#2824 item 4),
 * validated by `vue-tsc` (see `shared/useEmitAsProps.test-d.ts`).
 *
 * A `multiple` listbox carries `T[]`; a single one carries `T`, or `undefined`
 * once pressing the selected item clears it. A plain `boolean` `multiple`
 * keeps the union.
 */

type Expect<T extends true> = T
type Equal<A, B> = (<X>() => X extends A ? 1 : 2) extends (<X>() => X extends B ? 1 : 2) ? true : false

type UpdateValue<T, M extends boolean> = ListboxRootEmits<T, M>['update:modelValue'][0]
type BeforeUpdateValue<T, M extends boolean> = ListboxRootEmits<T, M>['beforeUpdate:modelValue'][0]

export type Tests = [
  Expect<Equal<ListboxModelValue<string, false>, string | undefined>>,
  Expect<Equal<ListboxModelValue<string, true>, string[]>>,
  Expect<Equal<ListboxModelValue<string, boolean>, string | string[] | undefined>>,

  Expect<Equal<UpdateValue<string, false>, string | undefined>>,
  Expect<Equal<UpdateValue<{ id: number }, true>, { id: number }[]>>,
  Expect<Equal<UpdateValue<string, true>, string[]>>,
  Expect<Equal<BeforeUpdateValue<string, false>, string | undefined>>,
  Expect<Equal<BeforeUpdateValue<string, true>, string[]>>,
  // The default (`M` unset) is the v2 union, so existing `ListboxRootEmits` annotations keep compiling.
  Expect<Equal<ListboxRootEmits['update:modelValue'][0], AcceptableValue | AcceptableValue[] | undefined>>,
]
