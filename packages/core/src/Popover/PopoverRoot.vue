<script lang="ts">
import type { Ref } from 'vue'
import { createRekaContext, defineReactiveIds } from '@/shared'

export interface PopoverRootProps {
  /**
   * The open state of the popover when it is initially rendered. Use when you do not need to control its open state.
   */
  defaultOpen?: boolean
  /**
   * The controlled open state of the popover.
   */
  open?: boolean
  /**
   * The modality of the popover. When set to true, interaction with outside elements will be disabled and only popover content will be visible to screen readers.
   *
   * @defaultValue false
   */
  modal?: boolean
  /**
   * When set to `false`, the popover content will not be unmounted when closed, but instead hidden with CSS. <br>
   * Useful when you want to keep the state of the content, or to improve performance by not remounting it on every open.
   * @defaultValue true
   */
  unmountOnHide?: boolean
}
export type PopoverRootEmits = {
  /**
   * Event handler called when the open state of the popover changes.
   */
  'update:open': [value: boolean]
}

export interface PopoverRootContext {
  triggerElement: Ref<HTMLElement | undefined>
  triggerId: string
  contentId: string
  open: Ref<boolean>
  modal: Ref<boolean>
  unmountOnHide: Ref<boolean>
  onOpenChange: (value: boolean) => void
  onOpenToggle: () => void
  hasCustomAnchor: Ref<boolean>
}

export const [injectPopoverRootContext, providePopoverRootContext]
  = createRekaContext<PopoverRootContext>('PopoverRoot')
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { onDeactivated, ref, toRefs } from 'vue'
import { PopperRoot } from '@/Popper'

const props = withDefaults(defineProps<PopoverRootProps>(), {
  defaultOpen: false,
  open: undefined,
  modal: false,
  unmountOnHide: true,
})
const emit = defineEmits<PopoverRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current open state */
    open: typeof open.value
    /** Close the popover */
    close: () => void
  }) => any
}>()

const { modal, unmountOnHide } = toRefs(props)

const open = useVModel(props, 'open', emit, {
  defaultValue: props.defaultOpen,
  passive: (props.open === undefined) as false,
}) as Ref<boolean>

const triggerElement = ref<HTMLElement>()
const hasCustomAnchor = ref(false)

// A `KeepAlive` page keeps the content teleported and open, anchored to a trigger out of the document.
onDeactivated(() => {
  if (open.value)
    open.value = false
})

providePopoverRootContext(defineReactiveIds({
  contentId: '',
  triggerId: '',
  modal,
  open,
  unmountOnHide,
  onOpenChange: (value) => {
    open.value = value
  },
  onOpenToggle: () => {
    open.value = !open.value
  },
  triggerElement,
  hasCustomAnchor,
}, ['triggerId', 'contentId']))
</script>

<template>
  <PopperRoot scope="popover">
    <slot
      :open="open"
      :close="() => open = false"
    />
  </PopperRoot>
</template>
