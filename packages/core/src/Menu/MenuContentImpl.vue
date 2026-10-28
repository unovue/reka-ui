<script lang="ts">
import type { Ref } from 'vue'
import type { MenuContext } from './MenuRoot.vue'
import type {
  GraceIntent,
} from './utils'
import type {
  DismissableLayerDismissDetails,
  DismissableLayerEmits,
  DismissableLayerProps,
} from '@/DismissableLayer'
import type { FocusScopeProps } from '@/FocusScope'
import type { PopperContentProps } from '@/Popper'
import type { RovingFocusGroupEmits } from '@/RovingFocus'
import type { KeyedSelector } from '@/shared/createKeyedSelector'

import {
  createContext,
  useFocusGuards,
  useForwardElement,
} from '@/shared'
import { useBodyScrollLock } from '@/shared/useBodyScrollLock'

export interface MenuContentContext {
  onItemEnter: (event: PointerEvent) => boolean
  onItemLeave: (event: PointerEvent) => boolean
  onTriggerLeave: (event: PointerEvent) => boolean
  searchRef: Ref<string>
  highlightedElement: Ref<HTMLElement | undefined>
  /** `highlightedElement` as a keyed selector: items read their own cell. */
  highlight?: KeyedSelector<HTMLElement>
  onKeydownNavigation: (event: KeyboardEvent) => void
  onKeydownEnter: (event: KeyboardEvent) => void
  filterElement: Ref<HTMLElement | undefined>
  onFilterElementChange: (el: HTMLElement | undefined) => void
  activeSubmenuContext: Ref<{ onOpenChange: MenuContext['onOpenChange'], trigger: Ref<HTMLElement | undefined> } | undefined>
  pointerGraceTimerRef: Ref<number>
  onPointerGraceIntentChange: (intent: GraceIntent | null) => void
}

export const [injectMenuContentContext, provideMenuContentContext]
  = createContext<MenuContentContext>('MenuContent')

/**
 * The element a modal root menu keeps interactive through its internal backdrop
 * (Base UI `MenuPositioner` cuts the trigger out of it): the DropdownMenu
 * trigger, or the ContextMenu trigger area so a right-click there re-opens the
 * menu at the new point. Provided by the family's `*Content`.
 */
export const [injectMenuBackdropCutoutContext, provideMenuBackdropCutoutContext]
  = createContext<Ref<HTMLElement | undefined>>('MenuContent', 'MenuBackdropCutoutContext')

export interface MenuContentImplPrivateProps {
  /**
   * When `true`, hover/focus/click interactions will be disabled on elements outside
   * the `DismissableLayer`. Users will need to click twice on outside elements to
   * interact with them: once to close the `DismissableLayer`, and again to trigger the element.
   */
  disableOutsidePointerEvents?: DismissableLayerProps['disableOutsidePointerEvents']
  /**
   * Whether scrolling outside the `MenuContent` should be prevented
   * @defaultValue false
   */
  disableOutsideScroll?: boolean

  /**
   * Whether focus should be trapped within the `MenuContent`
   * @defaultValue also
   */
  trapFocus?: FocusScopeProps['trapped']
}

export type MenuContentImplEmits = DismissableLayerEmits & Omit<RovingFocusGroupEmits, 'update:currentTabStopId'> & {
  openAutoFocus: [event: Event]
  /**
   * Event handler called when auto-focusing on close.
   * Can be prevented.
   */
  closeAutoFocus: [event: Event]
}

type MenuContentImplPrivateEmits = MenuContentImplEmits & {
  /**
   * Handler called when the `DismissableLayer` should be dismissed;
   * carries the layer's `{ reason, event }`.
   */
  dismiss: [details: DismissableLayerDismissDetails]
}

export interface MenuContentImplProps
  extends MenuContentImplPrivateProps,
  Omit<PopperContentProps, 'dir'> {
  /**
   * When `true`, keyboard navigation will loop from last item to first, and vice versa.
   * @defaultValue false
   */
  loop?: boolean
}

export interface MenuRootContentTypeProps
  extends Omit<MenuContentImplProps, 'disableOutsidePointerEvents' | 'disableOutsideScroll' | 'trapFocus'> {}
</script>

