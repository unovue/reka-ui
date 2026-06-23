import type { Ref } from 'vue'
import { defaultWindow } from '@vueuse/core'
import { isClient } from '@vueuse/shared'
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useStateMachine } from '@/shared'

export function usePresence(
  present: Ref<boolean>,
  node: Ref<HTMLElement | undefined>,
) {
  const stylesRef = ref<CSSStyleDeclaration>({} as any)
  const prevAnimationNameRef = ref<string>('none')
  const prevPresentRef = ref(present)
  const initialState = present.value ? 'mounted' : 'unmounted'
  let timeoutId: number | undefined
  let transitionTimeout: number | undefined
  let transitionPendingCount: number | undefined
  const ownerWindow = node.value?.ownerDocument.defaultView ?? defaultWindow

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
      await nextTick()
      if (hasPresentChanged) {
        const prevAnimationName = prevAnimationNameRef.value
        const currentAnimationName = getAnimationName(node.value)

        if (currentPresent) {
          dispatch('MOUNT')
          dispatchCustomEvent('enter')
          if (currentAnimationName === 'none')
            dispatchCustomEvent('after-enter')
        }
        else if (
          currentAnimationName === 'none' || currentAnimationName === 'undefined'
          || stylesRef.value?.display === 'none'
        ) {
          if (
            currentAnimationName === 'none'
            && stylesRef.value?.display !== 'none'
            && hasTransition(node.value)
          ) {
            dispatch('ANIMATION_OUT')
            dispatchCustomEvent('leave')

            const duration = getTransitionDuration(node.value)
            if (duration > 0) {
              transitionPendingCount = getTransitionPropertyCount(node.value)
              transitionTimeout = ownerWindow?.setTimeout(() => {
                if (state.value === 'unmountSuspended') {
                  dispatchCustomEvent('after-leave')
                  dispatch('ANIMATION_END')
                }
                transitionTimeout = undefined
                transitionPendingCount = undefined
              }, duration + 50)
            }
            else {
              dispatchCustomEvent('after-leave')
              dispatch('ANIMATION_END')
            }
          }
          else {
            // If there is no exit animation or the element is hidden, animations won't run
            // so we unmount instantly
            dispatch('UNMOUNT')
            dispatchCustomEvent('leave')
            dispatchCustomEvent('after-leave')
          }
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
    const currentAnimationName = getAnimationName(node.value)
    const isCurrentAnimation = currentAnimationName.includes(
      CSS.escape(event.animationName),
    )
    const directionName = state.value === 'mounted' ? 'enter' : 'leave'
    if (event.target === node.value && isCurrentAnimation) {
      dispatchCustomEvent(`after-${directionName}`)
      dispatch('ANIMATION_END')

      if (!prevPresentRef.value) {
        const currentFillMode = node.value.style.animationFillMode
        node.value.style.animationFillMode = 'forwards'
        // Reset the style after the node had time to unmount (for cases
        // where the component chooses not to unmount). Doing this any
        // sooner than `setTimeout` (e.g. with `requestAnimationFrame`)
        // still causes a flash.
        timeoutId = ownerWindow?.setTimeout(() => {
          if (node.value?.style.animationFillMode === 'forwards') {
            node.value.style.animationFillMode = currentFillMode
          }
        })
      }
    }
    // if no animation, immediately trigger 'ANIMATION_END'
    if (event.target === node.value && currentAnimationName === 'none')
      dispatch('ANIMATION_END')
  }
  const handleAnimationStart = (event: AnimationEvent) => {
    if (event.target === node.value) {
      // if animation occurred, store its name as the previous animation.
      prevAnimationNameRef.value = getAnimationName(node.value)
    }
  }

  const handleTransitionEnd = (event: TransitionEvent) => {
    if (event.target !== node.value)
      return
    if (state.value !== 'unmountSuspended')
      return

    // For `transition: all`, pendingCount is Infinity and never reaches 0;
    // the fallback timeout (duration + 50ms) serves as the completion path.
    if (transitionPendingCount !== undefined && transitionPendingCount > 0) {
      transitionPendingCount--
      if (transitionPendingCount > 0)
        return
    }

    if (transitionTimeout !== undefined) {
      ownerWindow?.clearTimeout(transitionTimeout)
      transitionTimeout = undefined
    }

    dispatchCustomEvent('after-leave')
    dispatch('ANIMATION_END')
  }

  const handleTransitionCancel = (event: TransitionEvent) => {
    if (event.target !== node.value)
      return
    if (state.value !== 'unmountSuspended')
      return

    if (transitionTimeout !== undefined) {
      ownerWindow?.clearTimeout(transitionTimeout)
      transitionTimeout = undefined
    }

    dispatchCustomEvent('after-leave')
    dispatch('ANIMATION_END')
  }

  const watcher = watch(
    node,
    (newNode, oldNode) => {
      if (newNode) {
        stylesRef.value = getComputedStyle(newNode)
        newNode.addEventListener('animationstart', handleAnimationStart)
        newNode.addEventListener('animationcancel', handleAnimationEnd)
        newNode.addEventListener('animationend', handleAnimationEnd)
        newNode.addEventListener('transitioncancel', handleTransitionCancel)
        newNode.addEventListener('transitionend', handleTransitionEnd)
      }
      else {
        // Transition to the unmounted state if the node is removed prematurely.
        // We avoid doing so during cleanup as the node may change but still exist.
        dispatch('ANIMATION_END')

        if (timeoutId !== undefined)
          ownerWindow?.clearTimeout(timeoutId)
        if (transitionTimeout !== undefined) {
          ownerWindow?.clearTimeout(transitionTimeout)
          transitionTimeout = undefined
        }
        transitionPendingCount = undefined
        oldNode?.removeEventListener('animationstart', handleAnimationStart)
        oldNode?.removeEventListener('animationcancel', handleAnimationEnd)
        oldNode?.removeEventListener('animationend', handleAnimationEnd)
        oldNode?.removeEventListener('transitioncancel', handleTransitionCancel)
        oldNode?.removeEventListener('transitionend', handleTransitionEnd)
      }
    },
    { immediate: true },
  )

  const stateWatcher = watch(state, () => {
    const currentAnimationName = getAnimationName(node.value)
    prevAnimationNameRef.value
      = state.value === 'mounted' ? currentAnimationName : 'none'
  })

  onUnmounted(() => {
    watcher()
    stateWatcher()
    if (transitionTimeout !== undefined) {
      ownerWindow?.clearTimeout(transitionTimeout)
      transitionTimeout = undefined
    }
  })

  const isPresent = computed(() =>
    ['mounted', 'unmountSuspended'].includes(state.value),
  )

  return {
    isPresent,
  }
}

function getAnimationName(node?: HTMLElement) {
  return node ? getComputedStyle(node).animationName || 'none' : 'none'
}

function hasTransition(node?: HTMLElement) {
  if (!node)
    return false
  const { transitionProperty, transitionDuration } = getComputedStyle(node)
  return (
    typeof transitionProperty === 'string'
    && transitionProperty !== 'none'
    && typeof transitionDuration === 'string'
    && transitionDuration !== ''
    && transitionDuration !== '0s'
  )
}

function getTransitionPropertyCount(node?: HTMLElement): number {
  if (!node)
    return 0
  const { transitionProperty } = getComputedStyle(node)
  if (!transitionProperty || transitionProperty === 'none')
    return 0
  if (transitionProperty === 'all')
    return Infinity
  return transitionProperty.split(',').length
}

function getTransitionDuration(node?: HTMLElement): number {
  if (!node)
    return 0
  const style = getComputedStyle(node)
  const durations = style.transitionDuration
  const delays = style.transitionDelay
  if (typeof durations !== 'string' || typeof delays !== 'string')
    return 0

  const durationArray = durations.split(',').map((d) => {
    const val = parseFloat(d)
    if (Number.isNaN(val))
      return 0
    return d.endsWith('ms') ? val : val * 1000
  })
  const delayArray = delays.split(',').map((d) => {
    const val = parseFloat(d)
    if (Number.isNaN(val))
      return 0
    return d.endsWith('ms') ? val : val * 1000
  })

  let max = 0
  for (let i = 0; i < durationArray.length; i++) {
    const total = (durationArray[i] || 0) + (delayArray[i] || 0)
    if (total > max)
      max = total
  }
  return max
}
