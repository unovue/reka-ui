<script lang="ts">
import type { Ref } from 'vue'
import type { ComboboxInteractionType } from './useCombobox'
import type { DismissableLayerDismissDetails, DismissableLayerEmits, DismissableLayerProps, FocusOutsideEvent, PointerDownOutsideEvent } from '@/DismissableLayer'
import type { PopperContentProps } from '@/Popper'

import { createContext, getActiveElement, getOwnerDocument, useFocusGuards, useForwardElement, useForwardProps, useHideOthers } from '@/shared'
import { useBodyScrollLock } from '@/shared/useBodyScrollLock'

export type ComboboxContentImplEmits = DismissableLayerEmits

export interface ComboboxContentImplProps extends PopperContentProps, DismissableLayerProps {
  /**
   * The positioning mode to use, <br>
   * `inline` is the default and you can control the position using CSS. <br>
   * `popper` positions content in the same way as our other primitives, for example `Popover` or `DropdownMenu`.
   */
  position?: 'inline' | 'popper'
  /** When `true`, page scroll is locked while the content is open. */
  bodyLock?: boolean
  /**
   * When `true`, hides the content when there are no items matching the filter.
   * @defaultValue false
   */
  hideWhenEmpty?: boolean
  /**
   * The element to focus when the content opens (Base UI `initialFocus`).
   * - `undefined` (default): with the input inside the content, the input (the content itself when opened by
   *   touch, so no virtual keyboard opens); with the input outside, focus does not move.
   * - `true` / `null`: the first tabbable element in the content, else the content.
   * - `false`: focus does not move.
   * - an element: that element.
   * - a function: called with how the content was opened (`'mouse'`, `'touch'`, `'pen'`, `'keyboard'` or `''`);
   *   returns an element, `true` for the first tabbable element, or `false` / `undefined` to do nothing. Use it
   *   for an element inside the content, whose template ref is still empty when the prop is read.
   */
  initialFocus?: ComboboxFocusTarget
  /**
   * The element to focus when the content closes (Base UI `finalFocus`).
   * - `undefined` (default): `true` with the input inside the content, `false` with it outside.
   * - `true` / `null`: the trigger with the input inside the content, the input with it outside; only when focus
   *   was inside the content or lost with it.
   * - `false`: focus does not move.
   * - an element: that element.
   * - a function: called with how the content was closed; returns an element, `true` for the default, or
   *   `false` / `undefined` to do nothing.
   */
  finalFocus?: ComboboxFocusTarget
}

/** An `initialFocus` / `finalFocus` value of `ComboboxContent`. */
export type ComboboxFocusTarget
  = | boolean
    | HTMLElement
    | null
    | ((interactionType: ComboboxInteractionType) => boolean | HTMLElement | null | undefined | void)

export const [injectComboboxContentContext, provideComboboxContentContext]
  = createContext<{
    position: Ref<'inline' | 'popper'>
  }>('ComboboxContent')
</script>

<script setup lang="ts">
import type { WrapperSpec } from '@/shared/splitWrapperAttrs'
import { refAutoReset } from '@vueuse/shared'
import { computed, getCurrentInstance, mergeProps, nextTick, onMounted, onUnmounted, toRefs, watch } from 'vue'
import { useCollectionSlot } from '@/Collection'
import { DISMISSABLE_LAYER_WRAPPER, dismissableLayerOptions, useDismissableLayer } from '@/DismissableLayer/useDismissableLayer'
import { FOCUS_SCOPE_WRAPPER, focusScopeOptions, useFocusScope } from '@/FocusScope/useFocusScope'
import { getTabbableCandidates } from '@/FocusScope/utils'
import { injectListboxRootContext } from '@/Listbox/ListboxRoot.vue'
import { getListboxContentSurface } from '@/Listbox/useListbox'
import { PopperContent } from '@/Popper'
import { renderAs } from '@/Primitive/renderAs'
import { splitWrapperAttrs } from '@/shared/splitWrapperAttrs'
import { injectComboboxRootContext } from './ComboboxRoot.vue'
import { getComboboxContentSurface } from './useCombobox'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<ComboboxContentImplProps & { present?: boolean }>(), {
  position: 'inline',
  present: true,
  // Not cast to `false` when absent: `undefined` picks the Base UI default.
  initialFocus: undefined,
  finalFocus: undefined,
})
const emits = defineEmits<ComboboxContentImplEmits>()

const { position } = toRefs(props)
const rootContext = injectComboboxRootContext()
const contentId = Symbol('ComboboxContent')

watch(position, value => rootContext.onContentPositionChange(contentId, value), { immediate: true })

// `id` (`<baseId>-content`), `data-state` and `data-empty`.
const surface = getComboboxContentSurface(rootContext)

