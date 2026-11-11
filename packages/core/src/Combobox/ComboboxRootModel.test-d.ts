import type { ComboboxModelValue, ComboboxRootEmits, ComboboxRootProps } from './ComboboxRoot.vue'
import type { UseComboboxRootProps, UseComboboxRootReturn } from './useCombobox'
import { h, ref } from 'vue'
import { createComboboxItems } from './comboboxItems'
import ComboboxRoot from './ComboboxRoot.vue'
/**
 * Compile-time type tests for the `ComboboxRoot` value model, validated by
 * `vue-tsc` (see `shared/useEmitAsProps.test-d.ts`).
 *
 * `ComboboxCancel` (unless `resetModelValueOnClear` is `false`) clears a single combobox to
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

interface User { id: number, name: string }
declare const users: User[]

// A collection carries the type of its derived values: the model is the id.
export function collectionItems() {
  const items = createComboboxItems(users, { getValue: user => user.id, getLabel: user => user.name })
  const grouped = createComboboxItems([{ label: 'Staff', items: users }], { getValue: (user: User) => user.id, getLabel: user => user.name })
  return [
    h(ComboboxRoot<number, false, User>, { items, 'modelValue': 1, 'onUpdate:modelValue': (_value: number | null) => {} }),
    h(ComboboxRoot<number, true, User>, { items: grouped, multiple: true, modelValue: [1] }),
    // @ts-expect-error the collection's values are numbers, not strings
    h(ComboboxRoot<string, false, User>, { items }),
    // @ts-expect-error a boolean is not a value the root or an item can hold
    createComboboxItems(users, { getValue: user => user.id > 1, getLabel: user => user.name }),
    createComboboxItems(users, { getValue: user => BigInt(user.id), getLabel: user => user.name }),
  ]
}

// An array of items, or of groups of them, of any shape: the item type is free of the value type.
export function arrayItems() {
  return [
    h(ComboboxRoot<User, false, User>, { items: users, by: 'id' }),
    h(ComboboxRoot<User, false, User>, { items: [{ label: 'Staff', items: users }] as const }),
    h(ComboboxRoot<string, false, { value: string, label: string }>, { items: [{ value: 'a', label: 'Apple' }], modelValue: 'a' }),
    h(ComboboxRoot<string>, { items: ['a', 'b'] }),
    // @ts-expect-error a record of value to label is not a shape of `items`
    h(ComboboxRoot<string>, { items: { a: 'Apple' } }),
  ]
}
