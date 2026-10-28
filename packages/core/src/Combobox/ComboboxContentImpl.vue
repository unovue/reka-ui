<script lang="ts">
import type { Ref } from 'vue'
import type { DismissableLayerDismissDetails, DismissableLayerEmits, DismissableLayerProps, FocusOutsideEvent, PointerDownOutsideEvent } from '@/DismissableLayer'
import type { PopperContentProps } from '@/Popper'

import { createContext, getActiveElement, useFocusGuards, useForwardElement, useForwardProps, useHideOthers } from '@/shared'
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
}

export const [injectComboboxContentContext, provideComboboxContentContext]
  = createContext<{
    position: Ref<'inline' | 'popper'>
  }>('ComboboxContent')
</script>

<script setup lang="ts">
import type { WrapperSpec } from '@/shared/splitWrapperAttrs'
import { refAutoReset } from '@vueuse/shared'
import { computed, getCurrentInstance, mergeProps, nextTick, onMounted, onUnmounted, ref, toRefs, watch } from 'vue'
import { useCollectionSlot } from '@/Collection'
import { DISMISSABLE_LAYER_WRAPPER, dismissableLayerOptions, useDismissableLayer } from '@/DismissableLayer/useDismissableLayer'
import { FOCUS_SCOPE_WRAPPER, focusScopeOptions, useFocusScope } from '@/FocusScope/useFocusScope'
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
    const { present: _, ...forwardedProps } = props
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

// Handle case where input position within the content
const isInputWithinContent = ref(false)
onMounted(() => {
  if (rootContext.inputElement.value) {
    isInputWithinContent.value = currentElement.value.contains(rootContext.inputElement.value)
    if (props.present && isInputWithinContent.value) {
      rootContext.inputElement.value.focus()
    }
  }
})

watch(() => props.present, async (isPresent, wasPresent) => {
  if (isPresent || !wasPresent)
    return

  const activeElement = getActiveElement()
  if (!activeElement || !currentElement.value.contains(activeElement))
    return

  await nextTick()
  rootContext.triggerElement.value?.focus()
})

onUnmounted(() => {
  rootContext.onContentUnmount(contentId)
  const activeElement = getActiveElement()
  if (isInputWithinContent.value && (!activeElement || activeElement === document.body)) {
    rootContext.triggerElement.value?.focus()
  }
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
