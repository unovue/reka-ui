<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import type { AcceptableValue } from '@/shared/types'
import { useCollection } from '@/Collection'
import { createContext, useForwardElement, useId } from '@/shared'

export interface SelectItemContext<T = AcceptableValue> {
  /** The item's value (read live from the prop). */
  readonly value: T
  textId: string
  disabled: Ref<boolean>
  isSelected: Ref<boolean> | ComputedRef<boolean>
  onItemTextChange: (node: HTMLElement | undefined) => void
}

export const [injectSelectItemContext, provideSelectItemContext]
  = createContext<SelectItemContext>('SelectItem')

export type SelectEvent<T> = CustomEvent<{ originalEvent: PointerEvent | KeyboardEvent, value?: T }>

export type SelectItemEmits<T = AcceptableValue> = {
  /** Event handler called when the selecting item. <br> It can be prevented by calling `event.preventDefault`. */
  select: [event: SelectEvent<T>]
}

export interface SelectItemProps<T = AcceptableValue> extends PrimitiveProps {
  /** The value given as data when submitted with a `name`. */
  value: T
  /** When `true`, prevents the user from interacting with the item. */
  disabled?: boolean
  /**
   * Optional text used for typeahead purposes.
   *
   * By default the typeahead behavior will use the `.textContent` of the `SelectItemText` part.
   *
   * Use this when the content is complex, or you have non-textual content inside.
   */
  textValue?: string
}
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue">
import { onMounted } from 'vue'
import { Primitive } from '@/Primitive'
import { injectSelectContentContext } from './SelectContentImpl.vue'
import { injectSelectRootContext } from './SelectRoot.vue'
import { useSelectItem } from './useSelect'

const props = defineProps<SelectItemProps>()

const emits = defineEmits<SelectItemEmits<T>>()
defineSlots<{
  default?: (props: {
    /** Whether the item is currently selected */
    selected: boolean
  }) => any
}>()

const rootContext = injectSelectRootContext()
const contentContext = injectSelectContentContext()
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const { CollectionItem } = useCollection()

if (props.value === '') {
  throw new Error(
    'A <SelectItem /> must have a value prop that is not an empty string. This is because the Select value can be set to an empty string to clear the selection and show the placeholder.',
  )
}

const { item, isSelected, textValue, itemContext } = useSelectItem({
  context: rootContext,
  contentContext,
  value: () => props.value,
  disabled: () => props.disabled,
  textValue: props.textValue,
  textId: useId(undefined, 'reka-select-item-text'),
  onSelect: event => emits('select', event as SelectEvent<T>),
})

onMounted(() => {
  if (!currentElement.value)
    return
  contentContext.itemRefCallback(
    currentElement.value,
    props.value,
    props.disabled,
  )
})

provideSelectItemContext(itemContext)
</script>

<template>
  <CollectionItem :value="{ textValue, value }">
    <Primitive
      :ref="forwardRef"
      v-bind="item.attrs.value"
      :as="as"
      :as-child="asChild"
    >
      <slot :selected="isSelected" />
    </Primitive>
  </CollectionItem>
</template>
