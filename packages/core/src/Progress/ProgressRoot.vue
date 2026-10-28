<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { ProgressState } from './useProgress'
import type { PrimitiveProps } from '@/Primitive'
import { createContext, useForwardElement } from '@/shared'

export type ProgressRootEmits = {
  /** Event handler called when an invalid `modelValue` is corrected to `null`. */
  'update:modelValue': [value: number | null]
  /** Event handler called when an invalid `max` is corrected to `100`. */
  'update:max': [value: number]
}

export interface ProgressRootProps extends PrimitiveProps {
  /** The progress value. Can be bind as `v-model`. */
  modelValue?: number | null
  /** The maximum progress value. */
  max?: number
  /**
   * A function to get the accessible label text in a human-readable format.
   *
   *  If not provided, the value label will be read as the numeric value as a percentage of the max value.
   */
  getValueLabel?: (value: number | null | undefined, max: number) => string | undefined
  /**
   * A function to get the accessible value text representing the current value in a human-readable format.
   */
  getValueText?: (value: number | null | undefined, max: number) => string | undefined
}

export interface ProgressRootContext {
  modelValue?: Readonly<Ref<ProgressRootProps['modelValue']>>
  max: Readonly<Ref<number>>
  progressState: ComputedRef<ProgressState>
}

export const [injectProgressRootContext, provideProgressRootContext]
  = createContext<ProgressRootContext>('ProgressRoot')

export type { ProgressState }
</script>

<script setup lang="ts">
import { nextTick, watch } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { DEFAULT_MAX, useProgress } from './useProgress'

const props = withDefaults(defineProps<ProgressRootProps>(), {
  max: DEFAULT_MAX,
})

const emit = defineEmits<ProgressRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current input values */
    modelValue: typeof modelValue.value
  }) => any
}>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

const { value: modelValue, max, root, context } = useProgress({
  modelValue: () => props.modelValue,
  max: () => props.max,
  // Getters: `useProgress` falls back to its default label when the prop is unset.
  get getValueLabel() { return props.getValueLabel },
  get getValueText() { return props.getValueText },
})

// Progress has no model (the value is display-only). An invalid prop renders
// corrected straight away; the parent is told once so a `v-model` follows.
// The value is validated against the corrected `max`, so a `max` that drops
// below the value also reports `null`.
watch(
  () => [props.modelValue, props.max] as const,
  async ([value]) => {
    if (modelValue.value !== value) {
      await nextTick()
      emit('update:modelValue', null)
    }
  },
  { immediate: true },
)
watch(
  () => props.max,
  (value) => {
    if (max.value !== value)
      emit('update:max', max.value)
  },
  { immediate: true },
)

provideProgressRootContext(context)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="root.attrs.value"
  >
    <slot
      :model-value="modelValue"
    />
  </component>
</template>
