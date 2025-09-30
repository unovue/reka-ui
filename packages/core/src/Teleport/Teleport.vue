<script lang="ts">
export interface TeleportProps {
  /**
   * Vue native teleport component prop `:to`
   *
   * {@link https://vuejs.org/guide/built-ins/teleport.html#basic-usage}
   */
  to?: string | HTMLElement
  /**
   * Disable teleport and render the component inline
   *
   * {@link https://vuejs.org/guide/built-ins/teleport.html#disabling-teleport}
   */
  disabled?: boolean
  /**
   * Defer the resolving of a Teleport target until other parts of the
   * application have mounted (requires Vue 3.5.0+)
   *
   * {@link https://vuejs.org/guide/built-ins/teleport.html#deferred-teleport}
   */
  defer?: boolean
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { useMounted } from '@vueuse/core'
import { computed, getCurrentInstance } from 'vue'
import { getElementContainer } from '@/shared'

const props = withDefaults(defineProps<TeleportProps>(), {
  to: 'body',
})

const isMounted = useMounted()

// Make teleport shadow DOM-aware
const teleportTo = computed(() => {
  // If an explicit target is provided, use it
  if (props.to !== 'body') {
    return props.to
  }

  // If default 'body' target, detect the appropriate container
  const instance = getCurrentInstance()
  if (instance && instance.vnode.el) {
    const container = getElementContainer(instance.vnode.el)
    if (container instanceof ShadowRoot) {
      // For shadow DOM, use the shadow root as the container
      return container as any
    }
  }

  // Fall back to document.body for regular DOM
  return 'body'
})
</script>

<template>
  <Teleport
    v-if="isMounted || forceMount"
    :to="teleportTo"
    :disabled="disabled"
    :defer="defer"
  >
    <slot />
  </Teleport>
</template>
