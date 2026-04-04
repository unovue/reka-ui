<script lang="ts">
import type { DrawerContentImplEmits, DrawerContentImplProps } from './DrawerContentImpl.vue'

export type DrawerContentEmits = DrawerContentImplEmits
export interface DrawerContentProps extends Omit<DrawerContentImplProps, 'trapFocus'> {
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { Presence } from '@/Presence'
import { useEmitAsProps, useForwardExpose, useHideOthers } from '@/shared'
import DrawerContentImpl from './DrawerContentImpl.vue'
import { injectDrawerRootContext } from './DrawerRoot.vue'

const props = defineProps<DrawerContentProps>()
const emits = defineEmits<DrawerContentEmits>()

const rootContext = injectDrawerRootContext()
const emitsAsProps = useEmitAsProps(emits)
const { forwardRef, currentElement } = useForwardExpose()
const hasInteractedOutside = ref(false)
const hasPointerDownOutside = ref(false)

useHideOthers(rootContext.modal.value ? currentElement : ref(undefined))
</script>

<template>
  <Presence :present="forceMount || rootContext.open.value">
    <DrawerContentImpl
      v-if="rootContext.modal.value"
      :ref="forwardRef"
      v-bind="{ ...props, ...emitsAsProps, ...$attrs }"
      :trap-focus="rootContext.open.value"
      :disable-outside-pointer-events="true"
      @close-auto-focus="(e: Event) => {
        if (!e.defaultPrevented) {
          e.preventDefault()
          rootContext.triggerElement.value?.focus()
        }
      }"
      @pointer-down-outside="(e: any) => {
        const orig = e.detail.originalEvent
        const isRightClick = orig.button === 2 || (orig.button === 0 && orig.ctrlKey)
        if (isRightClick) e.preventDefault()
      }"
      @focus-outside="(e: Event) => e.preventDefault()"
    >
      <slot />
    </DrawerContentImpl>

    <DrawerContentImpl
      v-else
      :ref="forwardRef"
      v-bind="{ ...props, ...emitsAsProps, ...$attrs }"
      :trap-focus="false"
      :disable-outside-pointer-events="false"
      @close-auto-focus="(e: Event) => {
        if (!e.defaultPrevented) {
          if (!hasInteractedOutside) rootContext.triggerElement.value?.focus()
          e.preventDefault()
        }
        hasInteractedOutside = false
        hasPointerDownOutside = false
      }"
      @interact-outside="(e: any) => {
        if (!e.defaultPrevented) {
          hasInteractedOutside = true
          if (e.detail.originalEvent.type === 'pointerdown')
            hasPointerDownOutside = true
        }
        const target = e.target as HTMLElement
        if (rootContext.triggerElement.value?.contains(target)) e.preventDefault()
        if (e.detail.originalEvent.type === 'focusin' && hasPointerDownOutside) e.preventDefault()
      }"
    >
      <slot />
    </DrawerContentImpl>
  </Presence>
</template>
