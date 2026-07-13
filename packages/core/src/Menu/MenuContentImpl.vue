<script lang="ts">
import type { Ref } from 'vue'
import type {
  GraceIntent,
} from './utils'
import type {
  DismissableLayerEmits,
  DismissableLayerProps,
} from '@/DismissableLayer'
import type { FocusScopeProps } from '@/FocusScope'
import type { PopperContentProps } from '@/Popper'
import type { RovingFocusGroupEmits } from '@/RovingFocus'

import {
  createContext,
  stateToDataAttrs,
  useFocusGuards,
  useForwardExpose,
} from '@/shared'
import { useBodyScrollLock } from '@/shared/useBodyScrollLock'

export interface MenuContentContext {
  onItemEnter: (event: PointerEvent) => boolean
  onItemLeave: (event: PointerEvent) => boolean
  onTriggerLeave: (event: PointerEvent) => boolean
  searchRef: Ref<string>
  highlightedElement: Ref<HTMLElement | undefined>
  onKeydownNavigation: (event: KeyboardEvent) => void
  onKeydownEnter: (event: KeyboardEvent) => void
  filterElement: Ref<HTMLElement | undefined>
  onFilterElementChange: (el: HTMLElement | undefined) => void
  activeSubmenuContext: Ref<{ onOpenChange: (open: boolean) => void, trigger: Ref<HTMLElement | undefined> } | undefined>
  pointerGraceTimerRef: Ref<number>
  onPointerGraceIntentChange: (intent: GraceIntent | null) => void
}

export const [injectMenuContentContext, provideMenuContentContext]
  = createContext<MenuContentContext>('MenuContent')

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
   * Handler called when the `DismissableLayer` should be dismissed
   */
  dismiss: []
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
  mergeProps,
  ref,
  toRefs,
} from 'vue'
import { DismissableLayer } from '@/DismissableLayer'
import { FocusScope } from '@/FocusScope'
import {
  PopperContent,
  PopperContentPropsDefaultValue,
} from '@/Popper'
import { RovingFocusGroup } from '@/RovingFocus'
import { injectMenuContext, injectMenuRootContext } from './MenuRoot.vue'
import { useMenuContent } from './useMenu'

const props = withDefaults(defineProps<MenuContentImplProps>(), {
  ...PopperContentPropsDefaultValue,
})
const emits = defineEmits<MenuContentImplPrivateEmits>()
const menuContext = injectMenuContext()
const rootContext = injectMenuRootContext()

const { trapFocus, disableOutsidePointerEvents, loop } = toRefs(props)

// Mount side-effects + the four component wrappers (FocusScope/DismissableLayer/
// RovingFocusGroup/PopperContent) stay in the SFC; the keyboard/pointer/highlight
// brain moves into useMenuContent(). `getItems` bridges the one seam the composable
// can't reach — RovingFocusGroup's template-instance-ref.
useFocusGuards()
useBodyScrollLock(disableOutsidePointerEvents.value)

const rovingFocusGroupRef = ref<InstanceType<typeof RovingFocusGroup>>()
const { forwardRef, currentElement: contentElement } = useForwardExpose()

const { content, contentContext, handleMountAutoFocus, currentItemId } = useMenuContent({
  menuContext: menuContext!,
  rootContext,
  contentElement,
  getItems: () => rovingFocusGroupRef.value?.getItems() ?? [],
  loop,
  onOpenAutoFocus: event => emits('openAutoFocus', event),
})

provideMenuContentContext(contentContext)
</script>

<template>
  <FocusScope
    as-child
    :trapped="trapFocus"
    @mount-auto-focus="handleMountAutoFocus"
    @unmount-auto-focus="emits('closeAutoFocus', $event)"
  >
    <DismissableLayer
      as-child
      :disable-outside-pointer-events="disableOutsidePointerEvents"
      @escape-key-down="emits('escapeKeyDown', $event)"
      @pointer-down-outside="emits('pointerDownOutside', $event)"
      @focus-outside="emits('focusOutside', $event)"
      @interact-outside="emits('interactOutside', $event)"
      @dismiss="emits('dismiss')"
    >
      <RovingFocusGroup
        ref="rovingFocusGroupRef"
        v-model:current-tab-stop-id="currentItemId"
        as-child
        orientation="vertical"
        :dir="rootContext.dir.value"
        :loop="loop"
        @entry-focus="(event) => {
          emits('entryFocus', event)
          // only focus first item when using keyboard
          if (!rootContext.isUsingKeyboardRef.value) event.preventDefault();
        }"
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
          v-bind="mergeProps(content.props.value, stateToDataAttrs(content.state.value))"
        >
          <slot />
        </PopperContent>
      </RovingFocusGroup>
    </DismissableLayer>
  </FocusScope>
</template>
