<script lang="ts">
import type {
  MenuContentImplEmits,
  MenuContentImplProps,
} from './MenuContentImpl.vue'

export type MenuSubContentEmits = MenuContentImplEmits

// reference: https://github.com/radix-ui/primitives/blob/main/packages/react/menu/src/Menu.tsx#L1152
export interface MenuSubContentProps extends Omit<MenuContentImplProps, 'disableOutsidePointerEvents' | 'disableOutsideScroll' | 'trapFocus' | 'side' | 'align'> {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Presence } from '@/Presence'
import { useForwardElement, useForwardPropsEmits } from '@/shared'
import { vShowWhenKept } from '@/shared/vShowWhenKept'
import MenuContentImpl, { injectMenuContentContext } from './MenuContentImpl.vue'
import { injectMenuContext, injectMenuRootContext } from './MenuRoot.vue'
import { injectMenuSubContext } from './MenuSub.vue'
import { SUB_CLOSE_KEYS } from './utils'

const props = withDefaults(defineProps<MenuSubContentProps>(), {
  prioritizePosition: true,
})
const emits = defineEmits<MenuSubContentEmits>()

const forwarded = useForwardPropsEmits(props, emits)

const menuContext = injectMenuContext()
const rootContext = injectMenuRootContext()
const menuSubContext = injectMenuSubContext()
const parentContentContext = injectMenuContentContext()

const { forwardRef, currentElement: subContentElement, expose } = useForwardElement()
defineExpose(expose)

// As in `MenuContent`: a submenu follows its root's `unmountOnHide`.
const staysMounted = computed(() => !rootContext.unmountOnHide.value)
const hidesWhenClosed = computed(() => staysMounted.value && !props.forceMount)
const keptArg = computed(() => hidesWhenClosed.value ? 'kept' : null)
// A closing content still mounted for its exit animation hands Escape, outside interaction
// and the accessibility tree back to the layer below at once. A force-mounted content keeps
// its layer while closed, as before.
const layerPresent = computed(() => menuContext.open.value || !!props.forceMount)

// `appear`: a submenu that is already open when its parent menu opens is
// created open, and enters from `data-starting-style` with its parent
// (Base UI's `animateInitialOpen`, #2827). Kept out of the template: a comment
// before the root makes it a fragment in production, which drops fallthrough
// attributes.
</script>

<template>
  <Presence
    v-slot="{ present }"
    :present="menuContext.open.value"
    :force-mount="forceMount || staysMounted"
    appear
    @complete="menuContext.notifyOpenComplete"
  >
    <MenuContentImpl
      v-bind="forwarded"
      :id="menuSubContext.contentId"
      :ref="forwardRef"
      v-show-when-kept:[keptArg]="hidesWhenClosed ? present : true"
      :present="staysMounted ? present : true"
      :layer-present="(staysMounted ? present : true) && layerPresent"
      :aria-labelledby="menuSubContext.triggerId"
      align="start"
      :side="rootContext.dir.value === 'rtl' ? 'left' : 'right'"
      :disable-outside-pointer-events="false"
      :disable-outside-scroll="false"
      :trap-focus="false"
      @open-auto-focus.prevent="(event) => {
        // when opening a submenu, focus content for keyboard users only
        if (rootContext.isUsingKeyboardRef.value) subContentElement?.focus();
      }"
      @close-auto-focus.prevent
      @focus-outside="
        (event) => {
          if (event.defaultPrevented) return;
          // We prevent closing when the trigger is focused to avoid triggering a re-open animation
          // on pointer interaction.
          // Also check if focus is moving to the parent content's filter to avoid closing when
          // hovering between submenu and parent menu
          const isMovingToParentContent = parentContentContext.filterElement.value?.contains(event.target as Node);
          if (event.target !== menuSubContext.trigger.value && !isMovingToParentContent)
            menuContext.onOpenChange(false, 'focus-outside', event);
        }
      "
      @escape-key-down="
        (event) => {
          rootContext.onClose('escape-key', event);
          // ensure pressing escape in submenu doesn't escape full screen mode
          event.preventDefault();
        }
      "
      @keydown="(event: KeyboardEvent) => {
        // Submenu key events bubble through portals. We only care about keys in this menu.
        const isKeyDownInside = (event.currentTarget as HTMLElement)?.contains(event.target as HTMLElement);
        const isCloseKey = SUB_CLOSE_KEYS[rootContext.dir.value].includes(event.key);
        if (isKeyDownInside && isCloseKey) {
          menuContext.onOpenChange(false, 'list-navigation', event);
          // We focus manually because we prevented it in `onCloseAutoFocus`
          if (parentContentContext.filterElement.value) {
            parentContentContext.filterElement.value.focus();
            parentContentContext.highlightedElement.value = menuSubContext.trigger.value;
            menuSubContext.trigger.value?.scrollIntoView({ block: 'nearest' });
          }
          else {
            menuSubContext.trigger.value?.focus();
          }
          // prevent window from scrolling
          event.preventDefault();
        }
      }"
    >
      <slot />
    </MenuContentImpl>
  </Presence>
</template>
