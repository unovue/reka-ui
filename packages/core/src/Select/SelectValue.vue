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
import { useForwardExpose } from '@/shared'
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

const resolvedLabel = computed(() => {
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

// Keep the last resolved label so the placeholder doesn't flash when the
// options are transiently unregistered, e.g. while the content is closing and
// the items are being moved between the popper and the fallback fragment.
const selectedLabel = ref<string[]>(resolvedLabel.value)
watch(resolvedLabel, (value) => {
  if (value.length || rootContext.isEmptyModelValue.value)
    selectedLabel.value = value
}, { immediate: true })

const slotText = computed(() => {
  return selectedLabel.value.length ? selectedLabel.value.join(', ') : props.placeholder
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    :style="{ pointerEvents: 'none' }"
    :data-placeholder="selectedLabel.length ? undefined : props.placeholder"
  >
    <slot
      :selected-label="selectedLabel"
      :model-value="rootContext.modelValue.value"
    >
      {{ slotText }}
    </slot>
  </Primitive>
</template>