// The popper memoizes its subtree (#2639) so a position update does not
// re-render every item. A search change has to get through when the consumer
// filters the items itself (`filter: null`), so the search term is a memo key
// then. With the built-in filter each item follows its own filtered-out state:
// re-rendering the whole subtree per keystroke would re-render every item (a
// render-function parent forces its slotted children to update), so the search
// is left out.
const popperMemoDependencies = computed(() => {
  if (position.value !== 'popper')
    return undefined
  if (rootContext.filter.value)
    return []
  return [rootContext.filterSearch.value, rootContext.filterState.value.count]
})

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const scrollLocked = useBodyScrollLock(props.present && props.bodyLock)
watch([() => props.present, () => props.bodyLock], ([present, bodyLock]) => scrollLocked.value = present && bodyLock)
useFocusGuards(currentElement)
const ariaHiddenTarget = computed(() => props.present ? rootContext.parentElement.value : undefined)
useHideOthers(ariaHiddenTarget)

const pickedProps = computed(() => {
  if (props.position === 'popper') {
    const { present: _, initialFocus: _initialFocus, finalFocus: _finalFocus, ...forwardedProps } = props
    return forwardedProps
  }
  // Inline, the content renders its own element (`as` / `asChild`).
  return {}
})

const forwardedProps = useForwardProps(pickedProps)

const popperStyle = {
  // Ensure border-box for floating-ui calculations
  'boxSizing': 'border-box',
  '--reka-combobox-content-transform-origin':
        'var(--reka-popper-transform-origin)',
  '--reka-combobox-content-available-width':
        'var(--reka-popper-available-width)',
  '--reka-combobox-content-available-height':
        'var(--reka-popper-available-height)',
  '--reka-combobox-trigger-width': 'var(--reka-popper-anchor-width)',
  '--reka-combobox-trigger-height': 'var(--reka-popper-anchor-height)',
}

provideComboboxContentContext({ position })

// Focus on open and close, as Base UI's `Combobox.Popup` (`initialFocus` /
// `finalFocus`): the defaults depend on whether the input is inside the content.
const isShown = computed(() => props.present && rootContext.open.value)
let isInputInside = false

function contains(element: Element | null | undefined) {
  return !!element && !!currentElement.value?.contains(element)
}

/** Resolves a focus target: an element, `true` for the default, `undefined` for none. */
function resolveFocusTarget(target: ComboboxFocusTarget | undefined, fallback: boolean) {
  // Read once: the next change sets it again; a programmatic one leaves it unknown.
  const interactionType = rootContext.interactionType.value
  rootContext.interactionType.value = ''
  const value = typeof target === 'function' ? target(interactionType) : target === undefined ? fallback : target
  return { value: value === null ? true : value || undefined, interactionType }
}

// `false` from an open until its close has returned focus (once).
let hasReturnedFocus = true

function focusOnOpen() {
  hasReturnedFocus = false
  const content = currentElement.value as HTMLElement | undefined
  const input = rootContext.inputElement.value
  isInputInside = contains(input)
  const { value, interactionType } = resolveFocusTarget(props.initialFocus, isInputInside)
  if (!content || !value || contains(getActiveElement()))
    return
  let target: HTMLElement | undefined
  if (value instanceof HTMLElement)
    target = value
  else if (props.initialFocus === undefined)
    target = interactionType === 'touch' ? content : input
  else
    target = getTabbableCandidates(content)[0] ?? content
  target?.focus({ preventScroll: target === content })
}

function focusOnClose(focusWasInside: boolean) {
  if (hasReturnedFocus)
    return
  hasReturnedFocus = true
  const { value } = resolveFocusTarget(props.finalFocus, isInputInside)
  if (value instanceof HTMLElement)
    value.focus()
  // The default target, only when focus was inside the content or lost with it.
  else if (value && focusWasInside)
    (isInputInside ? rootContext.triggerElement.value : rootContext.inputElement.value)?.focus()
}

function isFocusInsideOrLost() {
  const activeElement = getActiveElement()
  return !activeElement || activeElement === getOwnerDocument(currentElement.value).body || contains(activeElement)
}

// After a tick: once this content's focus scope has paused an ancestor's trap
// (a Dialog around the combobox), and once `v-show` (a post-render effect too)
// has shown a kept-mounted content.
onMounted(async () => {
  if (!isShown.value)
    return
  await nextTick()
  if (isShown.value)
    focusOnOpen()
})

watch(isShown, async (shown) => {
  const focusWasInside = !shown && isFocusInsideOrLost()
  await nextTick()
  // Toggled back within the tick: the newer run decides.
  if (isShown.value !== shown)
    return
  if (shown)
    focusOnOpen()
  else
    focusOnClose(focusWasInside)
}, { flush: 'post' })

onUnmounted(() => {
  rootContext.onContentUnmount(contentId)
  // Unmounted while open: focus inside the content is lost with it.
  focusOnClose(isFocusInsideOrLost())
})

