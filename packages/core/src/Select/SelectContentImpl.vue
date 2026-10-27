<script lang="ts">
import type {
  ComponentPublicInstance,
  Ref,
} from 'vue'
import type { DismissableLayerProps, PointerDownOutsideEvent } from '@/DismissableLayer'
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

// Modal by default (#2822): page scroll is locked while the content is open,
// and `disableOutsidePointerEvents` mounts the dismissable layer's internal
// backdrop under the content.
const scrollLocked = useBodyScrollLock(props.bodyLock)
watch(() => props.bodyLock, value => scrollLocked.value = value)
const { CollectionSlot, getItems } = useCollection()

const content = ref<HTMLElement>()
// Scope focus guards to the content's root (shadow-safe); set up after `content`.
useFocusGuards(content)
useHideOthers(content)

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
        :disable-outside-pointer-events="disableOutsidePointerEvents"
        @focus-outside.prevent
        @dismiss="({ reason, event }) => rootContext.onOpenChange(false, reason, event)"
        @escape-key-down="emits('escapeKeyDown', $event)"
        @pointer-down-outside="emits('pointerDownOutside', $event)"
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
