<script lang="ts">
import type { DropdownMenuHandle } from './handle'
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement, useId } from '@/shared'

export interface DropdownMenuTriggerProps<Payload = unknown> extends PrimitiveProps {
  /** When `true`, prevents the user from interacting with item */
  disabled?: boolean
  /**
   * A handle from `createDropdownMenuHandle()` that connects this trigger to a
   * `DropdownMenuRoot` rendered elsewhere (outside this trigger's tree or portal).
   */
  handle?: DropdownMenuHandle<Payload>
  /** Passed to the Root's default slot while this trigger owns the menu. Requires a `handle`. */
  payload?: Payload
}
</script>

<script setup lang="ts" generic="Payload = unknown">
import { computed, onMounted, useAttrs } from 'vue'
import { MenuAnchor } from '@/Menu'
import {
  Primitive,
} from '@/Primitive'
import { getPopupRootStore, usePopupHandleTrigger } from '@/shared/popupHandle'
import { injectDropdownMenuRootContext } from './DropdownMenuRoot.vue'
import { getDropdownMenuTriggerSurface } from './useDropdownMenu'

const props = withDefaults(defineProps<DropdownMenuTriggerProps<Payload>>(), {
  as: 'button',
})

// A detached trigger (`handle`) may render outside any `DropdownMenuRoot`.
const rootContext = injectDropdownMenuRootContext(props.handle ? null : undefined)

const { forwardRef, currentElement: triggerElement, expose } = useForwardElement()
defineExpose(expose)

// Detached triggers (#2826): this trigger registers with the handle (its own,
// or its Root's) and derives its own open state, so only the trigger that
// opened the menu reports `aria-expanded` / `aria-controls`. Only such a
// trigger draws an id (an extra `useId()` would shift later generated ids).
const triggerId = props.handle || getPopupRootStore(rootContext)?.handle.value
  ? useId(useAttrs().id as string | undefined, 'reka-dropdown-menu-trigger')
  : rootContext!.triggerId
const detached = usePopupHandleTrigger<Payload>({
  handle: () => props.handle,
  rootContext,
  id: triggerId,
  element: triggerElement,
  payload: () => props.payload,
})
const detachedTrigger = getDropdownMenuTriggerSurface({
  triggerId,
  get contentId() {
    return detached.contentId.value!
  },
  open: detached.open,
  onOpenToggle: (reason, event) => {
    detached.store.value?.pressTrigger(triggerId, 'toggle', reason, event)
  },
  onOpenChange: (value, reason, event) => {
    if (value)
      detached.store.value?.pressTrigger(triggerId, 'open', reason, event)
    else
      detached.store.value?.closePopup(reason, event)
  },
}, () => props.disabled)

onMounted(() => {
  if (rootContext && !detached.enabled.value)
    rootContext.triggerElement = triggerElement
})

// Ids, aria, `data-state`/`data-disabled` and the click/keydown handlers come
// from the same builder `useDropdownMenu().trigger` uses.
const trigger = rootContext ? getDropdownMenuTriggerSurface(rootContext, () => props.disabled) : detachedTrigger
const attrs = computed(() => detached.enabled.value ? detachedTrigger.attrs.value : trigger.attrs.value)
</script>

<template>
  <component
    :is="detached.enabled.value ? Primitive : MenuAnchor"
    as-child
  >
    <Primitive
      :ref="forwardRef"
      :type="as === 'button' ? 'button' : undefined"
      :as-child="props.asChild"
      :as="as"
      v-bind="attrs"
    >
      <slot />
    </Primitive>
  </component>
</template>
