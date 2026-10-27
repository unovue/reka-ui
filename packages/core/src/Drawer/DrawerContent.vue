<script lang="ts">
import type { DrawerContentImplEmits, DrawerContentImplProps } from './DrawerContentImpl.vue'

export type DrawerContentEmits = DrawerContentImplEmits
export interface DrawerContentProps extends Omit<DrawerContentImplProps, 'trapFocus'> {
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { Presence } from '@/Presence'
import { useBodyScrollLock, useEmitAsProps, useForwardElement, useHideOthers } from '@/shared'
import DrawerContentImpl from './DrawerContentImpl.vue'
import { injectDrawerRootContext } from './DrawerRoot.vue'
import { useDrawerContentModality } from './useDrawer'

const props = withDefaults(defineProps<DrawerContentProps>(), {
  initialFocus: true,
  finalFocus: true,
})
const emits = defineEmits<DrawerContentEmits>()

const rootContext = injectDrawerRootContext()
const emitsAsProps = useEmitAsProps(emits)
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

// Modality tiers (`true` / `'trap-focus'` / `false`) and their focus-return /
// outside-interaction handlers come from the composable; Presence and
// `useHideOthers` stay here.
const {
  isFullModal,
  shouldTrapFocus,
  onCloseAutoFocusModal,
  onPointerDownOutsideModal,
  onFocusOutsideModal,
  onCloseAutoFocusNonModal,
  onInteractOutsideNonModal,
} = useDrawerContentModality({
  rootContext,
  contentElement: currentElement,
  finalFocus: () => props.finalFocus,
})
const shouldHideOthers = computed(() => isFullModal.value ? currentElement.value : undefined)
useHideOthers(shouldHideOthers)

// BaseUI parity (`useDialogRoot`): only a fully modal drawer locks page scroll,
// with or without a `DrawerOverlay`; `'trap-focus'` leaves the page scrollable.
const scrollLocked = useBodyScrollLock(isFullModal.value && rootContext.open.value)
watch(() => isFullModal.value && rootContext.open.value, (locked) => {
  scrollLocked.value = locked
})
</script>

<template>
  <Presence :present="forceMount || rootContext.open.value">
    <DrawerContentImpl
      v-if="isFullModal"
      :ref="forwardRef"
      v-bind="{ ...props, ...emitsAsProps, ...$attrs }"
      :trap-focus="shouldTrapFocus"
      :disable-outside-pointer-events="true"
      @close-auto-focus="onCloseAutoFocusModal"
      @pointer-down-outside="onPointerDownOutsideModal"
      @focus-outside="onFocusOutsideModal"
    >
      <slot />
    </DrawerContentImpl>

    <DrawerContentImpl
      v-else
      :ref="forwardRef"
      v-bind="{ ...props, ...emitsAsProps, ...$attrs }"
      :trap-focus="shouldTrapFocus"
      :disable-outside-pointer-events="false"
      @close-auto-focus="onCloseAutoFocusNonModal"
      @interact-outside="onInteractOutsideNonModal"
    >
      <slot />
    </DrawerContentImpl>
  </Presence>
</template>
