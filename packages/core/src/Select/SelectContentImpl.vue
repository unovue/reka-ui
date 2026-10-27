<script lang="ts">
import type {
  ComponentPublicInstance,
  Ref,
} from 'vue'
import type { DismissableLayerDismissDetails, DismissableLayerDismissReason, DismissableLayerProps, PointerDownOutsideEvent } from '@/DismissableLayer'
import type { PopperContentProps } from '@/Popper'
import type { AcceptableValue } from '@/shared/types'
import { useCollection } from '@/Collection'
import {
  createContext,
  useFocusGuards,
  useForwardElement,
  useForwardProps,
  useHideOthers,
} from '@/shared'
import { useBodyScrollLock } from '@/shared/useBodyScrollLock'

export interface SelectContentContext {
  content?: Ref<HTMLElement | undefined>
  viewport?: Ref<HTMLElement | undefined>
  onViewportChange: (node: HTMLElement | undefined) => void
  itemRefCallback: (
    node: HTMLElement | undefined,
    value: AcceptableValue,
    disabled: boolean,
  ) => void
  selectedItem?: Ref<HTMLElement | undefined>
  onItemLeave?: () => void
  itemTextRefCallback: (
    node: HTMLElement | undefined,
    value: AcceptableValue,
    disabled: boolean,
  ) => void
  focusSelectedItem?: () => void
  selectedItemText?: Ref<HTMLElement | undefined>
  position?: 'item-aligned' | 'popper'
  isPositioned?: Ref<boolean>
  searchRef?: Ref<string>
}

export const SelectContentDefaultContextValue: SelectContentContext = {
  onViewportChange: () => {},
  itemTextRefCallback: () => {},
  itemRefCallback: () => {},
}

export type SelectContentImplEmits = {
  closeAutoFocus: [event: Event]
  /**
   * Event handler called when the escape key is down.
   * Can be prevented.
   */
  escapeKeyDown: [event: KeyboardEvent]
  /**
   * Event handler called when a `pointerdown` event happens outside of the `DismissableLayer`.
   * Can be prevented.
   */
  pointerDownOutside: [event: PointerDownOutsideEvent]
}

export interface SelectContentImplProps extends PopperContentProps, DismissableLayerProps {
  /**
   *  The positioning mode to use
   *
   *  `item-aligned (default)` - behaves similarly to a native MacOS menu by positioning content relative to the active item. <br>
   *  `popper` - positions content in the same way as our other primitives, for example `Popover` or `DropdownMenu`.
   */
  position?: 'item-aligned' | 'popper'
  /**
   * When `true`, page scroll is locked while the content is open.
   *
   * @defaultValue true
   */
  bodyLock?: boolean
  /**
   * When `true`, keyboard navigation will loop from last item to first, and vice versa.
   * @defaultValue false
   */
  loop?: boolean
}

export const [injectSelectContentContext, provideSelectContentContext]
  = createContext<SelectContentContext>('SelectContent')
</script>

<script setup lang="ts">
import { reactiveOmit, unrefElement } from '@vueuse/core'
import { computed, mergeProps, ref, watch } from 'vue'
import { DismissableLayer } from '@/DismissableLayer'
import { FocusScope } from '@/FocusScope'
import SelectItemAlignedPosition from './SelectItemAlignedPosition.vue'
import SelectPopperPosition from './SelectPopperPosition.vue'
import { injectSelectRootContext } from './SelectRoot.vue'
import { useSelectContent } from './useSelect'

const props = withDefaults(defineProps<SelectContentImplProps>(), {
  align: 'start',
  position: 'item-aligned',
  bodyLock: true,
  disableOutsidePointerEvents: true,
})
const emits = defineEmits<SelectContentImplEmits>()

const rootContext = injectSelectRootContext()

// The modal side effects follow the open state, not the mount: a
// `forceMount`ed content that is closed (or animating out) must not keep the
// scroll lock, the internal backdrop or `aria-hidden` on its siblings.
const present = computed(() => rootContext.open.value)

