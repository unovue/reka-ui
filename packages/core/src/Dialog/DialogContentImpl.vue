<script lang="ts">
import type {
  DismissableLayerEmits,
  DismissableLayerProps,
} from '@/DismissableLayer'
import { useContentId, useContentMounted, useForwardExpose, useId } from '@/shared'

export type DialogContentImplEmits = DismissableLayerEmits & {
  /**
   * Event handler called when auto-focusing on open.
   * Can be prevented.
   */
  openAutoFocus: [event: Event]
  /**
   * Event handler called when auto-focusing on close.
   * Can be prevented.
   */
  closeAutoFocus: [event: Event]
}

export interface DialogContentImplProps extends DismissableLayerProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling transition with Vue native transition or other animation libraries.
   */
  forceMount?: boolean
  /**
   * When `true`, focus cannot escape the `Content` via keyboard,
   * pointer, or a programmatic focus.
   * @defaultValue false
   */
  trapFocus?: boolean
}
</script>

<script setup lang="ts">
import { isClient } from '@vueuse/shared'
import { onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { DismissableLayer } from '@/DismissableLayer'
import { FocusScope } from '@/FocusScope'
import { getOpenState } from '@/Menu/utils'
import { injectDialogRootContext } from './DialogRoot.vue'
import { recordFocusBeforeOpen, useWarning } from './utils'

const props = defineProps<DialogContentImplProps & {
  /** Whether the content is present, including while it animates out. */
  present?: boolean
}>()
const emits = defineEmits<DialogContentImplEmits>()

const rootContext = injectDialogRootContext()
const { forwardRef, currentElement: contentElement } = useForwardExpose()

useContentId(rootContext, contentElement)
useContentMounted(rootContext, contentElement)
rootContext.titleId ||= useId(undefined, 'reka-dialog-title')
rootContext.descriptionId ||= useId(undefined, 'reka-dialog-description')

onMounted(() => {
  rootContext.contentElement = contentElement
})

// Record where focus was on every open, before the content moves it: a content kept
// mounted (`unmountOnHide: false`) sets up only once. The trigger ref is left alone, so
// it stays the fallback when that element has left the DOM.
watch(rootContext.open, (open) => {
  if (open && isClient)
    recordFocusBeforeOpen(rootContext, contentElement.value)
}, { immediate: true, flush: 'sync' })

// The root outlives this content, so hand it back an empty ref: the computed above
// keeps this instance (and its detached element) reachable for as long as it is stored.
onUnmounted(() => {
  if (rootContext.contentElement === contentElement)
    rootContext.contentElement = shallowRef()
})

if (process.env.NODE_ENV !== 'production') {
  useWarning({
    titleName: 'DialogTitle',
    contentName: 'DialogContent',
    componentLink: 'dialog.html#title',
    ids: rootContext,
    contentElement,
  })
}
</script>

<template>
  <FocusScope
    as-child
    loop
    :trapped="props.trapFocus"
    :present="props.present"
    @mount-auto-focus="emits('openAutoFocus', $event)"
    @unmount-auto-focus="emits('closeAutoFocus', $event)"
  >
    <DismissableLayer
      :id="rootContext.contentId"
      :ref="forwardRef"
      :as="as"
      :as-child="asChild"
      :present="rootContext.open.value && props.present"
      :disable-outside-pointer-events="disableOutsidePointerEvents"
      role="dialog"
      :aria-describedby="rootContext.descriptionId"
      :aria-labelledby="rootContext.titleId"
      :data-state="getOpenState(rootContext.open.value)"
      :data-nested-dialog-open="rootContext.nestedOpenDialogCount.value > 0 ? '' : undefined"
      :style="{ '--nested-dialogs': rootContext.nestedOpenDialogCount.value }"
      v-bind="$attrs"
      @dismiss="rootContext.onOpenChange(false)"
      @escape-key-down="emits('escapeKeyDown', $event)"
      @focus-outside="emits('focusOutside', $event)"
      @interact-outside="emits('interactOutside', $event)"
      @pointer-down-outside="emits('pointerDownOutside', $event)"
    >
      <slot />
    </DismissableLayer>
  </FocusScope>
</template>
