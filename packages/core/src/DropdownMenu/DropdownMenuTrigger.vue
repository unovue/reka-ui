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
import { computed, onBeforeUpdate, shallowRef, useAttrs, watch } from 'vue'
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
// trigger draws an id (an extra `useId()` would shift later generated ids);
// one whose Root gets a `handle` later uses the Root's trigger id. An `id`
// attribute wins and is tracked across renders.
const attrs$ = useAttrs()
const attrId = shallowRef(attrs$.id as string | undefined)
onBeforeUpdate(() => {
  attrId.value = attrs$.id as string | undefined
})
const detached = usePopupHandleTrigger<Payload>({
  handle: () => props.handle,
  rootContext,
  attrId,
  generatedId: props.handle || getPopupRootStore(rootContext)?.handle.value ? useId(undefined, 'reka-dropdown-menu-trigger') : undefined,
  element: triggerElement,
  payload: () => props.payload,
})
// The handle's view of the trigger surface, built only once a handle is used.
let detachedTrigger: ReturnType<typeof getDropdownMenuTriggerSurface> | undefined
function getDetachedTrigger() {
  return detachedTrigger ??= getDropdownMenuTriggerSurface({
    get triggerId() {
      return detached.id.value
    },
    get contentId() {
      return detached.contentId.value!
    },
    open: detached.open,
    onOpenToggle: (reason, event) => {
      detached.store.value?.pressTrigger(detached.id.value, 'toggle', reason, event)
    },
    onOpenChange: (value, reason, event) => {
      if (value)
        detached.store.value?.pressTrigger(detached.id.value, 'open', reason, event)
      else
        detached.store.value?.closePopup(reason, event, triggerElement.value)
    },
  }, () => props.disabled)
}

// Write this trigger's element into the Root's existing `triggerElement` ref
// (never replace the ref: with a `handle` it is a writable computed that
// resolves to the active detached trigger, and the write only sets the Root's
// own fallback). Watched, so an `asChild` element swap stays in sync.
if (rootContext) {
  watch(triggerElement, (element, previous) => {
    // On unmount, clear it only if it still holds this trigger's element.
    if (element || rootContext.triggerElement.value === previous)
      rootContext.triggerElement.value = element
  }, { immediate: true })
}

// Ids, aria, `data-state`/`data-disabled` and the click/keydown handlers come
// from the same builder `useDropdownMenu().trigger` uses.
const trigger = rootContext ? getDropdownMenuTriggerSurface(rootContext, () => props.disabled) : getDetachedTrigger()
const attrs = computed(() => detached.enabled.value ? getDetachedTrigger().attrs.value : trigger.attrs.value)
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
