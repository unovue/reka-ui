<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import type { AcceptableValue } from '@/shared/types'
import { useCollectionItem } from '@/Collection'
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

const DISABLED_ATTRS = Object.freeze({ 'data-disabled': '' })

export type SelectEvent<T> = CustomEvent<{ originalEvent: PointerEvent | KeyboardEvent, value?: T }>

export type SelectItemEmits<T = AcceptableValue> = {
  /** Event handler called when the selecting item. <br> It can be prevented by calling `event.preventDefault`. */
  select: [event: SelectEvent<T>]
}

export interface SelectItemProps<T = AcceptableValue> extends PrimitiveProps {
  /**
   * The value given as data when submitted with a `name`. In a single select, `null` is the empty value, so pressing an
   * item with a `null` value clears the selection, and an empty string is allowed but a selected `''`
   * still shows the placeholder. In a `multiple` select, `null` and `''` are ordinary values that toggle in the array.
   */
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
import { mergeProps, onMounted } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { injectSelectContentContext } from './SelectContentImpl.vue'
import { injectSelectRootContext } from './SelectRoot.vue'
import { useSelectItem, useSelectItemLabel } from './useSelect'

defineOptions({
  // `$attrs` are merged under the item's own bindings: the precedence the
  // former `CollectionItem` wrapper gave them.
  inheritAttrs: false,
})

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

// A closed content's detached item only keeps its value, text and `disabled` live:
// it renders lean (see `SelectClosedItems`).
const lean = contentContext.harvest
  ? useSelectItemLabel({
      context: rootContext,
      value: () => props.value,
      disabled: () => props.disabled,
      textValue: () => props.textValue,
      element: () => currentElement.value,
    })
  : undefined
const full = lean
  ? undefined
  : useSelectItem({
      context: rootContext,
      contentContext,
      value: () => props.value,
      disabled: () => props.disabled,
      textValue: props.textValue,
      textId: useId(undefined, 'reka-select-item-text'),
      onSelect: event => emits('select', event as SelectEvent<T>),
    })
const { isSelected, textValue, itemContext } = (lean ?? full)!
const item = full?.item

// The detached item's attributes: the `data-disabled` the typeahead reads.
function getLeanAttrs() {
  return props.disabled ? DISABLED_ATTRS : undefined
}

if (!lean) {
  // Registered with the content's collection from setup; no wrapper component.
  useCollectionItem(currentElement, () => ({ textValue: textValue.value, value: props.value }))
  onMounted(() => {
    if (!currentElement.value)
      return
    contentContext.itemRefCallback(
      currentElement.value,
      props.value,
      props.disabled,
    )
  })
}

provideSelectItemContext(itemContext)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    data-reka-collection-item=""
    v-bind="item ? mergeProps($attrs, item.attrs.value) : getLeanAttrs()"
  >
    <slot :selected="isSelected" />
  </component>
</template>
