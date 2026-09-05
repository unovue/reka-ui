<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { BaseChangeReason, ChangeEventDetails, DisclosureState } from '@/shared'
import { createContext, useForwardExpose, useId } from '@/shared'

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
  /** `<baseId>-content`, populated up-front by `useTooltip()` (#2723) — never back-filled by a descendant. */
  contentId: string
  open: ComputedRef<boolean>
  /** `'open' | 'closed'` — the disclosure axis of `data-state` (#2823). */
  stateAttribute: Ref<DisclosureState>
  /** `true` only while open AND that open came from the delay timer; bound as `data-delayed`. */
  isDelayed: Ref<boolean>
  /**
   * The provider's grace-area transit flag (`TooltipContentHoverable` publishes
   * `useGraceArea`'s `isPointerInTransit` on the provider); the trigger's
   * `pointermove` does not open while it is `true`. Resolved by the root.
   */
  isPointerInTransit: Ref<boolean>
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
import { watch } from 'vue'
import { PopperRoot } from '@/Popper'
import { injectTooltipProviderContext } from './TooltipProvider.vue'
import { useTooltip } from './useTooltip'
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

// The composable owns the controlled/uncontrolled `open` model (every write goes
// through its `setState` so `beforeUpdate:open` can cancel it), the delayed-open
// timer and the context. The shell's job is the provider coupling: each root
// prop falls back to the `TooltipProvider` value, and the provider's skip-delay
// and grace-area transit flags are handed in as getters (the transit ref is
// REASSIGNED on the provider context by `TooltipContentHoverable`, so it must be
// read through the property on every access, never snapshotted). `useId`
// (ConfigProvider/SSR-aware) stays here and seeds the content id.
const { open, context } = useTooltip({
  open: () => props.open,
  defaultOpen: props.defaultOpen,
  delayDuration: () => props.delayDuration ?? providerContext.delayDuration.value,
  isOpenDelayed: () => providerContext.isOpenDelayed.value,
  isPointerInTransit: () => providerContext.isPointerInTransitRef.value,
  disableHoverableContent: () => props.disableHoverableContent ?? providerContext.disableHoverableContent.value,
  disableClosingTrigger: () => props.disableClosingTrigger ?? providerContext.disableClosingTrigger.value,
  disabled: () => props.disabled ?? providerContext.disabled.value,
  ignoreNonKeyboardFocus: () => props.ignoreNonKeyboardFocus ?? providerContext.ignoreNonKeyboardFocus.value,
  baseId: useId(undefined, 'reka-tooltip'),
  emit,
})

// Provider coordination stays in the shell: an open arms the provider's
// skip-delay window and tells every other tooltip to close (`TOOLTIP_OPEN`).
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

provideTooltipRootContext(context)
</script>

<template>
  <PopperRoot>
    <slot :open="open" />
  </PopperRoot>
</template>
