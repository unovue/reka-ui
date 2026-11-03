<script lang="ts">
import type { DialogHandle } from './handle'
import type { PrimitiveProps } from '@/Primitive'

export interface DialogTriggerProps<Payload = unknown> extends PrimitiveProps {
  /**
   * A handle from `createDialogHandle()` that connects this trigger to a
   * `DialogRoot` rendered elsewhere (outside this trigger's tree or portal).
   */
  handle?: DialogHandle<Payload>
  /** Passed to the Root's default slot while this trigger owns the dialog. Requires a `handle`. */
  payload?: Payload
  /** Id of the element. With a `handle`, also the id the Root's `triggerId` refers to. */
  id?: string
}
</script>

<script setup lang="ts" generic="Payload = unknown">
import { computed, watch } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement, useId } from '@/shared'
import { getPopupRootStore, usePopupHandleTrigger } from '@/shared/popupHandle'
import { injectDialogRootContext } from './DialogRoot.vue'
import { getDialogTriggerSurface } from './useDialog'

const props = withDefaults(defineProps<DialogTriggerProps<Payload>>(), {
  as: 'button',
})
// A detached trigger (`handle`) may render outside any `DialogRoot`.
const rootContext = injectDialogRootContext(props.handle ? null : undefined)
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

// Detached triggers (#2826): this trigger registers with the handle (its own,
// or its Root's) and derives its own open state, so only the trigger that
// opened the dialog reports `aria-expanded` / `aria-controls`. Only such a
// trigger draws an id (an extra `useId()` would shift later generated ids);
// one whose Root gets a `handle` later uses the Root's trigger id. The `id`
// prop wins.
const detached = usePopupHandleTrigger<Payload>({
  handle: () => props.handle,
  rootContext,
  attrId: () => props.id,
  generatedId: props.handle || getPopupRootStore(rootContext)?.handle.value ? useId(undefined, 'reka-dialog-trigger') : undefined,
  element: currentElement,
  payload: () => props.payload,
})
// The handle's view of the trigger surface, built only once a handle is used.
let detachedTrigger: ReturnType<typeof getDialogTriggerSurface> | undefined
function getDetachedTrigger() {
  return detachedTrigger ??= getDialogTriggerSurface({
    get contentId() {
      return detached.contentId.value!
    },
    open: detached.open,
    onOpenToggle: (reason, event) => detached.store.value?.pressTrigger(detached.id.value, 'toggle', reason, event) ?? false,
  })
}

// aria-haspopup/aria-expanded/aria-controls/data-state + the click handler come
// from the shared surface builder (single source with `useDialog()`); the
// tag-dependent `type` stays in the SFC. Consumer listeners fall through as
// `$attrs` AFTER the surface's handler, so they chain instead of clobbering it.
const trigger = rootContext ? getDialogTriggerSurface(rootContext) : getDetachedTrigger()
const triggerAttrs = computed(() => detached.enabled.value
  ? { ...getDetachedTrigger().attrs.value, id: detached.id.value }
  : { ...trigger.attrs.value, id: props.id })

// Write this trigger's element into the Root's existing `triggerElement` ref
// (never replace the ref: with a `handle` it is a writable computed that
// resolves to the active detached trigger, and the write only sets the Root's
// own fallback). Watched, so an `asChild` element swap stays in sync.
if (rootContext) {
  watch(currentElement, (element, previous) => {
    // On unmount, clear it only if it still holds this trigger's element.
    if (element || rootContext.triggerElement.value === previous)
      rootContext.triggerElement.value = element
  }, { immediate: true })
}
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="triggerAttrs"
  >
    <slot />
  </component>
</template>
