<script lang="ts">
import type {
  MenuContentEmits,
  MenuContentProps,
} from '@/Menu'

export type DropdownMenuContentEmits = Omit<MenuContentEmits, 'entryFocus'>

export interface DropdownMenuContentProps extends MenuContentProps {}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { hasFocusLeftScope } from '@/FocusScope/utils'
import { injectMenuContext, MenuContent } from '@/Menu'
import { omitEntryFocusListener } from '@/Menu/utils'
import { useContentId, useForwardExpose, useForwardPropsEmits, useId } from '@/shared'
import { injectDropdownMenuRootContext } from './DropdownMenuRoot.vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<DropdownMenuContentProps>()
const emits = defineEmits<DropdownMenuContentEmits>()
const forwarded = useForwardPropsEmits(props, emits)
useForwardExpose()

const rootContext = injectDropdownMenuRootContext()

const hasInteractedOutsideRef = ref(false)

function handleCloseAutoFocus(event: Event) {
  if (event.defaultPrevented)
    return
  if (!hasInteractedOutsideRef.value) {
    const scope = event.target
    setTimeout(() => {
      // Focus that something else took meanwhile, e.g. a layer opened by the same click, stays there
      if (!hasFocusLeftScope(scope))
        rootContext.triggerElement.value?.focus()
    }, 0)
  }
  hasInteractedOutsideRef.value = false

  // Always prevent auto focus because we either focus manually or want user agent focus
  event.preventDefault()
}

// A content kept mounted while closed (`unmountOnHide: false`) is hidden, not unmounted, so
// no `closeAutoFocus` returns focus. Return it to the trigger as `handleCloseAutoFocus` does.
const menuContext = injectMenuContext()
menuContext.onContentHide(({ container }) => {
  if (!hasInteractedOutsideRef.value && !hasFocusLeftScope(container ?? null))
    rootContext.triggerElement.value?.focus()
  hasInteractedOutsideRef.value = false
})

rootContext.contentId ||= useId(undefined, 'reka-dropdown-menu-content')
useContentId(rootContext, menuContext.content)
</script>

<template>
  <MenuContent
    :id="rootContext.contentId"
    :aria-labelledby="rootContext?.triggerId"
    :style="{
      '--reka-dropdown-menu-content-transform-origin':
        'var(--reka-popper-transform-origin)',
      '--reka-dropdown-menu-content-available-width':
        'var(--reka-popper-available-width)',
      '--reka-dropdown-menu-content-available-height':
        'var(--reka-popper-available-height)',
      '--reka-dropdown-menu-trigger-width': 'var(--reka-popper-anchor-width)',
      '--reka-dropdown-menu-trigger-height':
        'var(--reka-popper-anchor-height)',
    }"
    v-bind="{ ...forwarded, ...omitEntryFocusListener($attrs) }"
    @close-auto-focus="handleCloseAutoFocus"
    @interact-outside="(event) => {
      if (event.defaultPrevented) return

      const originalEvent = event.detail.originalEvent as PointerEvent;
      const ctrlLeftClick = originalEvent.button === 0 && originalEvent.ctrlKey === true;
      const isRightClick = originalEvent.button === 2 || ctrlLeftClick;
      if (!rootContext.modal.value || isRightClick) hasInteractedOutsideRef = true;
      if (rootContext.triggerElement.value?.contains(event.target as HTMLElement)) event.preventDefault()
    }"
  >
    <slot />
  </MenuContent>
</template>
