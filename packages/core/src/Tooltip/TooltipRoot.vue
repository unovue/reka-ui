<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { BaseChangeReason, ChangeEventDetails, DisclosureState } from '@/shared'
import { createContext, disclosureState, useControllableState, useForwardExpose } from '@/shared'

/**
 * Why the tooltip's `open` state changed (#2828); the `reason` of `ChangeEventDetails`.
 *
 * - `trigger-hover` — the pointer entered the trigger (after the delay, or
 *   instantly while the provider skips it; `data-delayed` tells which).
 * - `trigger-leave` — the pointer left the trigger while hoverable content is disabled.
 * - `trigger-focus` / `trigger-blur` — the trigger gained / lost focus.
 * - `trigger-press` — the trigger was pressed (unless `disableClosingTrigger`).
 * - `content-leave` — the pointer left the trigger/content grace area of hoverable content.
 * - `escape-key` / `outside-press` — dismissed by the `DismissableLayer`.
 */
export type TooltipOpenChangeReason
  = | 'trigger-hover'
    | 'trigger-leave'
    | 'trigger-focus'
    | 'trigger-blur'
    | 'trigger-press'
    | 'content-leave'
    | 'escape-key'
    | 'outside-press'

export interface TooltipRootProps {
  /**
   * The open state of the tooltip when it is initially rendered.
   * Use when you do not need to control its open state.
   */
  defaultOpen?: boolean
  /**
   * The controlled open state of the tooltip.
   */
  open?: boolean
  /**
   * Override the duration given to the `Provider` to customise
   * the open delay for a specific tooltip.
   *
   * @defaultValue 700
   */
  delayDuration?: number
  /**
   * Prevents Tooltip.Content from remaining open when hovering.
   * Disabling this has accessibility consequences. Inherits
   * from Tooltip.Provider.
   */
  disableHoverableContent?: boolean
  /**
   * When `true`, clicking on trigger will not close the content.
   * @defaultValue false
   */
  disableClosingTrigger?: boolean
  /**
   * When `true`, disable tooltip
   * @defaultValue false
   */
  disabled?: boolean
  /**
   * Prevent the tooltip from opening if the focus did not come from
   * the keyboard by matching against the `:focus-visible` selector.
   * This is useful if you want to avoid opening it when switching
   * browser tabs or closing a dialog.
   * @defaultValue false
   */
  ignoreNonKeyboardFocus?: boolean
}

export type TooltipRootEmits = {
  /** Event handler called before the open state of the tooltip changes; `details.cancel()` keeps the current state. */
  'beforeUpdate:open': [value: boolean, details: ChangeEventDetails<TooltipOpenChangeReason>]
  /** Event handler called when the open state of the tooltip changes. */
  'update:open': [value: boolean, details: ChangeEventDetails<TooltipOpenChangeReason>]
}

export interface TooltipContext {
  contentId: string
  open: ComputedRef<boolean>
  /** `'open' | 'closed'` — the disclosure axis of `data-state` (#2823). */
  stateAttribute: Ref<DisclosureState>
  /** `true` only while open AND that open came from the delay timer; bound as `data-delayed`. */
  isDelayed: Ref<boolean>
  trigger: Ref<HTMLElement | undefined>
  onTriggerChange: (trigger: HTMLElement | undefined) => void
  /** Pointer entered the trigger: opens with reason `trigger-hover`, delayed unless the provider is skipping the delay. */
  onTriggerEnter: (event?: PointerEvent) => void
  /** Pointer left the trigger: closes with reason `trigger-leave` when hoverable content is disabled, else only cancels a pending delayed open. */
  onTriggerLeave: (event?: PointerEvent) => void
  /** Opens instantly. Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  onOpen: (reason?: TooltipOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Closes and cancels a pending delayed open. Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  onClose: (reason?: TooltipOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  disableHoverableContent: Ref<boolean>
  disableClosingTrigger: Ref<boolean>
  disabled: Ref<boolean>
  ignoreNonKeyboardFocus: Ref<boolean>
}

export const [injectTooltipRootContext, provideTooltipRootContext]
  = createContext<TooltipContext>('TooltipRoot')
</script>

<script setup lang="ts">
import { useTimeoutFn } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { PopperRoot } from '@/Popper'
import { injectTooltipProviderContext } from './TooltipProvider.vue'
import { TOOLTIP_OPEN } from './utils'

const props = withDefaults(defineProps<TooltipRootProps>(), {
  defaultOpen: false,
  open: undefined,
  delayDuration: undefined,
  disableHoverableContent: undefined,
  disableClosingTrigger: undefined,
  disabled: undefined,
  ignoreNonKeyboardFocus: undefined,
})

const emit = defineEmits<TooltipRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current open state */
    open: typeof open.value
  }) => any
}>()

