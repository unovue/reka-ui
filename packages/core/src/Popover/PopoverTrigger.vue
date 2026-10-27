<script lang="ts">
import type { PopoverHandle } from './handle'
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement, useId } from '@/shared'

export interface PopoverTriggerProps<Payload = unknown> extends PrimitiveProps {
  /**
   * A handle from `createPopoverHandle()` that connects this trigger to a
   * `PopoverRoot` rendered elsewhere (outside this trigger's tree or portal).
   */
  handle?: PopoverHandle<Payload>
  /** Passed to the Root's default slot while this trigger owns the popover. Requires a `handle`. */
  payload?: Payload
}
</script>

<script setup lang="ts" generic="Payload = unknown">
import { computed, onBeforeUpdate, onMounted, shallowRef, useAttrs } from 'vue'
import { PopperAnchor } from '@/Popper'
import { Primitive } from '@/Primitive'
import { getPopupRootStore, usePopupHandleTrigger } from '@/shared/popupHandle'
import { injectPopoverRootContext } from './PopoverRoot.vue'
import { getPopoverTriggerSurface } from './usePopover'

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
  generatedId: props.handle || getPopupRootStore(rootContext)?.handle.value ? useId(undefined, 'reka-popover-trigger') : undefined,
  element: triggerElement,
  payload: () => props.payload,
})
const detachedTrigger = getPopoverTriggerSurface({
  get triggerId() {
    return detached.id.value
  },
  get contentId() {
    return detached.contentId.value!
  },
  open: detached.open,
  onOpenToggle: (reason, event) => detached.store.value?.pressTrigger(detached.id.value, 'toggle', reason, event) ?? false,
} as Parameters<typeof getPopoverTriggerSurface>[0])

// id/aria/data-state + the toggling `onClick` all come from the shared surface
// builder (single source with `usePopover()`); the PopperAnchor wrapper (skipped
// when a `PopoverAnchor` is present), the element registration and the
// tag-dependent `type` stay in the SFC. Listener order is unchanged: `$attrs`
// fall through the as-child wrapper and `Slot` merges them BEFORE the inner
// element's own props, so a consumer `@click` still runs before the surface's
// `onClick`.
const trigger = rootContext ? getPopoverTriggerSurface(rootContext) : detachedTrigger
const attrs = computed(() => detached.enabled.value ? detachedTrigger.attrs.value : trigger.attrs.value)

onMounted(() => {
  if (rootContext && !detached.enabled.value)
    rootContext.triggerElement.value = triggerElement.value
})
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
