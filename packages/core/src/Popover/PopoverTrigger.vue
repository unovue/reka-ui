<script lang="ts">
import type { PopoverHandle } from './handle'
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement, useId, usePartId } from '@/shared'

export interface PopoverTriggerProps<Payload = unknown> extends PrimitiveProps {
  /**
   * A handle from `createPopoverHandle()` that connects this trigger to a
   * `PopoverRoot` rendered elsewhere (outside this trigger's tree or portal).
   */
  handle?: PopoverHandle<Payload>
  /** Passed to the Root's default slot while this trigger owns the popover. Requires a `handle`. */
  payload?: Payload
  /**
   * Id of the element, which the content's `aria-labelledby` points at. With a
   * `handle`, also the id the Root's `triggerId` refers to. Auto-generated when
   * not provided.
   */
  id?: string
}
</script>

<script setup lang="ts" generic="Payload = unknown">
import { computed, watch } from 'vue'
import { PopperAnchor } from '@/Popper'
import { Primitive } from '@/Primitive'
import { getPopupRootStore, usePopupHandleTrigger } from '@/shared/popupHandle'
import { injectPopoverRootContext } from './PopoverRoot.vue'
import { getPopoverOwnTriggerSlot, getPopoverTriggerSurface } from './usePopover'

const props = withDefaults(defineProps<PopoverTriggerProps<Payload>>(), {
  as: 'button',
})

// A detached trigger (`handle`) may render outside any `PopoverRoot`.
const rootContext = injectPopoverRootContext(props.handle ? null : undefined)

const { forwardRef, currentElement: triggerElement, expose } = useForwardElement()
defineExpose(expose)

// Detached triggers (#2826): this trigger registers with the handle (its own,
// or its Root's) and derives its own open state, so only the trigger that
// opened the popover reports `aria-expanded` / `aria-controls`. The shared
// surface builder runs against that per-trigger view of the context.
// Only a trigger that joins a handle at setup draws its own id (an extra
// `useId()` call would shift every later generated id in handle-less trees);
// one whose Root gets a `handle` later uses the Root's trigger id. The `id`
// prop wins.
const detached = usePopupHandleTrigger<Payload>({
  handle: () => props.handle,
  rootContext,
  attrId: () => props.id,
  generatedId: props.handle || getPopupRootStore(rootContext)?.handle.value ? useId(undefined, 'reka-popover-trigger') : undefined,
  element: triggerElement,
  payload: () => props.payload,
})
// The handle's view of the trigger surface, built only once a handle is used.
let detachedTrigger: ReturnType<typeof getPopoverTriggerSurface> | undefined
function getDetachedTrigger() {
  return detachedTrigger ??= getPopoverTriggerSurface({
    get triggerId() {
      return detached.id.value
    },
    get contentId() {
      return detached.contentId.value!
    },
    open: detached.open,
    onOpenToggle: (reason, event) => detached.store.value?.pressTrigger(detached.id.value, 'toggle', reason, event) ?? false,
  } as Parameters<typeof getPopoverTriggerSurface>[0])
}

// id/aria/data-state + the toggling `onClick` all come from the shared surface
// builder (single source with `usePopover()`); the PopperAnchor wrapper (skipped
// when a `PopoverAnchor` is present), the element registration and the
// tag-dependent `type` stay in the SFC. Listener order is unchanged: `$attrs`
// fall through the as-child wrapper and `Slot` merges them BEFORE the inner
// element's own props, so a consumer `@click` still runs before the surface's
// `onClick`.
const trigger = rootContext ? getPopoverTriggerSurface(rootContext) : getDetachedTrigger()

// Without a `handle`, the trigger renders its own id (its `id` prop, else the
// Root's generated trigger id) and mirrors it into the Root, so the content's
// `aria-labelledby` follows.
const ownTriggerSlot = rootContext ? getPopoverOwnTriggerSlot(rootContext) : undefined
const ownTriggerId = ownTriggerSlot ? usePartId(() => props.id, ownTriggerSlot, 'triggerId') : undefined
const attrs = computed(() => detached.enabled.value
  ? getDetachedTrigger().attrs.value
  : ownTriggerId ? { ...trigger.attrs.value, id: ownTriggerId.value } : trigger.attrs.value)

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
</script>

<template>
  <component
    :is="detached.enabled.value || rootContext?.hasCustomAnchor.value ? Primitive : PopperAnchor"
    as-child
  >
    <Primitive
      :ref="forwardRef"
      :as="as"
      :as-child="props.asChild"
      v-bind="attrs"
      :type="as === 'button' ? 'button' : undefined"
    >
      <slot />
    </Primitive>
  </component>
</template>