useForwardExpose()
const providerContext = injectTooltipProviderContext()

const disableHoverableContent = computed(() => props.disableHoverableContent ?? providerContext.disableHoverableContent.value)
const disableClosingTrigger = computed(() => props.disableClosingTrigger ?? providerContext.disableClosingTrigger.value)
const disableTooltip = computed(() => props.disabled ?? providerContext.disabled.value)

const delayDuration = computed(() => props.delayDuration ?? providerContext.delayDuration.value)
const ignoreNonKeyboardFocus = computed(() => props.ignoreNonKeyboardFocus ?? providerContext.ignoreNonKeyboardFocus.value)

// Every write to `open` — hover timer, focus/blur, press, grace-area exit,
// dismiss — goes through one `setState`, so `beforeUpdate:open` can cancel any
// of them and `update:open` always carries the reason (#2828).
const { state: open, setState } = useControllableState<boolean, TooltipOpenChangeReason>({
  prop: () => props.open,
  defaultValue: props.defaultOpen,
  name: 'open',
  emit,
})

watch(open, (isOpen) => {
  if (!providerContext.onClose)
    return
  if (isOpen) {
    providerContext.onOpen()
    // as `onChange` is called within a lifecycle method we
    // avoid dispatching via `dispatchDiscreteCustomEvent`.
    document.dispatchEvent(new CustomEvent(TOOLTIP_OPEN))
  }
  else {
    providerContext.onClose()
  }
})

const wasOpenDelayedRef = ref(false)
const trigger = ref<HTMLElement>()

const stateAttribute = computed<DisclosureState>(() => disclosureState(open.value))
const isDelayed = computed(() => open.value && wasOpenDelayedRef.value)

// The `pointermove` that armed the delay timer, handed to `update:open` when it fires.
let delayedOpenEvent: PointerEvent | undefined

const { start: startTimer, stop: clearTimer } = useTimeoutFn(() => {
  const event = delayedOpenEvent
  delayedOpenEvent = undefined
  // Flag before the write so `isDelayed` is right on the same tick `open` flips;
  // roll it back when the open was cancelled (or was a no-op).
  wasOpenDelayedRef.value = true
  if (!setState(true, 'trigger-hover', event))
    wasOpenDelayedRef.value = false
}, delayDuration, { immediate: false })

function handleOpen(reason?: TooltipOpenChangeReason | BaseChangeReason, event?: Event) {
  clearTimer()
  wasOpenDelayedRef.value = false
  return setState(true, reason, event)
}
function handleClose(reason?: TooltipOpenChangeReason | BaseChangeReason, event?: Event) {
  // Cancel a pending delayed open first; a cancelled close then simply stays open.
  clearTimer()
  return setState(false, reason, event)
}
function handleDelayedOpen(event?: PointerEvent) {
  delayedOpenEvent = event
  startTimer()
}

provideTooltipRootContext({
  contentId: '',
  open,
  stateAttribute,
  isDelayed,
  trigger,
  onTriggerChange(el) {
    trigger.value = el
  },
  onTriggerEnter(event) {
    if (providerContext.isOpenDelayed.value)
      handleDelayedOpen(event)
    else handleOpen('trigger-hover', event)
  },
  onTriggerLeave(event) {
    if (disableHoverableContent.value) {
      handleClose('trigger-leave', event)
    }
    else {
      // Clear the timer in case the pointer leaves the trigger before the tooltip is opened.
      clearTimer()
    }
  },
  onOpen: handleOpen,
  onClose: handleClose,
  disableHoverableContent,
  disableClosingTrigger,
  disabled: disableTooltip,
  ignoreNonKeyboardFocus,
})
</script>

<template>
  <PopperRoot>
    <slot :open="open" />
  </PopperRoot>
</template>
