<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import type { AcceptableValue } from '@/shared/types'
import { valueComparator } from './utils'

export interface SelectValueProps extends PrimitiveProps {
  /** The content that will be rendered inside the `SelectValue` when no `value` or `defaultValue` is set. */
  placeholder?: string
}
</script>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Primitive } from '@/Primitive'
import { isNullish, useForwardExpose } from '@/shared'
import { injectSelectRootContext } from './SelectRoot.vue'

const props = withDefaults(defineProps<SelectValueProps>(), {
  as: 'span',
  placeholder: '',
})

const { forwardRef, currentElement } = useForwardExpose()

const rootContext = injectSelectRootContext()

onMounted(() => {
  rootContext.valueElement = currentElement
})

const selectedLabel = computed(() => {
  let list: string[] = []
  const options = Array.from(rootContext.optionsSet.value)
  const getOption = (value?: AcceptableValue) => options.find(option => valueComparator(value, option.value, rootContext.by))
  if (Array.isArray(rootContext.modelValue.value)) {
    list = rootContext.modelValue.value.map(value => getOption(value)?.textContent ?? '')
  }
  else {
    list = [getOption(rootContext.modelValue.value)?.textContent ?? '']
  }
  return list.filter(Boolean)
})

// Cache the selected label to prevent placeholder flash during close transition
// when optionsSet is transiently empty during the Presence-to-DocumentFragment handoff
// @see https://github.com/unovue/reka-ui/issues/2767
const cachedSelectedLabel = ref<string[]>([])
watch(selectedLabel, (newVal) => {
  if (newVal.length > 0) {
    cachedSelectedLabel.value = newVal
  }
}, { immediate: true })

const displayLabel = computed(() => {
  // Use cached label if current is empty but we still have a modelValue
  // (this prevents the one-frame placeholder flash during transition)
  if (selectedLabel.value.length > 0) {
    return selectedLabel.value
  }
  const hasValue = Array.isArray(rootContext.modelValue.value)
    ? rootContext.modelValue.value.length > 0
    : !isNullish(rootContext.modelValue.value)
  return hasValue ? cachedSelectedLabel.value : []
})

const slotText = computed(() => {
  return displayLabel.value.length ? displayLabel.value.join(', ') : props.placeholder
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    :style="{ pointerEvents: 'none' }"
    :data-placeholder="displayLabel.length ? undefined : props.placeholder"
  >
    <slot
      :selected-label="displayLabel"
      :model-value="rootContext.modelValue.value"
    >
      {{ slotText }}
    </slot>
  </Primitive>
</template>
