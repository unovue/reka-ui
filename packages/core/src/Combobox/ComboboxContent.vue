<script lang="ts">
import type { ComboboxContentImplEmits, ComboboxContentImplProps } from './ComboboxContentImpl.vue'

export type ComboboxContentEmits = ComboboxContentImplEmits
export interface ComboboxContentProps extends ComboboxContentImplProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { Presence } from '@/Presence'
import { useForwardElement, useForwardPropsEmits } from '@/shared'
import { useAgentItem } from '@/shared/useAgentRegistration'
import { isPortalOpening } from '@/Teleport/portalGate'
import ComboboxContentImpl from './ComboboxContentImpl.vue'
import { injectComboboxRootContext } from './ComboboxRoot.vue'

const props = defineProps<ComboboxContentProps>()
const emits = defineEmits<ComboboxContentEmits>()
const forwarded = useForwardPropsEmits(props, emits)
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

const rootContext = injectComboboxRootContext()
useAgentItem(rootContext, useAttrs(), undefined, 'content')

// A closing content still mounted for its exit animation hands Escape, outside interaction
// and the accessibility tree back to the layer below at once. A force-mounted content keeps
// its layer while closed, as before.
const layerPresent = computed(() => rootContext.open.value || !!props.forceMount)
</script>

<template>
  <Presence
    v-slot="{ present }"
    :appear="isPortalOpening(rootContext)"
    :present="rootContext.open.value"
    :force-mount="forceMount || !rootContext.unmountOnHide.value"
    @complete="rootContext.notifyOpenComplete"
  >
    <ComboboxContentImpl
      v-show="forceMount || rootContext.unmountOnHide.value || present"
      v-bind="{ ...forwarded, ...$attrs }"
      :ref="forwardRef"
      :present="forceMount || rootContext.unmountOnHide.value || present"
      :layer-present="(rootContext.unmountOnHide.value || present) && layerPresent"
    >
      <slot />
    </ComboboxContentImpl>
  </Presence>
</template>
