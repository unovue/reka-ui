import type { Ref } from 'vue'
import { defaultWindow } from '@vueuse/core'
import { isClient } from '@vueuse/shared'
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useStateMachine } from '@/shared'

export function usePresence(
  present: Ref<boolean>,
  node: Ref<HTMLElement | undefined>,
) {
  const stylesRef = ref<CSSStyleDeclaration | null>(null)
  const prevAnimationNameRef = ref<string>('none')
  const mountAnimationNameRef = ref<string>()
  const prevPresentRef = ref(present.value)
  const initialState = present.value ? 'mounted' : 'unmounted'
  let timeoutId: number | undefined
  let attachedNode: HTMLElement | undefined
  let ownerWindow = node.value?.ownerDocument.defaultView ?? defaultWindow

  const { state, dispatch } = useStateMachine(initialState, {
    mounted: {
      UNMOUNT: 'unmounted',
      ANIMATION_OUT: 'unmountSuspended',
    },
    unmountSuspended: {
      MOUNT: 'mounted',
      ANIMATION_END: 'unmounted',
    },
    unmounted: {
      MOUNT: 'mounted',
    },
  })

  const dispatchCustomEvent = (name: 'enter' | 'after-enter' | 'leave' | 'after-leave') => {
    // We only dispatch this event because CustomEvent is not available in Node18
    // https://github.com/unovue/reka-ui/issues/930
    if (isClient) {
      const customEvent = new CustomEvent(name, { bubbles: false, cancelable: false })
      node.value?.dispatchEvent(customEvent)
    }
  }

  watch(
    present,
    async (currentPresent, prevPresent) => {
      const hasPresentChanged = prevPresent !== currentPresent
      prevPresentRef.value = currentPresent
      await nextTick()
      if (hasPresentChanged) {
        const prevAnimationName = prevAnimationNameRef.value
        const currentAnimationName = getAnimationName(stylesRef.value)

        if (currentPresent) {
          mountAnimationNameRef.value = currentAnimationName
          dispatch('MOUNT')
          dispatchCustomEvent('enter')
          if (currentAnimationName === 'none')
            dispatchCustomEvent('after-enter')
        }
        else if (
          currentAnimationName === 'none' || currentAnimationName === 'undefined'
          || stylesRef.value?.display === 'none'
        ) {
          // If there is no exit animation or the element is hidden, animations won't run
          // so we unmount instantly rv
          dispatch('UNMOUNT')
          dispatchCustomEvent('leave')
          dispatchCustomEvent('after-leave')
        }
        else {
          /**
           * When `present` changes to `false`, we check changes to animation-name to
           * determine whether an animation has started. We chose this approach (reading
           * computed styles) because there is no `animationrun` event and `animationstart`
           * fires after `animation-delay` has expired which would be too late.
           */
          const isAnimating = prevAnimationName !== currentAnimationName
          if (prevPresent && isAnimating) {
            dispatch('ANIMATION_OUT')
            dispatchCustomEvent('leave')
          }
          else {
            dispatch('UNMOUNT')
            dispatchCustomEvent('after-leave')
          }
        }
      }
    },
    { immediate: true },
  )

  /**
   * Triggering an ANIMATION_OUT during an ANIMATION_IN will fire an `animationcancel`
   * event for ANIMATION_IN after we have entered `unmountSuspended` state. So, we
   * make sure we only trigger ANIMATION_END for the currently active animation.
   */
  const handleAnimationEnd = (event: AnimationEvent) => {
    const currentNode = node.value
    if (event.target !== currentNode)
      return

    const currentAnimationName = getAnimationName(stylesRef.value)
    const isCurrentAnimation = currentAnimationName.includes(
      CSS.escape(event.animationName),
    )
    const directionName = state.value === 'mounted' ? 'enter' : 'leave'
    if (isCurrentAnimation) {
      dispatchCustomEvent(`after-${directionName}`)
      dispatch('ANIMATION_END')

      if (!prevPresentRef.value) {
        const currentFillMode = currentNode.style.animationFillMode
        currentNode.style.animationFillMode = 'forwards'
        // Reset the style after the node had time to unmount (for cases
        // where the component chooses not to unmount). Doing this any
        // sooner than `setTimeout` (e.g. with `requestAnimationFrame`)
        // still causes a flash.
        timeoutId = ownerWindow?.setTimeout(() => {
          if (currentNode.style.animationFillMode === 'forwards') {
            currentNode.style.animationFillMode = currentFillMode
          }
        })
      }
    }
    // if no animation, immediately trigger 'ANIMATION_END'
    if (currentAnimationName === 'none')
      dispatch('ANIMATION_END')
  }
  const handleAnimationStart = (event: AnimationEvent) => {
    if (event.target === node.value) {
      // if animation occurred, store its name as the previous animation.
      prevAnimationNameRef.value = getAnimationName(stylesRef.value)
    }
  }

  const watcher = watch(
    node,
    (newNode) => {
      if (timeoutId !== undefined) {
        ownerWindow?.clearTimeout(timeoutId)
        timeoutId = undefined
      }

      attachedNode?.removeEventListener('animationstart', handleAnimationStart)
      attachedNode?.removeEventListener('animationcancel', handleAnimationEnd)
      attachedNode?.removeEventListener('animationend', handleAnimationEnd)
      attachedNode = newNode

      if (newNode) {
        ownerWindow = newNode.ownerDocument.defaultView ?? defaultWindow
        const styles = getComputedStyle(newNode)
        stylesRef.value = styles
        mountAnimationNameRef.value = undefined

        queueMicrotask(() => {
          if (
            attachedNode !== newNode
            || state.value !== 'mounted'
          ) {
            return
          }

          // Vue attaches sibling nodes one by one. Reading animationName here
          // synchronously would force a full style calculation after every
          // insertion, so wait until the batch has finished mounting.
          prevAnimationNameRef.value = getAnimationName(styles)
        })

        newNode.addEventListener('animationstart', handleAnimationStart)
        newNode.addEventListener('animationcancel', handleAnimationEnd)
        newNode.addEventListener('animationend', handleAnimationEnd)
      }
      else {
        stylesRef.value = null
        mountAnimationNameRef.value = undefined
        prevAnimationNameRef.value = 'none'

        // Transition to the unmounted state if the node is removed prematurely.
        // We avoid doing so during cleanup as the node may change but still exist.
        dispatch('ANIMATION_END')
      }
    },
    { immediate: true },
  )

  const stateWatcher = watch(state, () => {
    if (state.value === 'mounted') {
      prevAnimationNameRef.value
        = mountAnimationNameRef.value ?? getAnimationName(stylesRef.value)
      mountAnimationNameRef.value = undefined
    }
    else {
      prevAnimationNameRef.value = 'none'
    }
  })

  onUnmounted(() => {
    watcher()
    stateWatcher()
    if (attachedNode) {
      attachedNode.removeEventListener('animationstart', handleAnimationStart)
      attachedNode.removeEventListener('animationcancel', handleAnimationEnd)
      attachedNode.removeEventListener('animationend', handleAnimationEnd)
      attachedNode = undefined
    }
    if (timeoutId !== undefined)
      ownerWindow?.clearTimeout(timeoutId)
    stylesRef.value = null
    mountAnimationNameRef.value = undefined
    prevAnimationNameRef.value = 'none'
  })

  const isPresent = computed(() =>
    ['mounted', 'unmountSuspended'].includes(state.value),
  )

  return {
    isPresent,
  }
}

function getAnimationName(styles: CSSStyleDeclaration | null) {
  return styles?.animationName || 'none'
}