function isEventTargetWithinCombobox(target: EventTarget | null) {
  if (rootContext.parentElement.value?.contains(target as Node))
    return true

  // A `<label>` associated (via `for`) with an element inside the combobox forwards its
  // click/focus to that control, so interacting with it should not dismiss the content.
  // Without this, clicking such a label while open dismisses on `pointerdown` and the
  // forwarded click/focus immediately re-opens it.
  const label = target instanceof Element ? target.closest('label') : null
  const control = label?.control
  return !!control && !!rootContext.parentElement.value?.contains(control)
}

const popperContentEvents = {
  placed: () => rootContext.onContentPlaced(contentId),
}

// The content was `<ListboxContent as-child>` around `<FocusScope as-child>`
// around `<DismissableLayer as-child>` around its element (or
// `PopperContent`); they are composables on that element now. The listbox
// content's surface and collection root. Its roving tabindex stays in the
// render, where a consumer `tabindex` or an as-child element's binding wins, as
// it did under `ListboxContent as-child`. It does not flip: the input keeps the
// listbox unfocusable, so the value stays '-1' and a highlight change does not
// re-render the content.
const instance = getCurrentInstance()!
const isClickFocus = refAutoReset(false, 10)
const listboxRootContext = injectListboxRootContext()
const listboxSurface = getListboxContentSurface(listboxRootContext, { isClickFocus })
useCollectionSlot(currentElement)

// Each `*Wrapper` is what that component received, merged as the template
// merged it: the content's attrs fell through over the root
// `ListboxContent`'s bindings, and each as-child slot merged what its
// component rendered under the next one's bindings. So consumer attrs named
// after their props and events still configure them, and never render.
// (`$attrs` read through the instance proxy tracks.)
const LISTBOX_CONTENT_WRAPPER: WrapperSpec = { props: { as: false, asChild: true }, emits: [] }
const listboxContentWrapper = computed(() => splitWrapperAttrs(mergeProps({ asChild: true }, instance.proxy!.$attrs), LISTBOX_CONTENT_WRAPPER))
const focusScopeWrapper = computed(() => splitWrapperAttrs(mergeProps(mergeProps(listboxContentWrapper.value.rest, listboxSurface.attrs.value), {
  asChild: true,
  present: props.present,
  onMountAutoFocus: (event: Event) => event.preventDefault(),
  onUnmountAutoFocus: (event: Event) => event.preventDefault(),
}), FOCUS_SCOPE_WRAPPER))
const scope = useFocusScope(focusScopeOptions(currentElement, () => focusScopeWrapper.value))
const layerWrapper = computed(() => splitWrapperAttrs(mergeProps(mergeProps(scope.attrs(), focusScopeWrapper.value.rest), {
  asChild: true,
  present: props.present,
  disableOutsidePointerEvents: props.disableOutsidePointerEvents,
  backdropCutout: rootContext.parentElement.value,
  onDismiss: ({ reason, event }: DismissableLayerDismissDetails) => rootContext.onOpenChange(false, reason, event),
  onFocusOutside: (event: FocusOutsideEvent) => {
    // if focusing inside the combobox (or a label tied to it), prevent dismiss
    if (isEventTargetWithinCombobox(event.target))
      event.preventDefault()
    emits('focusOutside', event)
  },
  onInteractOutside: (event: PointerDownOutsideEvent | FocusOutsideEvent) => emits('interactOutside', event),
  onEscapeKeyDown: (event: KeyboardEvent) => emits('escapeKeyDown', event),
  onPointerDownOutside: (event: PointerDownOutsideEvent) => {
    // if clicking inside the combobox (or a label tied to it), prevent dismiss
    if (isEventTargetWithinCombobox(event.target))
      event.preventDefault()
    emits('pointerDownOutside', event)
  },
}), DISMISSABLE_LAYER_WRAPPER))
const layer = useDismissableLayer(dismissableLayerOptions(currentElement, () => layerWrapper.value))
</script>

<template>
  <component
    :is="position === 'popper' ? PopperContent : renderAs(as, asChild)"
    v-bind="mergeProps(mergeProps(layer.attrs(), layerWrapper.rest), { ...$attrs, ...forwardedProps, ...surface.attrs.value })"
    :ref="forwardRef"
    :memo-dependencies="popperMemoDependencies"
    :style="{
      // flex layout so we can place the scroll buttons properly
      // When hideWhenEmpty is true, hide the content when no items match
      display: (props.hideWhenEmpty && surface.state.value.empty) ? 'none' : 'flex',
      flexDirection: 'column',
      // reset the outline by default as the content MAY get focused
      outline: 'none',
      ...(position === 'popper' ? popperStyle : {}),
    }"
    v-on="position === 'popper' ? popperContentEvents : {}"
  >
    <slot />
  </component>
</template>
