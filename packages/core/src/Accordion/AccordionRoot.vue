<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import type { AcceptableValue, DataOrientation, Direction, SingleOrMultipleProps, SingleOrMultipleType } from '@/shared/types'
import { createRekaContext, useDirection, useForwardExpose } from '@/shared'

export interface AccordionRootProps<T = string | string[]>
  extends PrimitiveProps, SingleOrMultipleProps<T> {
  /**
   * When type is "single", allows closing content when clicking trigger for an open item.
   * When type is "multiple", this prop has no effect.
   *
   * @defaultValue false
   */
  collapsible?: boolean

  /**
   * When `true`, prevents the user from interacting with the accordion and all its items
   *
   * @defaultValue false
   */
  disabled?: boolean

  /**
   * The reading direction of the accordion when applicable. If omitted, assumes LTR (left-to-right) reading mode.
   *
   * @defaultValue "ltr"
   */
  dir?: Direction

  /**
   * The orientation of the accordion.
   *
   * @defaultValue "vertical"
   */
  orientation?: DataOrientation

  /**
   * When `true`, the element will be unmounted on closed state.
   *
   * @defaultValue `true`
   */
  unmountOnHide?: boolean
}

export type AccordionRootEmits<T extends SingleOrMultipleType = SingleOrMultipleType> = {
  /**
   * Event handler called when the expanded state of an item changes
   */
  'update:modelValue': [value: (T extends 'single' ? string : string[]) | undefined]
}

export type AccordionRootContext<P extends AccordionRootProps> = {
  disabled: Ref<P['disabled']>
  direction: Ref<P['dir']>
  orientation: P['orientation']
  parentElement: Ref<HTMLElement | undefined>
  changeModelValue: (value: string) => void
  isSingle: ComputedRef<boolean>
  modelValue: Ref<AcceptableValue | AcceptableValue[] | undefined>
  collapsible: boolean
  unmountOnHide: Ref<boolean>
}

export const [injectAccordionRootContext, provideAccordionRootContext]
  = createRekaContext<AccordionRootContext<AccordionRootProps>>('AccordionRoot')
</script>

<script setup lang="ts" generic="T extends (string | string[]), ExplicitType extends SingleOrMultipleType">
import { toRefs } from 'vue'
import { Primitive } from '@/Primitive'
import { useAgentRegistration } from '@/shared/useAgentRegistration'
import { useSingleOrMultipleValue } from '@/shared/useSingleOrMultipleValue'

const props = withDefaults(defineProps<AccordionRootProps<T>>(), {
  disabled: false,
  orientation: 'vertical',
  collapsible: false,
  unmountOnHide: true,
})

const emits = defineEmits<AccordionRootEmits<ExplicitType>>()

defineSlots<{
  default?: (props: {
    /** Current active value */
    modelValue: typeof modelValue.value
  }) => any
}>()

const { dir, disabled, unmountOnHide } = toRefs(props)
const direction = useDirection(dir)

const { modelValue, changeModelValue, isSingle } = useSingleOrMultipleValue(props, emits)

const { forwardRef, currentElement: parentElement } = useForwardExpose()

const agentContext = provideAccordionRootContext({
  disabled,
  direction,
  orientation: props.orientation,
  parentElement,
  isSingle,
  collapsible: props.collapsible,
  modelValue,
  changeModelValue,
  unmountOnHide,
})
useAgentRegistration('accordion', agentContext, props, parentElement)

// The default slot runs inside `Primitive`'s render, so a value read to build its props would
// re-render that element, and every item below it, on each change. Read through a getter, only a
// slot that uses `modelValue` pays for that.
const slotProps = {
  get modelValue() {
    return modelValue.value
  },
}
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as-child="asChild"
    :as="as"
  >
    <slot v-bind="slotProps" />
  </Primitive>
</template>
