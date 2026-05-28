<script lang="ts">
import type { PrimitiveProps } from '..'
import { useVModel } from '@vueuse/core'
import { computed, onMounted, onUnmounted, ref, watchSyncEffect } from 'vue'
import { usePrimitiveElement } from '@/Primitive'
import { useComposing } from '@/shared'
import { Primitive } from '..'
import { injectListboxRootContext } from './ListboxRoot.vue'

export interface ListboxFilterProps extends PrimitiveProps {
  /** The controlled value of the filter. Can be binded with v-model. */
  modelValue?: string
  /** Focus on element when mounted. */
  autoFocus?: boolean
  /** When `true`, prevents the user from interacting with item */
  disabled?: boolean
}

export type ListboxFilterEmits = {
  'update:modelValue': [string]
}
</script>

<script setup lang="ts">
const props = withDefaults(defineProps<ListboxFilterProps>(), {
  as: 'input',
})
const emits = defineEmits<ListboxFilterEmits>()

defineSlots<{
  default?: (props: {
    /** Current input values */
    modelValue: typeof modelValue.value
  }) => any
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: '',
  passive: (props.modelValue === undefined) as false,
})

const rootContext = injectListboxRootContext()

const { primitiveElement, currentElement } = usePrimitiveElement()
const disabled = computed(() => props.disabled || rootContext.disabled.value || false)

const activedescendant = ref<string | undefined>()
watchSyncEffect(() => activedescendant.value = rootContext.highlightedElement.value?.id)

onMounted(() => {
  rootContext.focusable.value = false

  setTimeout(() => {
    // make sure all DOM was flush then only capture the focus
    if (props.autoFocus)
      currentElement.value?.focus()
  }, 1)
})

onUnmounted(() => {
  rootContext.focusable.value = true
})

const { isComposing, handleCompositionStart, handleCompositionEnd } = useComposing(() => {
  rootContext.onCompositionEnd()
  rootContext.highlightFirstItem()
})

function onCompositionStart() {
  rootContext.onCompositionStart()
  handleCompositionStart()
}

function handleInput(event: InputEvent) {
  modelValue.value = (event.target as HTMLInputElement).value
  if (isComposing.value)
    return
  rootContext.highlightFirstItem()
}
</script>

<template>
  <Primitive
    ref="primitiveElement"
    :as="as"
    :as-child="asChild"
    :value="modelValue"
    :disabled="disabled ? '' : undefined"
    :data-disabled="disabled ? '' : undefined"
    :aria-disabled="disabled ?? undefined"
    :aria-activedescendant="activedescendant"
    type="text"
    @keydown.down.up.home.end.prevent="rootContext.onKeydownNavigation"
    @keydown.enter="rootContext.onKeydownEnter"
    @input="handleInput"
    @compositionstart="onCompositionStart"
    @compositionend="handleCompositionEnd"
  >
    <slot :model-value="modelValue" />
  </Primitive>
</template>
