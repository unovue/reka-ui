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
import { isEqual } from 'ohash'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
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

// The lookup goes through `optionsSet`, which is derived from the mounted items.
// While the content closes, `SelectContent` hands the items over from the popper
// to the fallback fragment and they are briefly unmounted, so the lookup comes
// back empty even though the value hasn't changed. Keep the previous label for
// that handoff only: a value that genuinely has no matching option must still
// fall back to the placeholder rather than show a stale label.
function isSameModelValue(a?: unknown, b?: unknown) {
  if (a === undefined || b === undefined)
    return a === b
  return isEqual(a, b)
}

const isClosing = ref(false)
watch(() => rootContext.open.value, (open) => {
  if (!open)
    isClosing.value = true
})

const selectedLabel = ref<string[]>([])
// Tracked alongside the committed label rather than in its own watcher, so it
// still describes the value that label was resolved from.
let lastModelValue = rootContext.modelValue.value

// An empty lookup is only treated as the handoff when everything points at it:
// the content is closing, the value is unchanged and still set, and no item is
// registered at all. Any other empty lookup means the value has no label and
// must show the placeholder.
function isHandoff(modelValue?: AcceptableValue | AcceptableValue[]) {
  return isClosing.value
    && !rootContext.isEmptyModelValue.value
    && isSameModelValue(modelValue, lastModelValue)
    && rootContext.optionsSet.value.size === 0
}

let handoffTimeout: ReturnType<typeof setTimeout> | undefined

function clearHandoffTimeout() {
  if (handoffTimeout) {
    clearTimeout(handoffTimeout)
    handoffTimeout = undefined
  }
}

onUnmounted(clearHandoffTimeout)

function commit(value: string[]) {
  clearHandoffTimeout()
  selectedLabel.value = value
  lastModelValue = rootContext.modelValue.value
}

watch(resolvedLabel, (value) => {
  const modelValue = rootContext.modelValue.value

  if (value.length) {
    commit(value)
    isClosing.value = false
    return
  }

  if (isHandoff(modelValue)) {
    // The handoff lasts until `SelectContent` remounts the items in its fallback
    // fragment, which it does on a `setTimeout` (@see `renderPresence`). If every
    // item is gone by then — e.g. the options were emptied while the content was
    // closing — nothing re-registers and this watcher would never run again, so
    // end the handoff here instead of keeping the obsolete label forever.
    clearHandoffTimeout()
    handoffTimeout = setTimeout(() => {
      handoffTimeout = undefined
      const label = resolvedLabel.value
      if (label.length || !isHandoff(rootContext.modelValue.value))
        return
      commit(label)
      isClosing.value = false
    })
    return
  }

  commit(value)
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
