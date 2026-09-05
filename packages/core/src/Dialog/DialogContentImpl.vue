<script lang="ts">
import type {
  DismissableLayerEmits,
  DismissableLayerProps,
} from '@/DismissableLayer'
import { getActiveElement, useForwardExpose } from '@/shared'

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
import { mergeProps, onMounted } from 'vue'
import { DismissableLayer } from '@/DismissableLayer'
import { FocusScope } from '@/FocusScope'
import { injectDialogRootContext } from './DialogRoot.vue'
import { getDialogContentSurface } from './useDialog'
import { useWarning } from './utils'

const props = defineProps<DialogContentImplProps & {
  /** Whether the content is currently visible. Forwarded to `FocusScope` and
   * `DismissableLayer` so a force-mounted dialog (`unmountOnHide: false`)
   * auto-focuses on show and leaves the layer/scope stacks while hidden. */
  present?: boolean
}>()
const emits = defineEmits<DialogContentImplEmits>()

const rootContext = injectDialogRootContext()
const { forwardRef, currentElement: contentElement } = useForwardExpose()

// id/role/aria-labelledby/aria-describedby/data-state come from the shared
// surface builder (single source with `useDialog()`); the FocusScope +
// DismissableLayer wrappers, `@dismiss` forwarding and the a11y warnings stay
// here. `$attrs` merges AFTER the surface so a consumer's
// `:aria-describedby="undefined"` still wins.
const content = getDialogContentSurface(rootContext)

onMounted(() => {
  rootContext.contentElement = contentElement

  // Preserve the `DialogTrigger` element in case it was triggered programmatically
  if (getActiveElement() !== document.body)
    rootContext.triggerElement.value = getActiveElement() as HTMLElement
})

if (process.env.NODE_ENV !== 'production') {
  useWarning({
    titleName: 'DialogTitle',
    contentName: 'DialogContent',
    componentLink: 'dialog.html#title',
    titleId: rootContext.titleId,
    descriptionId: rootContext.descriptionId,
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
      :ref="forwardRef"
      :as="as"
      :as-child="asChild"
      :present="props.present"
      :disable-outside-pointer-events="disableOutsidePointerEvents"
      v-bind="mergeProps(content.attrs.value, $attrs)"
      @dismiss="(details) => rootContext.onOpenChange(false, details.reason, details.event)"
      @escape-key-down="emits('escapeKeyDown', $event)"
      @focus-outside="emits('focusOutside', $event)"
      @interact-outside="emits('interactOutside', $event)"
      @pointer-down-outside="emits('pointerDownOutside', $event)"
    >
      <slot />
    </DismissableLayer>
  </FocusScope>
</template>
