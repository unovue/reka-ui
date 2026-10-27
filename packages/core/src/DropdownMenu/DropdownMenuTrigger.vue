<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface DropdownMenuTriggerProps extends PrimitiveProps {
  /** When `true`, prevents the user from interacting with item */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { onMounted } from 'vue'
import { MenuAnchor } from '@/Menu'
import {
  Primitive,
} from '@/Primitive'
import { injectDropdownMenuRootContext } from './DropdownMenuRoot.vue'
import { getDropdownMenuTriggerSurface } from './useDropdownMenu'

const props = withDefaults(defineProps<DropdownMenuTriggerProps>(), {
  as: 'button',
})

const rootContext = injectDropdownMenuRootContext()

const { forwardRef, currentElement: triggerElement, expose } = useForwardElement()
defineExpose(expose)

onMounted(() => {
  rootContext.triggerElement = triggerElement
})

// Ids, aria, `data-state`/`data-disabled` and the click/keydown handlers come
// from the same builder `useDropdownMenu().trigger` uses.
const trigger = getDropdownMenuTriggerSurface(rootContext, () => props.disabled)
</script>

<template>
  <MenuAnchor as-child>
    <Primitive
      :ref="forwardRef"
      :type="as === 'button' ? 'button' : undefined"
      :as-child="props.asChild"
      :as="as"
      v-bind="trigger.attrs.value"
    >
      <slot />
    </Primitive>
  </MenuAnchor>
</template>
