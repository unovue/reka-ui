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
}
</script>

<script setup lang="ts" generic="Payload = unknown">
import { computed, onBeforeUpdate, onMounted, shallowRef, useAttrs } from 'vue'
import { Primitive } from '@/Primitive'
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
// one whose Root gets a `handle` later uses the Root's trigger id. An `id`
// attribute wins and is tracked across renders.
const attrs = useAttrs()
const attrId = shallowRef(attrs.id as string | undefined)
onBeforeUpdate(() => {
  attrId.value = attrs.id as string | undefined
})
const detached = usePopupHandleTrigger<Payload>({
  handle: () => props.handle,
  rootContext,
  attrId,
  generatedId: props.handle || getPopupRootStore(rootContext)?.handle.value ? useId(undefined, 'reka-dialog-trigger') : undefined,
  element: currentElement,
  payload: () => props.payload,
})
const detachedTrigger = getDialogTriggerSurface({
  get contentId() {
    return detached.contentId.value!
  },
  open: detached.open,
  onOpenToggle: (reason, event) => detached.store.value?.pressTrigger(detached.id.value, 'toggle', reason, event) ?? false,
})

// aria-haspopup/aria-expanded/aria-controls/data-state + the click handler come
// from the shared surface builder (single source with `useDialog()`); the
// tag-dependent `type` stays in the SFC. Consumer listeners fall through as
// `$attrs` AFTER the surface's handler, so they chain instead of clobbering it.
const trigger = rootContext ? getDialogTriggerSurface(rootContext) : detachedTrigger
const triggerAttrs = computed(() => detached.enabled.value
  ? { ...detachedTrigger.attrs.value, id: detached.id.value }
  : trigger.attrs.value)

onMounted(() => {
  if (rootContext && !detached.enabled.value)
    rootContext.triggerElement.value = currentElement.value
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="triggerAttrs"
  >
    <slot />
  </Primitive>
</template>
