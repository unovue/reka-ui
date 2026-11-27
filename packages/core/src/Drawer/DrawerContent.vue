<script lang="ts">
import type { DrawerContentImplEmits, DrawerContentImplProps } from './DrawerContentImpl.vue'

export type DrawerContentEmits = DrawerContentImplEmits
export interface DrawerContentProps extends Omit<DrawerContentImplProps, 'trapFocus'> {
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { hasFocusLeftScope } from '@/FocusScope/utils'
import { Presence } from '@/Presence'
import { isHTMLElement, useEmitAsProps, useForwardExpose, useHideOthers } from '@/shared'
import DrawerContentImpl from './DrawerContentImpl.vue'
import { injectDrawerRootContext } from './DrawerRoot.vue'

const props = withDefaults(defineProps<DrawerContentProps>(), {
  initialFocus: true,
  finalFocus: true,
})
const emits = defineEmits<DrawerContentEmits>()

const rootContext = injectDrawerRootContext()
const emitsAsProps = useEmitAsProps(emits)
const { forwardRef, currentElement } = useForwardExpose()
const hasInteractedOutside = ref(false)
const hasPointerDownOutside = ref(false)
const presenceRef = ref<InstanceType<typeof Presence>>()

// With `forceMount` the node stays in the DOM while closed, so what is keyed on
// mounting (the focus scope's auto-focus, the layer and scope stacks, hiding the
// rest of the page) has to be keyed on presence instead: present while open and
// while animating out. Without it the content unmounts on close and is present
// for as long as it is mounted.
const isPresent = computed(() => !props.forceMount || !!presenceRef.value?.present)
const forwardedProps = computed(() => {
  const { forceMount: _, ...rest } = props
  return rest
})

// Modality tiers:
//   true           → full modal (focus trap + hide others + outside pointer events blocked)
//   'trap-focus'   → traps focus but does NOT block outside pointer events
//   false          → non-modal
const isFullModal = computed(() => rootContext.modal.value === true)
const isTrapFocusOnly = computed(() => rootContext.modal.value === 'trap-focus')
const shouldTrapFocus = computed(() => (isFullModal.value || isTrapFocusOnly.value) && rootContext.open.value)
const shouldHideOthers = computed(() => isFullModal.value && isPresent.value ? currentElement.value : undefined)
useHideOthers(shouldHideOthers)

function finalFocusElement() {
  if (props.finalFocus === false)
    return undefined
  if (isHTMLElement(props.finalFocus))
    return props.finalFocus
  return rootContext.triggerElement.value
}

// A force-mounted content never unmounts its focus scope, so `closeAutoFocus`
// never fires on close. Return focus once the content is no longer present,
// unless the user interacted outside a non-modal drawer or something else took
// focus meanwhile, e.g. a layer opened while this one was animating out.
// Vue clears `presenceRef` before the focus scope unmounts, so the close
// handlers below go by the presence last seen here instead of `isPresent`.
let lastPresent = isPresent.value
watch(isPresent, (present, wasPresent) => {
  lastPresent = present
  if (present || !wasPresent)
    return
  if ((isFullModal.value || !hasInteractedOutside.value) && !hasFocusLeftScope(currentElement.value ?? null))
    finalFocusElement()?.focus()
  hasInteractedOutside.value = false
  hasPointerDownOutside.value = false
})

// Non-modal handlers defined as named functions so the refs are accessed via
// `.value` explicitly and the reads/writes are unambiguous.
function onCloseAutoFocusNonModal(e: Event) {
  if (!e.defaultPrevented) {
    // A force-mounted content removed after it closed has already handled focus above.
    if (!hasInteractedOutside.value && lastPresent)
      finalFocusElement()?.focus()
    e.preventDefault()
  }
  hasInteractedOutside.value = false
  hasPointerDownOutside.value = false
}

function onInteractOutsideNonModal(e: any) {
  if (!e.defaultPrevented) {
    hasInteractedOutside.value = true
    if (e.detail.originalEvent.type === 'pointerdown')
      hasPointerDownOutside.value = true
  }
  const target = e.target as HTMLElement
  if (rootContext.triggerElement.value?.contains(target))
    e.preventDefault()
  if (e.detail.originalEvent.type === 'focusin' && hasPointerDownOutside.value)
    e.preventDefault()
}
</script>

<template>
  <Presence
    ref="presenceRef"
    v-slot="{ present }"
    :present="rootContext.open.value"
    :force-mount="forceMount"
  >
    <DrawerContentImpl
      v-if="isFullModal"
      :ref="forwardRef"
      v-bind="{ ...forwardedProps, ...emitsAsProps, ...$attrs }"
      :present="forceMount ? present : true"
      :trap-focus="shouldTrapFocus"
      :disable-outside-pointer-events="true"
      @close-auto-focus="(e: Event) => {
        if (!e.defaultPrevented) {
          e.preventDefault()
          // A force-mounted content removed after it closed has already handled focus
          if (lastPresent) finalFocusElement()?.focus()
        }
      }"
      @pointer-down-outside="(e: any) => {
        const orig = e.detail.originalEvent
        const isRightClick = orig.button === 2 || (orig.button === 0 && orig.ctrlKey)
        if (isRightClick) e.preventDefault()
      }"
      @focus-outside="(e: Event) => e.preventDefault()"
    >
      <slot />
    </DrawerContentImpl>

    <DrawerContentImpl
      v-else
      :ref="forwardRef"
      v-bind="{ ...forwardedProps, ...emitsAsProps, ...$attrs }"
      :present="forceMount ? present : true"
      :trap-focus="shouldTrapFocus"
      :disable-outside-pointer-events="false"
      @close-auto-focus="onCloseAutoFocusNonModal"
      @interact-outside="onInteractOutsideNonModal"
    >
      <slot />
    </DrawerContentImpl>
  </Presence>
</template>
