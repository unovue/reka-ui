<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { computed, onMounted, onUnmounted, ref, watch, watchSyncEffect } from 'vue'
import { injectMenuContentContext } from '@/Menu/MenuContentImpl.vue'
import { injectMenuRootContext } from '@/Menu/MenuRoot.vue'
import { injectMenuSubContext } from '@/Menu/MenuSub.vue'
import {
  usePrimitiveElement,
} from '@/Primitive'
import { useComposing, useControllableState } from '@/shared'

export interface DropdownMenuFilterProps extends PrimitiveProps {
  /** The controlled value of the filter. Can be binded with v-model. */
  modelValue?: string
  /** Focus on element when mounted. */
  autoFocus?: boolean
  /** When `true`, prevents the user from interacting with the filter input. */
  disabled?: boolean
}

export type DropdownMenuFilterEmits = {
  'update:modelValue': [string]
}
</script>

<script setup lang="ts">
import { renderAsEmpty, rendersChildren } from '@/Primitive/renderAs'

const props = withDefaults(defineProps<DropdownMenuFilterProps>(), {
  as: 'input',
})
const emits = defineEmits<DropdownMenuFilterEmits>()

defineSlots<{
  default?: (props: {
    /** Current input values */
    modelValue: typeof modelValue.value
  }) => any
}>()

// A single-argument `update:modelValue`, like `<input v-model>`. As with the
// former `useVModel`: a filter bound at mount emits on every input (even an
// unchanged text) and reads `''` once the binding is cleared.
// Latched the first time a value is bound, at mount or later, as the composable latches
// controlled mode.
let controlled = props.modelValue !== undefined
const { state: modelValue, setState: setModelValue } = useControllableState<string | undefined>({
  prop: () => {
    if (props.modelValue !== undefined)
      controlled = true
    return props.modelValue === undefined && controlled ? '' : props.modelValue
  },
  defaultValue: '',
  // Typed `string | undefined` for the slot, as before; only strings are written.
  onUpdate: value => emits('update:modelValue', value as string),
  isEqual: (a, b) => !controlled && Object.is(a, b),
})

const rootContext = injectMenuRootContext()
const contentContext = injectMenuContentContext()
const subContext = injectMenuSubContext(null)

// Keep searchRef in sync with modelValue changes
watch(modelValue, (v) => { contentContext.searchRef.value = v ?? '' }, { immediate: true })

const { primitiveElement, currentElement, expose } = usePrimitiveElement()
defineExpose(expose)
const disabled = computed(() => props.disabled || false)

const activedescendant = ref<string | undefined>()
watchSyncEffect(() => activedescendant.value = contentContext.highlightedElement.value?.id)

onMounted(() => {
  contentContext.onFilterElementChange(currentElement.value)
  setTimeout(() => {
    // make sure all DOM was flush then only capture the focus
    if (props.autoFocus) {
      const isSubmenu = !!subContext
      if (!isSubmenu || rootContext.isUsingKeyboardRef.value)
        currentElement.value?.focus()
    }
  }, 1)
})

onUnmounted(() => {
  contentContext.onFilterElementChange(undefined)
  // Clean up search when unmounting
  contentContext.searchRef.value = ''
})

const { isComposing, shouldDeferInput, handleCompositionStart, handleCompositionUpdate, handleCompositionEnd } = useComposing((event) => {
  const el = event.target as HTMLInputElement
  if (el) {
    setModelValue(el.value)
    contentContext.searchRef.value = el.value
  }
})

function handleInput(event: InputEvent) {
  if (disabled.value)
    return
  if (shouldDeferInput.value)
    return
  const target = event.target as HTMLInputElement
  setModelValue(target.value)
  contentContext.searchRef.value = target.value
}

function handleKeyDown(event: KeyboardEvent) {
  if (disabled.value)
    return
  // During composition the keys belong to the IME (candidate navigation/commit).
  // Stop them from bubbling to the menu content's keydown handler (which would
  // navigate/typeahead) without calling preventDefault, so the IME still works.
  if (isComposing.value) {
    event.stopPropagation()
    return
  }
  if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault()
    contentContext.onKeydownNavigation(event)
  }
  else if (event.key === 'Enter') {
    event.preventDefault()
    contentContext.onKeydownEnter(event)
  }
  // Prevent Escape from bubbling to avoid closing the menu when clearing the filter
  else if (event.key === 'Escape' && modelValue.value) {
    event.stopPropagation()
    setModelValue('')
    contentContext.searchRef.value = ''
  }
}
</script>

<template>
  <component
    :is="renderAsEmpty(as, asChild)"
    ref="primitiveElement"
    :value="modelValue"
    :disabled="disabled ? '' : undefined"
    :data-disabled="disabled ? '' : undefined"
    :aria-disabled="disabled ? true : undefined"
    :aria-activedescendant="activedescendant"
    type="text"
    role="searchbox"
    @input="handleInput"
    @keydown="handleKeyDown"
    @compositionstart="handleCompositionStart"
    @compositionupdate="handleCompositionUpdate"
    @compositionend="handleCompositionEnd"
  >
    <template
      v-if="rendersChildren(as, asChild)"
      #default
    >
      <slot :model-value="modelValue" />
    </template>
  </component>
</template>
