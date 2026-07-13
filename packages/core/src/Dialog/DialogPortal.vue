<script lang="ts">
import type { TeleportProps } from '@/Teleport'
import { reactiveOmit } from '@vueuse/shared'
import { computed } from 'vue'

export interface DialogPortalProps extends TeleportProps {}
</script>

<script setup lang="ts">
import { TeleportPrimitive } from '@/Teleport'
import { injectDialogRootContext } from './DialogRoot.vue'

const props = defineProps<DialogPortalProps>()

const forwarded = reactiveOmit(props, 'to')

const rootContext = injectDialogRootContext()
const resolvedTo = computed(() => props.to ?? rootContext.container.value ?? undefined)
</script>

<template>
  <TeleportPrimitive
    v-bind="forwarded"
    :to="resolvedTo"
  >
    <slot />
  </TeleportPrimitive>
</template>
