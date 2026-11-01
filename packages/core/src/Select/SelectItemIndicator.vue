<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface SelectItemIndicatorProps extends PrimitiveProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { Presence } from '@/Presence'
import { renderAs } from '@/Primitive/renderAs'
import { useLingeringPresence } from '@/shared/useLingeringPresence'
import { injectSelectContentContext, SelectContentDefaultContextValue } from './SelectContentImpl.vue'
import { injectSelectItemContext } from './SelectItem.vue'
import { useSelectItemIndicator } from './useSelect'

const props = withDefaults(defineProps<SelectItemIndicatorProps>(), {
  as: 'span',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const itemContext = injectSelectItemContext()
// A closed content's detached item renders no indicator.
const harvest = !!injectSelectContentContext(SelectContentDefaultContextValue).harvest
const { indicator, present } = harvest
  ? { indicator: undefined, present: undefined }
  : useSelectItemIndicator(itemContext)

// Mounts no `Presence` while not shown; see `useLingeringPresence`.
const shown = () => props.forceMount || !!present?.value
const lingering = harvest ? undefined : useLingeringPresence(shown)
</script>

<template>
  <Presence
    v-if="lingering?.mounted()"
    :present="shown()"
    :appear="lingering!.appear()"
    @vue:mounted="lingering!.onMounted"
    @complete="lingering!.onComplete"
  >
    <component
      :is="renderAs(as, asChild)"
      :ref="forwardRef"
      v-bind="indicator!.attrs.value"
    >
      <slot />
    </component>
  </Presence>
</template>
