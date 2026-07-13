<script lang="ts">
import type { Ref } from 'vue'
import { createContext, resolveElement } from '@/shared'

export interface DialogRootProps {
  /** The controlled open state of the dialog. Can be binded as `v-model:open`. */
  open?: boolean
  /** The open state of the dialog when it is initially rendered. Use when you do not need to control its open state. */
  defaultOpen?: boolean
  /**
   * The modality of the dialog When set to `true`, <br>
   * interaction with outside elements will be disabled and only dialog content will be visible to screen readers.
   */
  modal?: boolean
  /**
   * The element (or CSS selector) that contains this dialog:
   * - `DialogPortal` teleports into it,
   * - `DialogOverlay` positions against it, and scrolling is locked on it.
   * Falls back to `document.body` if `undefined'.
   */
  container?: HTMLElement | string | null
  /**
   * When set to `false`, the dialog content will not be unmounted when closed, but instead hidden with CSS. <br>
   * Useful for SEO or when you want to improve performance by not remounting the component on every open.
   * @defaultValue true
   */
  unmountOnHide?: boolean
}

export type DialogRootEmits = {
  /** Event handler called when the open state of the dialog changes. */
  'update:open': [value: boolean]
}

export interface DialogRootContext {
  open: Readonly<Ref<boolean>>
  modal: Ref<boolean>
  container: Ref<HTMLElement | string | null | undefined>
  unmountOnHide: Ref<boolean>
  openModal: () => void
  onOpenChange: (value: boolean) => void
  onOpenToggle: () => void
  triggerElement: Ref<HTMLElement | undefined>
  contentElement: Ref<HTMLElement | undefined>
  contentId: string
  titleId: string
  descriptionId: string
}

export const DialogAttributes = {
  state: 'data-state',
  contained: 'data-contained',
} as const

export const [injectDialogRootContext, provideDialogRootContext]
  = createContext<DialogRootContext>('DialogRoot')
</script>

<script setup lang="ts">
import { isClient, useVModel } from '@vueuse/core'
import { ref, toRefs, watchEffect } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<DialogRootProps>(), {
  open: undefined,
  defaultOpen: false,
  modal: true,
  container: undefined,
  unmountOnHide: true,
})
const emit = defineEmits<DialogRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current open state */
    open: typeof open.value
    /** Close the dialog */
    close: () => void
  }) => any
}>()

const open = useVModel(props, 'open', emit, {
  defaultValue: props.defaultOpen,
  passive: (props.open === undefined) as false,
}) as Ref<boolean>

const triggerElement = ref<HTMLElement>()
const contentElement = ref<HTMLElement>()
const { modal, container, unmountOnHide } = toRefs(props)

provideDialogRootContext({
  open,
  modal,
  container,
  unmountOnHide,
  openModal: () => {
    open.value = true
  },
  onOpenChange: (value) => {
    open.value = value
  },
  onOpenToggle: () => {
    open.value = !open.value
  },
  contentId: '',
  titleId: '',
  descriptionId: '',
  triggerElement,
  contentElement,
})

if (import.meta.env.DEV && isClient) {
  watchEffect(() => {
    const container = props.container
    if (container === undefined)
      return

    const el = resolveElement(container)
    if (el === document.body)
      console.warn('Warning: `container` resolves to `document.body` - omit the prop for a page modal.')
    else if (el == null)
      console.warn('Warning: `container` is currently unresolved. This is expected behavior for pending template refs; otherwise, your string selector is invalid or explicitly null.')
  })
}
</script>

<template>
  <slot
    :open="open"
    :close="() => open = false"
  />
</template>
