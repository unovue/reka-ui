import type { MaybeComputedElementRef } from '@vueuse/core'
import type { ComputedRef, Ref } from 'vue'
import { NumberFormatter, NumberParser } from '@internationalized/number'
import { unrefElement, useEventListener } from '@vueuse/core'
import { createEventHook, isClient } from '@vueuse/shared'
import { computed, onScopeDispose, ref } from 'vue'

const HOLD_DELAY = 400
const REPEAT_INTERVAL = 60
const TOUCH_MOVE_TOLERANCE = 10

export function usePressedHold(options: { target?: MaybeComputedElementRef, disabled: Ref<boolean> }) {
  const { disabled } = options
  const timeout = ref<number>()
  const triggerHook = createEventHook<PointerEvent | undefined>()
  const isPressed = ref(false)
  const target = computed(() => unrefElement(options.target))
  let activePointerId: number | undefined
  let activePointerType = ''
  let startX = 0
  let startY = 0
  let holdTriggered = false

  const resetTimeout = () => {
    if (timeout.value === undefined)
      return

    window.clearTimeout(timeout.value)
    timeout.value = undefined
  }

  const resetPress = () => {
    resetTimeout()
    activePointerId = undefined
    activePointerType = ''
    holdTriggered = false
    isPressed.value = false
  }

  // Hold repeats fire from a timer and carry no event.
  const trigger = (event?: PointerEvent) => {
    if (disabled.value) {
      resetPress()
      return false
    }

    triggerHook.trigger(event)
    return true
  }

  const scheduleRepeat = (delay: number) => {
    resetTimeout()
    timeout.value = window.setTimeout(() => {
      holdTriggered = true
      if (trigger())
        scheduleRepeat(REPEAT_INTERVAL)
    }, delay)
  }

  // Handle press event, modified version of useMousePressed
  const onPressStart = (event: PointerEvent) => {
    // Only handle left clicks, and ignore events that bubbled through portals.
    if (event.button !== 0 || isPressed.value || disabled.value)
      return

    event.preventDefault()
    activePointerId = event.pointerId
    activePointerType = event.pointerType
    startX = event.clientX
    startY = event.clientY
    holdTriggered = false
    isPressed.value = true

    if (event.pointerType === 'mouse') {
      holdTriggered = true
      if (trigger(event))
        scheduleRepeat(HOLD_DELAY)
      return
    }

    scheduleRepeat(HOLD_DELAY)
  }

  const onPressMove = (event: PointerEvent) => {
    if (event.pointerId !== activePointerId || activePointerType === 'mouse')
      return

    const distanceX = event.clientX - startX
    const distanceY = event.clientY - startY
    const movedBeyondTolerance = distanceX * distanceX + distanceY * distanceY > TOUCH_MOVE_TOLERANCE ** 2

    if (movedBeyondTolerance)
      resetPress()
  }

  const onPressRelease = (event: PointerEvent) => {
    if (event.pointerId !== activePointerId)
      return

    const shouldTriggerTap = activePointerType !== 'mouse' && !holdTriggered
    resetPress()

    if (shouldTriggerTap)
      trigger(event)
  }

  const onPressCancel = (event: PointerEvent) => {
    if (event.pointerId === activePointerId)
      resetPress()
  }

  if (isClient) {
    useEventListener(target || window, 'pointerdown', onPressStart)
    useEventListener(window, 'pointermove', onPressMove)
    useEventListener(window, 'pointerup', onPressRelease)
    useEventListener(window, 'pointercancel', onPressCancel)
  }

  onScopeDispose(resetPress)

  return {
    isPressed,
    onTrigger: triggerHook.on,
  }
}

/**
 * The formatter for the current locale and options, rebuilt when either
 * changes. One computed and one small object with prototype methods; vueuse
 * `reactiveComputed` added a reactive proxy (and its handler state) on top and
 * ran every call through it.
 */
class ReactiveNumberFormatter {
  constructor(readonly current: ComputedRef<NumberFormatter>) {}
  format(value: number): string {
    return this.current.value.format(value)
  }

  resolvedOptions(): Intl.ResolvedNumberFormatOptions {
    return this.current.value.resolvedOptions()
  }
}

/** The parser counterpart of `ReactiveNumberFormatter`. */
class ReactiveNumberParser {
  constructor(readonly current: ComputedRef<NumberParser>) {}
  parse(value: string): number {
    return this.current.value.parse(value)
  }

  isValidPartialNumber(value: string, minValue?: number, maxValue?: number): boolean {
    return this.current.value.isValidPartialNumber(value, minValue, maxValue)
  }
}

export function useNumberFormatter(locale: Ref<string>, options: Ref<Intl.NumberFormatOptions | undefined> = ref({})) {
  return new ReactiveNumberFormatter(computed(() => new NumberFormatter(locale.value, options.value)))
}

export function useNumberParser(locale: Ref<string>, options: Ref<Intl.NumberFormatOptions | undefined> = ref({})) {
  return new ReactiveNumberParser(computed(() => new NumberParser(locale.value, options.value)))
}

export function handleDecimalOperation(operator: '-' | '+', value1: number, value2: number): number {
  let result = operator === '+' ? value1 + value2 : value1 - value2

  // Check if we have decimals
  if (value1 % 1 !== 0 || value2 % 1 !== 0) {
    const value1Decimal = value1.toString().split('.')
    const value2Decimal = value2.toString().split('.')
    const value1DecimalLength = (value1Decimal[1] && value1Decimal[1].length) || 0
    const value2DecimalLength = (value2Decimal[1] && value2Decimal[1].length) || 0
    const multiplier = 10 ** Math.max(value1DecimalLength, value2DecimalLength)

    // Transform the decimals to integers based on the precision
    value1 = Math.round(value1 * multiplier)
    value2 = Math.round(value2 * multiplier)

    // Perform the operation on integers values to make sure we don't get a fancy decimal value
    result = operator === '+' ? value1 + value2 : value1 - value2

    // Transform the integer result back to decimal
    result /= multiplier
  }

  return result
}
