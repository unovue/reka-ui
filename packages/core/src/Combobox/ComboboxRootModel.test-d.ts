import type { ComboboxModelValue, ComboboxRootEmits, ComboboxRootProps } from './ComboboxRoot.vue'
import type { UseComboboxRootProps, UseComboboxRootReturn } from './useCombobox'
import { h, ref } from 'vue'
import ComboboxRoot from './ComboboxRoot.vue'
/**
 * Compile-time type tests for the `ComboboxRoot` value model, validated by
 * `vue-tsc` (see `shared/useEmitAsProps.test-d.ts`).
 *
 * `ComboboxCancel` (with `resetModelValueOnClear`) clears a single combobox to
 * `null`, so the emits carry `T | null`. The `modelValue` / `defaultValue`
 * props must accept that `null` back, or a `v-model` bound to the emitted
 * value does not type-check. Unlike Select (which never emits `null`, see
 * `Select/SelectRootEmits.test-d.ts`).
 */

type Expect<T extends true> = T
type Equal<A, B> = (<X>() => X extends A ? 1 : 2) extends (<X>() => X extends B ? 1 : 2) ? true : false
type Extends<A, B> = [A] extends [B] ? true : false

type UpdateValue<T, M extends boolean> = ComboboxRootEmits<T, M>['update:modelValue'][0]
type BeforeUpdateValue<T, M extends boolean> = ComboboxRootEmits<T, M>['beforeUpdate:modelValue'][0]
type ModelProp<T> = ComboboxRootProps<T>['modelValue']

export type Tests = [
  Expect<Equal<ComboboxModelValue<string, false>, string | null>>,
  Expect<Equal<ComboboxModelValue<string, true>, string[]>>,

  Expect<Equal<UpdateValue<string, false>, string | null>>,
  Expect<Equal<BeforeUpdateValue<string, false>, string | null>>,
  Expect<Equal<UpdateValue<string, true>, string[]>>,

  // What the root emits can be bound back as its model.
  Expect<Extends<UpdateValue<string, false>, ModelProp<string>>>,
  Expect<Extends<UpdateValue<{ id: number }, false>, ModelProp<{ id: number }>>>,
  Expect<Extends<UpdateValue<string, true>, ModelProp<string>>>,
  Expect<Extends<null, ComboboxRootProps<string>['defaultValue']>>,

  // The composable takes and returns the same `null`.
  Expect<Extends<null, UseComboboxRootProps<string>['defaultValue']>>,
  Expect<Extends<null, UseComboboxRootReturn<string>['modelValue']['value']>>,
  Expect<Extends<null, Parameters<UseComboboxRootReturn<string>['setModelValue']>[0]>>,
]

// A controlled single combobox over a non-null `T` round-trips its `null`.
export function controlledSingle() {
  const model = ref<string | null>('Apple')
  return h(ComboboxRoot<string>, {
    'modelValue': model.value,
    'onUpdate:modelValue': (value: string | null) => { model.value = value },
  })
}
