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
import { Presence } from '@/Presence'
import { useForwardExpose, useForwardPropsEmits, useId } from '@/shared'
import ComboboxContentImpl from './ComboboxContentImpl.vue'
import { injectComboboxRootContext } from './ComboboxRoot.vue'

const props = defineProps<ComboboxContentProps>()
const emits = defineEmits<ComboboxContentEmits>()
const forwarded = useForwardPropsEmits(props, emits)
const { forwardRef } = useForwardExpose()

const rootContext = injectComboboxRootContext()

rootContext.contentId ||= useId(undefined, 'reka-combobox-content')
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
    >
      <slot />
    </ComboboxContentImpl>
  </Presence>
</template>
