<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface FieldErrorProps extends PrimitiveProps {
  /** Id of the element. Auto-generated when not provided. */
  id?: string
  /**
   * Restricts when this error renders:
   * - a `ValidityState` key (e.g. `"valueMissing"`) — renders when that native constraint fails.
   * - `true` — renders whenever the field is invalid, for any reason.
   * - `false` — never renders (escape hatch).
   * - omitted — renders when custom `validate`/server errors exist.
   */
  match?: keyof ValidityState | boolean
  /** Force mounting, ignoring `match`/validity — useful for animation frameworks. */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardExpose, useId } from '@/shared'
import { injectFieldRootContext } from './FieldRoot.vue'

const props = withDefaults(defineProps<FieldErrorProps>(), {
  as: 'p',
  // `match`'s type includes `boolean`, which triggers Vue's boolean-attribute
  // casting (an omitted prop is cast to `false` instead of `undefined`) unless
  // an explicit default is set — required here to tell "omitted" apart from
  // an explicit `:match="false"`.
  match: undefined,
})

defineSlots<{
  default?: (props: {
    /** All current error messages. */
    errors: string[]
  }) => any
}>()

const fieldContext = injectFieldRootContext()

useForwardExpose()

const errorId = ref(useId(props.id))

const visible = computed(() => {
  if (props.forceMount)
    return true

  if (typeof props.match === 'string')
    return fieldContext.validity.value?.[props.match] === true

  if (props.match === true)
    return fieldContext.invalid.value

  if (props.match === false)
    return false

  return fieldContext.errors.value.length > 0
})

// Registration tracks visibility over time (not just at mount) — a
// `FieldError` can become visible/hidden long after it first mounts (e.g.
// once validation runs), and a hidden error must not describe the control.
let unregister: (() => void) | undefined
watch(visible, (isVisible) => {
  if (isVisible && !unregister) {
    unregister = fieldContext.registerDescription(errorId.value)
  }
  else if (!isVisible && unregister) {
    unregister()
    unregister = undefined
  }
}, { immediate: true })
onBeforeUnmount(() => unregister?.())
</script>

<template>
  <Primitive
    v-if="visible"
    :id="errorId"
    :as="as"
    :as-child="asChild"
  >
    <slot :errors="fieldContext.errors.value" />
  </Primitive>
</template>
