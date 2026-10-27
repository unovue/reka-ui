<script lang="ts">
import type {
  SelectContentImplEmits,
  SelectContentImplProps,
} from './SelectContentImpl.vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

export type SelectContentEmits = SelectContentImplEmits

export interface SelectContentProps extends SelectContentImplProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { Presence } from '@/Presence'
import { useForwardElement, useForwardPropsEmits } from '@/shared'
import SelectContentImpl from './SelectContentImpl.vue'
import SelectProvider from './SelectProvider.vue'
import { injectSelectRootContext } from './SelectRoot.vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<SelectContentProps>()

const emits = defineEmits<SelectContentEmits>()
const forwarded = useForwardPropsEmits(props, emits)

const rootContext = injectSelectRootContext()

// Closed: the items render into a detached fragment so each `SelectItemText`
// registers its text for `SelectValue` and the native select. Skipped when the
// root has a `displayValue`, which resolves the text without the items.
const fragment = ref<DocumentFragment>()
// `Presence` is only rendered while open, so it mounts on every open: past this
// component's own mount, that first render is an open and gets
// `data-starting-style` (#2827).
const isMounted = ref(false)
onMounted(() => {
  fragment.value = new DocumentFragment()
  isMounted.value = true
})

const presenceRef = ref<InstanceType<typeof Presence>>()
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
function setPresenceRef(el: Element | ComponentPublicInstance | null) {
  presenceRef.value = (el ?? undefined) as InstanceType<typeof Presence> | undefined
  forwardRef(el)
}

const present = computed(() => props.forceMount || rootContext.open.value)
const renderPresence = ref(present.value)

let renderPresenceTimeout: ReturnType<typeof setTimeout> | undefined

function clearRenderPresenceTimeout() {
  if (renderPresenceTimeout) {
    clearTimeout(renderPresenceTimeout)
    renderPresenceTimeout = undefined
  }
}

watch(present, (_value, _oldValue, onCleanup) => {
  // Toggle render presence after a delay (nextTick is not enough)
  // to allow children to re-render with the latest state.
  // Otherwise, they would remain in the old state during the transition,
  // which would prevent the animation that depend on state (e.g., data-[state=closed])
  // from being applied accurately.
  // @see https://github.com/unovue/reka-ui/issues/1865
  clearRenderPresenceTimeout()
  renderPresenceTimeout = setTimeout(() => {
    renderPresence.value = present.value
    renderPresenceTimeout = undefined
  })
  onCleanup(clearRenderPresenceTimeout)
})

onUnmounted(clearRenderPresenceTimeout)
</script>

<template>
  <Presence
    v-if="present || renderPresence || presenceRef?.present"
    :ref="setPresenceRef"
    :present="rootContext.open.value"
    :force-mount="forceMount"
    :appear="isMounted"
    @complete="rootContext.notifyOpenComplete"
  >
    <SelectContentImpl v-bind="{ ...forwarded, ...$attrs }">
      <slot />
    </SelectContentImpl>
  </Presence>

  <div v-else-if="fragment && !rootContext.displayValue.value">
    <Teleport :to="fragment">
      <SelectProvider :context="rootContext">
        <slot />
      </SelectProvider>
    </Teleport>
  </div>
</template>