// Modal by default (#2822): page scroll is locked while the content is open,
// and `disableOutsidePointerEvents` mounts the dismissable layer's internal
// backdrop under the content.
const scrollLocked = useBodyScrollLock(present.value && props.bodyLock)
watch([present, () => props.bodyLock], ([isPresent, bodyLock]) => scrollLocked.value = isPresent && bodyLock)
const { CollectionSlot, getItems } = useCollection()

const content = ref<HTMLElement>()
// Scope focus guards to the content's root (shadow-safe); set up after `content`.
useFocusGuards(content)
useHideOthers(computed(() => present.value ? content.value : undefined))

// In `popper` position the trigger stays visible beside the content: cut it
// out of the backdrop so a press on it toggles the select closed (Base UI).
const backdropCutout = computed(() => props.position === 'popper' ? rootContext.triggerElement.value : undefined)

// `focus-outside` is prevented below, so a dismissal is only ever an Escape
// key or an outside press.
function handleDismiss({ reason, event }: DismissableLayerDismissDetails) {
  rootContext.onOpenChange(false, reason as Exclude<DismissableLayerDismissReason, 'focus-outside'>, event)
}

function handlePointerDownOutside(event: PointerDownOutsideEvent) {
  emits('pointerDownOutside', event)
  if (event.defaultPrevented)
    return
  // A press on the trigger toggles the select closed: report it as a
  // `'trigger-press'`, not a dismissal.
  const target = event.target as Node | null
  if (target && rootContext.triggerElement.value?.contains(target)) {
    event.preventDefault()
    rootContext.onOpenChange(false, 'trigger-press', event.detail.originalEvent)
  }
}

// Keyboard navigation and typeahead, the selected-item tracking for
// item-aligned positioning, and the pointer-release guard after opening.
const { content: surface, contentContext, isPositioned } = useSelectContent({
  context: rootContext,
  contentElement: content,
  getItems,
  position: props.position,
  loop: () => props.loop,
})

// `loop` drives keyboard navigation here and is not a positioning prop
const positionProps = reactiveOmit(props, 'loop')
const pickedProps = computed(() => {
  if (props.position === 'popper')
    return positionProps
  else return {}
})

const forwardedProps = useForwardProps(pickedProps.value)

provideSelectContentContext(contentContext)

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <CollectionSlot :ref="forwardRef">
    <FocusScope
      as-child
      :present="present"
      @mount-auto-focus.prevent
      @unmount-auto-focus="
        (event) => {
          emits('closeAutoFocus', event);
          if (event.defaultPrevented) return;
          rootContext.triggerElement.value?.focus({ preventScroll: true });
          event.preventDefault();
        }
      "
    >
      <DismissableLayer
        as-child
        :present="present"
        :disable-outside-pointer-events="disableOutsidePointerEvents"
        :backdrop-cutout="backdropCutout"
        @focus-outside.prevent
        @dismiss="handleDismiss"
        @escape-key-down="emits('escapeKeyDown', $event)"
        @pointer-down-outside="handlePointerDownOutside"
      >
        <component
          :is="
            position === 'popper'
              ? SelectPopperPosition
              : SelectItemAlignedPosition
          "
          v-bind="mergeProps({ ...$attrs, ...forwardedProps }, surface.attrs.value)"
          :ref="
            (vnode: Element | ComponentPublicInstance | null) => {
              if (!vnode) return undefined
              const el = unrefElement(vnode as ComponentPublicInstance) as HTMLElement | undefined
              // special case for PopperContent
              if (el?.hasAttribute('data-reka-popper-content-wrapper'))
                content = el.firstElementChild as HTMLElement
              else
                content = el
              return undefined
            }
          "
          @placed="isPositioned = true"
        >
          <slot />
        </component>
      </DismissableLayer>
    </FocusScope>
  </CollectionSlot>
</template>