<script setup lang="ts">
import {
  computed,
  mergeProps,
  toRefs,
  watch,
} from 'vue'
import { DismissableLayer } from '@/DismissableLayer'
import { FocusScope } from '@/FocusScope'
import {
  PopperContent,
  PopperContentPropsDefaultValue,
} from '@/Popper'
import { useRovingFocusGroup } from '@/RovingFocus/useRovingFocusGroup'
import { injectMenuContext, injectMenuRootContext } from './MenuRoot.vue'
import { useMenuContent } from './useMenu'

defineOptions({
  // `$attrs` fall through to `FocusScope` as before (bound last), except those
  // that configured the former `<RovingFocusGroup as-child>` (see
  // `consumerAttrs`).
  inheritAttrs: false,
})

const props = withDefaults(defineProps<MenuContentImplProps>(), {
  ...PopperContentPropsDefaultValue,
})
const emits = defineEmits<MenuContentImplPrivateEmits>()
const menuContext = injectMenuContext()
const rootContext = injectMenuRootContext()

const { trapFocus, disableOutsidePointerEvents, loop } = toRefs(props)

// Mount side-effects + the component wrappers (FocusScope/DismissableLayer/
// PopperContent) stay in the SFC; the keyboard/pointer/highlight brain moves
// into useMenuContent(). The roving focus group is a composable bound on the
// content's element.
// Base UI `MenuPositioner`: a modal root menu locks page scroll while open.
const scrollLocked = useBodyScrollLock(!!disableOutsidePointerEvents.value)
watch(disableOutsidePointerEvents, value => scrollLocked.value = !!value)
const backdropCutout = injectMenuBackdropCutoutContext(null)
const backdropCutoutElement = computed(() => backdropCutout?.value)

const { forwardRef, currentElement: contentElement, expose } = useForwardElement()
defineExpose(expose)

// Shadow-safe focus guards scoped to the content's root (#2794).
useFocusGuards(contentElement)

const { content, contentContext, handleMountAutoFocus, currentItemId } = useMenuContent({
  menuContext: menuContext!,
  rootContext,
  contentElement,
  getItems: () => roving.getItems(),
  loop,
  onOpenAutoFocus: event => emits('openAutoFocus', event),
})

provideMenuContentContext(contentContext)

const roving = useRovingFocusGroup({
  consumerAttrs: 'under',
  element: contentElement,
  orientation: () => 'vertical',
  dir: () => rootContext.dir.value,
  loop: () => loop.value,
  currentTabStopId: currentItemId,
  onEntryFocus: (event) => {
    emits('entryFocus', event)
    // only focus first item when using keyboard
    if (!rootContext.isUsingKeyboardRef.value)
      event.preventDefault()
  },
})
</script>

<template>
  <FocusScope
    as-child
    :trapped="trapFocus"
    v-bind="roving.consumerAttrs($attrs)"
    @mount-auto-focus="handleMountAutoFocus"
    @unmount-auto-focus="emits('closeAutoFocus', $event)"
  >
    <DismissableLayer
      as-child
      :disable-outside-pointer-events="disableOutsidePointerEvents"
      :backdrop-cutout="backdropCutoutElement"
      @escape-key-down="emits('escapeKeyDown', $event)"
      @pointer-down-outside="emits('pointerDownOutside', $event)"
      @focus-outside="emits('focusOutside', $event)"
      @interact-outside="emits('interactOutside', $event)"
      @dismiss="emits('dismiss', $event)"
    >
      <PopperContent
        :ref="forwardRef"
        :as="as"
        :as-child="asChild"
        :side="side"
        :side-offset="sideOffset"
        :align="align"
        :align-offset="alignOffset"
        :avoid-collisions="avoidCollisions"
        :collision-boundary="collisionBoundary"
        :collision-padding="collisionPadding"
        :arrow-padding="arrowPadding"
        :prioritize-position="prioritizePosition"
        :position-strategy="positionStrategy"
        :update-position-strategy="updatePositionStrategy"
        :sticky="sticky"
        :hide-when-detached="hideWhenDetached"
        :reference="reference"
        v-bind="mergeProps(roving.attrs(), content.attrs.value)"
      >
        <slot />
      </PopperContent>
    </DismissableLayer>
  </FocusScope>
</template>
