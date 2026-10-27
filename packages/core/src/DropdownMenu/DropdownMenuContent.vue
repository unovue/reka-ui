<script lang="ts">
import type {
  MenuContentEmits,
  MenuContentProps,
} from '@/Menu'

export type DropdownMenuContentEmits = Omit<MenuContentEmits, 'entryFocus'>

export interface DropdownMenuContentProps extends MenuContentProps {}
</script>

<script setup lang="ts">
import { MenuContent } from '@/Menu'
import { provideMenuBackdropCutoutContext } from '@/Menu/MenuContentImpl.vue'
import { omitEntryFocusListener } from '@/Menu/utils'
import { useForwardElement, useForwardPropsEmits } from '@/shared'
import { injectDropdownMenuRootContext } from './DropdownMenuRoot.vue'
import { createDropdownMenuContentSurface } from './useDropdownMenu'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<DropdownMenuContentProps>()
const emits = defineEmits<DropdownMenuContentEmits>()
const forwarded = useForwardPropsEmits(props, emits)
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

const rootContext = injectDropdownMenuRootContext()
// The trigger stays interactive through a modal menu's backdrop (Base UI).
provideMenuBackdropCutoutContext(rootContext.triggerElement)

// `id`/`aria-labelledby` and the focus-restore / outside-interaction handlers
// come from the composable. The surface's attrs (ids only, no handlers) spread
// BEFORE the forwarded props and `$attrs`, so a consumer `id` still wins; its
// handlers bind AFTER the forwarded emits, so they still see a consumer's
// `preventDefault()`.
const content = createDropdownMenuContentSurface(rootContext)
</script>

<template>
  <MenuContent
    :ref="forwardRef"
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
    v-bind="{ ...content.attrs.value, ...forwarded, ...omitEntryFocusListener($attrs) }"
    @close-auto-focus="content.onCloseAutoFocus"
    @interact-outside="content.onInteractOutside"
  >
    <slot />
  </MenuContent>
</template>
