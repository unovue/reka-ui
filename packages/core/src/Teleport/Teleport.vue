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
import { computed } from 'vue'
import { injectConfigProviderContext } from '@/ConfigProvider/ConfigProvider.vue'

const props = defineProps<TeleportProps>()

const configContext = injectConfigProviderContext({})

const target = computed(() => props.to ?? configContext.teleportTo?.value ?? 'body')

const isMounted = useMounted()
</script>

<template>
  <Teleport
    v-if="isMounted || forceMount"
    :to="target"
    :disabled="disabled"
    :defer="defer"
  >
    <slot />
  </Teleport>
</template>
