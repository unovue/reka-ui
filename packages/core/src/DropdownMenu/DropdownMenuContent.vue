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
// Whether the last press outside landed on the trigger. WebKit does not focus a
// pressed button but its focusable ancestor, so that press also moves focus outside;
// the trigger handles the press itself, so that focus move must not dismiss (#3360).
const isPressOnTriggerRef = ref(false)

function handleInteractOutside(event: CustomEvent<{ originalEvent: Event }>) {
  const target = event.target as HTMLElement
  const trigger = rootContext.triggerElement.value
  const originalEvent = event.detail.originalEvent
  if (originalEvent.type === 'pointerdown')
    isPressOnTriggerRef.value = !!trigger?.contains(target)

  if (event.defaultPrevented)
    return

  const pointerEvent = originalEvent as PointerEvent
  const ctrlLeftClick = pointerEvent.button === 0 && pointerEvent.ctrlKey === true
  const isRightClick = pointerEvent.button === 2 || ctrlLeftClick
  if (!rootContext.modal.value || isRightClick)
    hasInteractedOutsideRef.value = true
  if (trigger?.contains(target))
    event.preventDefault()
  // Treated like the focus a trigger press gives the trigger in other engines.
  else if (originalEvent.type === 'focusin' && isPressOnTriggerRef.value && trigger && target.contains(trigger))
    event.preventDefault()
}

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
  isPressOnTriggerRef.value = false

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
  isPressOnTriggerRef.value = false
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
    @interact-outside="handleInteractOutside"
  >
    <slot />
  </MenuContent>
</template>
