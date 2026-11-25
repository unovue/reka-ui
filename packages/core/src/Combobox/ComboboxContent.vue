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
import { useForwardExpose, useForwardPropsEmits, useId } from '@/shared'
import { useAgentItem } from '@/shared/useAgentRegistration'
import ComboboxContentImpl from './ComboboxContentImpl.vue'
import { injectComboboxRootContext } from './ComboboxRoot.vue'

const props = defineProps<ComboboxContentProps>()
const emits = defineEmits<ComboboxContentEmits>()
const forwarded = useForwardPropsEmits(props, emits)
const { forwardRef } = useForwardExpose()

const rootContext = injectComboboxRootContext()
// The agent marks written on the content are known while it's closed and its items aren't rendered.
useAgentItem(rootContext, useAttrs(), undefined, 'content')

rootContext.contentId ||= useId(undefined, 'reka-combobox-content')

// A closing content still mounted for its exit animation hands Escape, outside interaction
// and the accessibility tree back to the layer below at once. A force-mounted content keeps
// its layer while closed, as before.
const layerPresent = computed(() => rootContext.open.value || !!props.forceMount)
</script>

<template>
  <Presence
    v-slot="{ present }"
    :present="forceMount || rootContext.open.value"
    :force-mount="forceMount || !rootContext.unmountOnHide.value"
  >
    <ComboboxContentImpl
      v-show="rootContext.unmountOnHide.value || present"
      v-bind="{ ...forwarded, ...$attrs }"
      :ref="forwardRef"
      :present="rootContext.unmountOnHide.value || present"
      :layer-present="(rootContext.unmountOnHide.value || present) && layerPresent"
    >
      <slot />
    </ComboboxContentImpl>
  </Presence>
</template>
