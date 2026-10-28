<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export type FocusScopeEmits = {
  /**
   * Event handler called when auto-focusing on mount.
   * Can be prevented.
   */
  mountAutoFocus: [event: Event]

  /**
   * Event handler called when auto-focusing on unmount.
   * Can be prevented.
   */
  unmountAutoFocus: [event: Event]
}

export interface FocusScopeProps extends PrimitiveProps {
  /**
   * When `true`, tabbing from last item will focus first tabbable
   * and shift+tab from first item will focus last tababble.
   * @defaultValue false
   */
  loop?: boolean

  /**
   * When `true`, focus cannot escape the focus scope via keyboard,
   * pointer, or a programmatic focus.
   * @defaultValue false
   */
  trapped?: boolean

  /**
   * Whether the scope is currently visible. Lets a consumer keep the scope
   * mounted but hidden (e.g. `display: none`) and still get correct auto-focus:
   * the mount auto-focus is skipped while not present, and re-runs when it
   * becomes present again. Defaults to `true` so consumers that mount the scope
   * only while visible are unaffected.
   * @defaultValue true
   */
  present?: boolean
}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { useFocusScope } from './useFocusScope'

const props = withDefaults(defineProps<FocusScopeProps>(), {
  loop: false,
  trapped: false,
  // `present` MUST default to `true`. It is typed `boolean`, so Vue's boolean
  // prop casting would otherwise coerce an absent prop to `false` (not
  // `undefined`), and `useFocusScope`'s `present !== false` gates would then skip
  // adding the scope to the stack for every consumer that doesn't pass `present`
  // (e.g. Combobox/Select content). That scope would never pause an ancestor
  // trap, so a Combobox input inside a Dialog could not be focused (#2749).
  present: true,
})
const emits = defineEmits<FocusScopeEmits>()

const { currentRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const scope = useFocusScope({
  element: currentElement,
  loop: () => props.loop,
  trapped: () => props.trapped,
  present: () => props.present,
  onMountAutoFocus: event => emits('mountAutoFocus', event),
  onUnmountAutoFocus: event => emits('unmountAutoFocus', event),
})
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    ref="currentRef"
    v-bind="scope.attrs()"
  >
    <slot />
  </component>
</template>
