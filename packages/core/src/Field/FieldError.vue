<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface FieldErrorProps extends PrimitiveProps {
  /** Id of the element. Auto-generated when not provided. */
  id?: string
  /**
   * Restricts when this error renders:
   * - a `ValidityState` key (e.g. `"valueMissing"`) — renders when that constraint fails.
   * - `true` — always renders, letting an external library control visibility.
   * - omitted — renders whenever the field is invalid.
   */
  match?: keyof ValidityState | boolean
  /** Used to force mounting when more control is needed. Useful when controlling animation with Vue animation libraries. */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Presence } from '@/Presence'
import { Primitive } from '@/Primitive'
import { useForwardExpose, useId } from '@/shared'
import { injectFieldRootContext } from './FieldRoot.vue'

const props = withDefaults(defineProps<FieldErrorProps>(), {
  as: 'div',
  // `match`'s type includes `boolean`, which triggers Vue's boolean-attribute
  // casting (an omitted prop is cast to `false` instead of `undefined`) unless
  // an explicit default is set — required to tell "omitted" apart from
  // an explicit `:match="false"`.
  match: undefined,
})

defineSlots<{
  default?: (props: {
    /** The error messages this part displays. */
    errors: string[]
  }) => any
}>()

const fieldContext = injectFieldRootContext()

const { forwardRef } = useForwardExpose()

const errorId = ref(useId(props.id))

const isSpecificMatch = computed(() => typeof props.match === 'string')

const visible = computed(() => {
  if (props.match === true)
    return true
  if (fieldContext.disabled.value || props.match === false)
    return false
  if (typeof props.match === 'string')
    return fieldContext.validity.value[props.match as keyof typeof fieldContext.validity.value] === true
  return fieldContext.serverErrors.value.length > 0 || fieldContext.valid.value === false
})

// A specific constraint shows the validation messages; otherwise server
// errors take over while present.
const messages = computed(() => {
  if (!isSpecificMatch.value && fieldContext.serverErrors.value.length > 0)
    return fieldContext.serverErrors.value
  return fieldContext.validationErrors.value
})

// Keep showing the last messages while the error animates out.
const renderedMessages = ref<string[]>([])
watch([visible, messages], () => {
  if (visible.value)
    renderedMessages.value = messages.value
}, { immediate: true })

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
  <Presence :present="forceMount || visible">
    <Primitive
      v-bind="fieldContext.dataAttributes.value"
      :id="errorId"
      :ref="forwardRef"
      :as="as"
      :as-child="asChild"
      :data-state="visible ? 'open' : 'closed'"
    >
      <slot :errors="renderedMessages">
        <ul v-if="renderedMessages.length > 1">
          <li
            v-for="message in renderedMessages"
            :key="message"
          >
            {{ message }}
          </li>
        </ul>
        <template v-else>
          {{ renderedMessages[0] }}
        </template>
      </slot>
    </Primitive>
  </Presence>
</template>
