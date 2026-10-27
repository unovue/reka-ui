<script lang="ts">
import type { ComponentPublicInstance, Ref } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import { useCollection } from '@/Collection'
import { useForwardElement } from '@/shared'

export interface ToastViewportProps extends PrimitiveProps {
  /**
   * The keys to use as the keyboard shortcut that will move focus to the toast viewport.
   * @defaultValue ['F8']
   */
  hotkey?: string[]
  /**
   * An author-localized label for the toast viewport to provide context for screen reader users
   * when navigating page landmarks. The available `{hotkey}` placeholder will be replaced for you.
   * Alternatively, you can pass in a custom function to generate the label.
   * @defaultValue 'Notifications ({hotkey})'
   */
  label?: string | ((hotkey: string) => string)
}
</script>

<script setup lang="ts">
import { unrefElement } from '@vueuse/core'
import { mergeProps, ref } from 'vue'
import { DismissableLayerBranch } from '@/DismissableLayer'
import { Primitive } from '@/Primitive'
import FocusProxy from './FocusProxy.vue'
import { injectToastProviderContext } from './ToastProvider.vue'
import { useToastViewport } from './useToast'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<ToastViewportProps>(), {
  hotkey: () => ['F8'], // from VIEWPORT_DEFAULT_HOTKEY
  label: 'Notifications ({hotkey})',
  as: 'ol',
})

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const { CollectionSlot, getItems } = useCollection()
const providerContext = injectToastProviderContext()
const headFocusProxyRef = ref<HTMLElement>()
const tailFocusProxyRef = ref<HTMLElement>()

// Hotkey, pause on hover / focus / window blur, the expanded state and the
// reversed tab order live in the composable; the focus proxies and the
// dismissable-layer branch stay here.
const { hasToasts, region, viewport, onHeadProxyFocus, onTailProxyFocus } = useToastViewport({
  providerContext,
  viewportElement: currentElement as Ref<HTMLElement | undefined>,
  hotkey: props.hotkey,
  label: () => props.label,
  getToasts: () => getItems().map(i => i.ref),
  headFocusProxy: headFocusProxyRef,
  tailFocusProxy: tailFocusProxyRef,
})
</script>

<template>
  <DismissableLayerBranch v-bind="region.attrs.value">
    <FocusProxy
      v-if="hasToasts"
      :ref="(node: Element | ComponentPublicInstance | null) => {
        if (!node) return undefined
        headFocusProxyRef = unrefElement(node as ComponentPublicInstance) as HTMLElement
        return undefined
      }"
      @focus-from-outside-viewport="onHeadProxyFocus"
    />
    <CollectionSlot>
      <Primitive
        v-bind="mergeProps(viewport.attrs.value, $attrs)"
        :ref="forwardRef"
        :as="as"
        :as-child="asChild"
      >
        <slot />
      </Primitive>
    </CollectionSlot>
    <FocusProxy
      v-if="hasToasts"
      :ref="(node: Element | ComponentPublicInstance | null) => {
        if (!node) return undefined
        tailFocusProxyRef = unrefElement(node as ComponentPublicInstance) as HTMLElement
        return undefined
      }"
      @focus-from-outside-viewport="onTailProxyFocus"
    />
  </DismissableLayerBranch>
</template>
