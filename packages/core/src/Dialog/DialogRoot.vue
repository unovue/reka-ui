<script lang="ts">
import type { Ref } from 'vue'
import { createRekaContext, defineReactiveIds } from '@/shared'

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
  unmountOnHide: Ref<boolean>
  openModal: () => void
  onOpenChange: (value: boolean) => void
  onOpenToggle: () => void
  triggerElement: Ref<HTMLElement | undefined>
  contentElement: Ref<HTMLElement | undefined>
  /** Whether a `DialogOverlay` is present, which is what locks body scroll. */
  overlayPresent: Ref<boolean>
  contentId: string
  titleId: string
  descriptionId: string
  /** How many dialogs nested in this one are open, at any depth. */
  nestedOpenDialogCount: Ref<number>
  /**
   * Called by a dialog nested in this one with the number of open dialogs it
   * stands for: itself and the ones nested in it, or `0` once it is closed.
   */
  onNestedOpenChange: (id: symbol, count: number) => void
}

export const [injectDialogRootContext, provideDialogRootContext]
  = createRekaContext<DialogRootContext>('DialogRoot')
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { onBeforeUnmount, ref, toRefs, watch } from 'vue'
import { useAgentRegistration } from '@/shared/useAgentRegistration'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<DialogRootProps>(), {
  open: undefined,
  defaultOpen: false,
  modal: true,
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
const overlayPresent = ref(false)
const { modal, unmountOnHide } = toRefs(props)

// Nested dialogs: each open dialog reports to the dialog it is nested in, which
// adds up its nested dialogs and passes the total on, so a dialog knows how
// many dialogs are open on top of it.
const parentContext = injectDialogRootContext(null)
const nestedOpenDialogCount = ref(0)
let nestedOpenCounts: Map<symbol, number> | undefined

if (parentContext) {
  const nestedId = Symbol('nestedDialog')
  watch(
    [open, nestedOpenDialogCount],
    ([isOpen, nestedCount]) => parentContext.onNestedOpenChange(nestedId, isOpen ? nestedCount + 1 : 0),
    { immediate: true },
  )
  onBeforeUnmount(() => parentContext.onNestedOpenChange(nestedId, 0))
}

const agentContext = provideDialogRootContext(defineReactiveIds({
  open,
  modal,
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
  overlayPresent,
  nestedOpenDialogCount,
  onNestedOpenChange: (id, count) => {
    nestedOpenCounts ??= new Map()
    if (count > 0)
      nestedOpenCounts.set(id, count)
    else
      nestedOpenCounts.delete(id)
    let total = 0
    for (const nestedCount of nestedOpenCounts.values())
      total += nestedCount
    nestedOpenDialogCount.value = total
  },
}, ['contentId']))
useAgentRegistration('dialog', agentContext, props)
</script>

<template>
  <slot
    :open="open"
    :close="() => open = false"
  />
</template>
