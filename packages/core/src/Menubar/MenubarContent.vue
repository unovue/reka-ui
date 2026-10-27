<script lang="ts">
import type { MenuContentEmits, MenuContentProps } from '@/Menu'
import { useCollection } from '@/Collection'

export type MenubarContentEmits = Omit<MenuContentEmits, 'entryFocus'>

export interface MenubarContentProps extends MenuContentProps {}
</script>

<script setup lang="ts">
import { MenuContent } from '@/Menu'
import { omitEntryFocusListener } from '@/Menu/utils'
import { useForwardElement, useForwardPropsEmits } from '@/shared'
import { injectMenubarMenuContext } from './MenubarMenu.vue'
import { injectMenubarRootContext } from './MenubarRoot.vue'
import { createMenubarContentSurface } from './useMenubar'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<MenubarContentProps>(), {
  align: 'start',
})
const emits = defineEmits<MenubarContentEmits>()
const forwarded = useForwardPropsEmits(props, emits)
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

const rootContext = injectMenubarRootContext()
const menuContext = injectMenubarMenuContext()

const { getItems } = useCollection({ key: 'Menubar' })

// `id`/`aria-labelledby`/the content selector, the focus handlers and the
// ArrowLeft/Right menu switching come from the composable. The surface's attrs
// (no handlers) spread BEFORE the forwarded props and `$attrs`, so a consumer
// `id` still wins; its handlers bind AFTER the forwarded emits, as before.
const content = createMenubarContentSurface(rootContext, menuContext, { getItems })
</script>

<template>
  <MenuContent
    :ref="forwardRef"
    :style="{
      '--reka-menubar-content-transform-origin':
        'var(--reka-popper-transform-origin)',
      '--reka-menubar-content-available-width':
        'var(--reka-popper-available-width)',
      '--reka-menubar-content-available-height':
        'var(--reka-popper-available-height)',
      '--reka-menubar-trigger-width': 'var(--reka-popper-anchor-width)',
      '--reka-menubar-trigger-height': 'var(--reka-popper-anchor-height)',
    }"
    v-bind="{ ...content.attrs.value, ...forwarded, ...omitEntryFocusListener($attrs) }"
    @close-auto-focus="content.onCloseAutoFocus"
    @focus-outside="content.onFocusOutside"
    @interact-outside="content.onInteractOutside"
    @entry-focus="content.onEntryFocus"
    @keydown="content.onKeydown"
  >
    <slot />
  </MenuContent>
</template>
