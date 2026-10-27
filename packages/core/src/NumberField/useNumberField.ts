import type { ComputedRef, HTMLAttributes, MaybeRefOrGetter, Ref } from 'vue'
import type { NumberFieldRootContext } from './NumberFieldRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, PartSurface } from '@/shared'
import { computed, mergeProps, ref, shallowRef, toValue, watch } from 'vue'
import { clamp, createPartSurface, getActiveElement, isNullish, snapValueToStep, useComposing, useControllableState } from '@/shared'
import { handleDecimalOperation, useNumberFormatter, useNumberParser } from './utils'

/**
 * Why the value changed; carried as `details.reason` on every change (#2828).
 * - `'increment-press'` / `'decrement-press'`: a `NumberFieldIncrement` / `NumberFieldDecrement` press (tap, click or hold-repeat).
 * - `'keyboard'`: ArrowUp/ArrowDown, PageUp/PageDown, Home/End, or Enter committing the typed text.
 * - `'wheel'`: a wheel step on the focused input.
 * - `'blur'`: the input lost focus and committed its typed text.
 */
export type NumberFieldChangeReason = 'increment-press' | 'decrement-press' | 'keyboard' | 'wheel' | 'blur'

type Reason = NumberFieldChangeReason | BaseChangeReason

// v2 rendered `data-pressed="true"` (not the boolean `""`); kept.
const buttonStateMapping = {
  pressed: (pressed: boolean) => ({ 'data-pressed': pressed ? 'true' : undefined }),
}

export type NumberFieldRootState = { disabled: boolean, readonly: boolean }
export type NumberFieldInputState = { disabled: boolean, readonly: boolean }
export type NumberFieldButtonState = { disabled: boolean, pressed: boolean }

export interface UseNumberFieldProps {
  /**
   * Controlled value. A getter/ref resolving to `undefined` is uncontrolled;
   * a writable `Ref` (with no `emit`/`onUpdate`) is written back ("ref-owned").
   */
  modelValue?: MaybeRefOrGetter<number | null | undefined>
  defaultValue?: number
  min?: MaybeRefOrGetter<number | undefined>
  max?: MaybeRefOrGetter<number | undefined>
  /** @defaultValue `1` */
  step?: MaybeRefOrGetter<number | undefined>
  /** @defaultValue `true` */
  stepSnapping?: MaybeRefOrGetter<boolean | undefined>
  allowInvalid?: MaybeRefOrGetter<boolean | undefined>
  /** @defaultValue `true` */
  focusOnChange?: MaybeRefOrGetter<boolean | undefined>
  formatOptions?: MaybeRefOrGetter<Intl.NumberFormatOptions | undefined>
  /** The resolved locale. The `NumberFieldRoot` shell resolves it through `ConfigProvider`. @defaultValue `'en'` */
  locale?: MaybeRefOrGetter<string | undefined>
  disabled?: MaybeRefOrGetter<boolean | undefined>
  readonly?: MaybeRefOrGetter<boolean | undefined>
  disableWheelChange?: MaybeRefOrGetter<boolean | undefined>
  invertWheelChange?: MaybeRefOrGetter<boolean | undefined>
  id?: MaybeRefOrGetter<string | undefined>
  startingValue?: MaybeRefOrGetter<number | undefined>
  /** Component `emit`; receives `beforeUpdate:modelValue` then `update:modelValue`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: number | undefined, details: ChangeEventDetails<NumberFieldChangeReason>) => void
  /** Called after a change commits. */
  onUpdate?: (value: number | undefined, details: ChangeEventDetails<NumberFieldChangeReason>) => void
}

export interface UseNumberFieldReturn {
  modelValue: ComputedRef<number | undefined>
  /** The formatted value (`''` when empty). */
  textValue: ComputedRef<string>
  disabled: ComputedRef<boolean>
  readonly: ComputedRef<boolean>
  isIncreaseDisabled: ComputedRef<boolean>
  isDecreaseDisabled: ComputedRef<boolean>
  isControlled: ComputedRef<boolean>
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<NumberFieldChangeReason>>>
  /** Writes the model as given (no clamping). Returns `false` when unchanged or cancelled. */
  setModelValue: (value: number | undefined, reason?: Reason, event?: Event) => boolean
  /** One step up (or `multiplier` steps), clamped and snapped like an increment press. */
  increment: (multiplier?: number, reason?: Reason, event?: Event) => void
  /** One step down (or `multiplier` steps), clamped and snapped like a decrement press. */
  decrement: (multiplier?: number, reason?: Reason, event?: Event) => void
  /** Parses typed text and commits it (clamped/snapped unless `allowInvalid`). */
  applyInputValue: (value: string, reason?: Reason, event?: Event) => void
  /** Registers the input element; a standalone consumer binds it as the input's `ref`. */
  setInputElement: (el: HTMLInputElement | undefined | null) => void
  /** The `role="group"` surface. */
  root: PartSurface<NumberFieldRootState>
  /**
   * Creates the `role="spinbutton"` input surface. Once per input; it owns the
   * displayed text and IME state, and starts a watcher, so call it in `setup()`
   * or an effect scope.
   */
  createInputSurface: () => PartSurface<NumberFieldInputState>
  /** Increment button surface, with an `onClick` that steps up. */
  incrementButton: PartSurface<NumberFieldButtonState>
  /** Decrement button surface, with an `onClick` that steps down. */
  decrementButton: PartSurface<NumberFieldButtonState>
  context: NumberFieldRootContext
}

/**
 * Headless NumberField logic. The `.vue` shells compose this; a standalone
 * consumer gets the model, formatting, clamping/snapping, the group, input and
 * button surfaces. Press-and-hold repeat on the buttons stays in the
 * `NumberFieldIncrement` / `NumberFieldDecrement` shells (pointer listeners on
 * `window`); the standalone button surfaces step once per click.
 *
 * SSR-safe (no `document`/`window` at call scope) and callable outside
 * `setup()` (computed-only). `createInputSurface()` starts a watcher and needs a
 * scope. The locale is an input: the shell resolves it through `ConfigProvider`.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useNumberField(props: UseNumberFieldProps = {}): UseNumberFieldReturn {
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const readonly = computed(() => toValue(props.readonly) ?? false)
  const disableWheelChange = computed(() => toValue(props.disableWheelChange) ?? false)
  const invertWheelChange = computed(() => toValue(props.invertWheelChange) ?? false)
  const min = computed(() => toValue(props.min))
  const max = computed(() => toValue(props.max))
  const step = computed(() => toValue(props.step) ?? 1)
  const stepSnapping = computed(() => toValue(props.stepSnapping) ?? true)
  const allowInvalid = computed(() => toValue(props.allowInvalid) ?? false)
  const focusOnChange = computed(() => toValue(props.focusOnChange) ?? true)
  const id = computed(() => toValue(props.id))
  const locale = computed(() => toValue(props.locale) || 'en')
  const formatOptions = computed(() => toValue(props.formatOptions))

  const { state, setState, lastChangeDetails, isControlled } = useControllableState<number | undefined, NumberFieldChangeReason>({
    prop: props.modelValue as MaybeRefOrGetter<number | undefined>,
    defaultValue: () => props.defaultValue,
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })
  const modelValue = computed(() => state.value)

  function setModelValue(value: number | undefined, reason: Reason = 'imperative-action', event?: Event) {
    return setState(value, reason, event)
  }

  const inputEl = shallowRef<HTMLInputElement>()

  // Formatter
  const numberFormatter = useNumberFormatter(locale, formatOptions)
  const numberParser = useNumberParser(locale, formatOptions)

  function clampInputValue(val: number) {
    // Clamp to min and max, round to the nearest step, and round to specified number of digits
    let clampedValue: number
    if (step.value === undefined || isNaN(step.value) || !stepSnapping.value)
      clampedValue = clamp(val, min.value, max.value)
    else
      clampedValue = snapValueToStep(val, min.value, max.value, step.value)

    clampedValue = numberParser.parse(numberFormatter.format(clampedValue))
    return clampedValue
  }

  // Compute the clamped value a single increment/decrement (or multi-step key) would land on.
  // When snapping is enabled and `from` is off the step grid, a tick snaps to the nearest grid
  // line in the requested direction (HTML stepUp/stepDown semantics), instead of adding a whole
  // step and rounding to nearest — which overshoots (e.g. 18.98 + step 1 -> 19.98 -> 20 not 19).
  function getNextValue(type: 'increase' | 'decrease', from: number, multiplier = 1): number {
    const stepValue = step.value ?? 1
    const operator = type === 'increase' ? '+' : '-'
    let nextValue: number

    if (stepSnapping.value && !isNaN(stepValue)) {
      const snapped = snapValueToStep(from, min.value, max.value, stepValue)
      if (snapped === from) {
        nextValue = handleDecimalOperation(operator, from, stepValue * multiplier)
      }
      else {
        // Align to the grid line in the requested direction first…
        const aligned = type === 'increase'
          ? (snapped > from ? snapped : handleDecimalOperation('+', snapped, stepValue))
          : (snapped < from ? snapped : handleDecimalOperation('-', snapped, stepValue))
        // …then apply any remaining steps for multi-step keys (PageUp/PageDown).
        nextValue = multiplier > 1
          ? handleDecimalOperation(operator, aligned, stepValue * (multiplier - 1))
          : aligned
      }
    }
    else {
      nextValue = handleDecimalOperation(operator, from, stepValue * multiplier)
    }

    return clampInputValue(nextValue)
  }

  const isDecreaseDisabled = computed(() => {
    if (isNullish(modelValue.value) || isNaN(modelValue.value))
      return false
    // Disabled when a decrement can't produce a smaller in-range value.
    return getNextValue('decrease', modelValue.value) >= modelValue.value
  })
  const isIncreaseDisabled = computed(() => {
    if (isNullish(modelValue.value) || isNaN(modelValue.value))
      return false
    // Disabled when an increment can't produce a larger in-range value.
    return getNextValue('increase', modelValue.value) <= modelValue.value
  })

  const inputMode = computed<HTMLAttributes['inputmode']>(() => {
    // The inputMode attribute influences the software keyboard that is shown on touch devices.
    // Browsers and operating systems are quite inconsistent about what keys are available, however.
    // We choose between numeric and decimal based on whether we allow negative and fractional numbers,
    // and based on testing on various devices to determine what keys are available in each inputMode.
    const hasDecimals = numberFormatter.resolvedOptions().maximumFractionDigits! > 0

    return hasDecimals ? 'decimal' : 'numeric'
  })
  // Replace negative textValue formatted using currencySign: 'accounting'
  // with a textValue that can be announced using a minus sign.
  const textValueFormatter = useNumberFormatter(locale, formatOptions)
  const textValue = computed(() => isNullish(modelValue.value) || isNaN(modelValue.value) ? '' : textValueFormatter.format(modelValue.value))

  function handleChangingValue(type: 'increase' | 'decrease', multiplier: number, reason: Reason, event?: Event) {
    if (focusOnChange.value)
      inputEl.value?.focus()
    if (disabled.value || readonly.value)
      return
    // Without a registered input (a standalone consumer that binds none) the model's text is the source.
    const currentInputValue = numberParser.parse(inputEl.value ? inputEl.value.value : textValue.value)
    if (isNaN(currentInputValue)) {
      // Route the fallback through clampInputValue so the min/max contract still holds
      // (e.g. a negative max would otherwise be violated by the bare 0 fallback).
      // `startingValue` is used as given: kept within min/max, but not snapped to the step grid
      // (a starting price of 40 with step 3 stays 40). The next tick aligns it via getNextValue.
      const startingValue = toValue(props.startingValue)
      setState(startingValue === undefined
        ? clampInputValue(min.value ?? 0)
        : numberParser.parse(numberFormatter.format(clamp(startingValue, min.value, max.value))), reason, event)
      return
    }

    const nextValue = getNextValue(type, currentInputValue, multiplier)
    // An out-of-range value (e.g. typed with `allowInvalid`) would be clamped against the requested
    // direction — ArrowUp above `max` would lower it. Do nothing instead, like HTML stepUp/stepDown.
    if (type === 'increase' ? nextValue < currentInputValue : nextValue > currentInputValue)
      return
    setState(nextValue, reason, event)
  }

  function handleIncrease(multiplier = 1, reason: Reason = 'imperative-action', event?: Event) {
    handleChangingValue('increase', multiplier, reason, event)
  }
  function handleDecrease(multiplier = 1, reason: Reason = 'imperative-action', event?: Event) {
    handleChangingValue('decrease', multiplier, reason, event)
  }

  function handleMinMaxValue(type: 'min' | 'max', reason: Reason = 'imperative-action', event?: Event) {
    if (type === 'min' && min.value !== undefined)
      setState(clampInputValue(min.value), reason, event)
    else if (type === 'max' && max.value !== undefined)
      setState(clampInputValue(max.value), reason, event)
  }

  function validate(val: string) {
    // `allowInvalid` lets out-of-range values be typed, so the bounds are skipped here — they
    // would otherwise reject a leading minus sign whenever `min >= 0`. The value still has to
    // parse as a number, so non-numeric input stays rejected.
    if (allowInvalid.value)
      return numberParser.isValidPartialNumber(val)
    return numberParser.isValidPartialNumber(val, min.value, max.value)
  }

  function setInputValue(val: string) {
    if (inputEl.value)
      inputEl.value.value = val
  }

  function applyInputValue(val: string, reason: Reason = 'imperative-action', event?: Event) {
    const parsedValue = numberParser.parse(val)
    if (isNaN(parsedValue))
      setState(undefined, reason, event)
    else if (allowInvalid.value)
      // Keep the typed value as-is, only normalize formatting precision
      setState(numberParser.parse(numberFormatter.format(parsedValue)), reason, event)
    else
      setState(clampInputValue(parsedValue), reason, event)
    // Set to empty state if input value is empty
    if (!val.length)
      return setInputValue(val)

    // Otherwise (including a failed parse or a cancelled change) show the formatted current number.
    return setInputValue(textValue.value)
  }

  // A writable view for the context: custom parts that assign `modelValue.value`
  // (v2) still go through `setState`, so `beforeUpdate` can cancel them.
  const contextModelValue = computed<number | undefined>({
    get: () => modelValue.value,
    set: value => setModelValue(value),
  })

  const context: NumberFieldRootContext = {
    modelValue: contextModelValue,
    handleDecrease,
    handleIncrease,
    handleMinMaxValue,
    inputMode,
    inputEl,
    onInputElement: (el) => { inputEl.value = el },
    textValue,
    readonly,
    validate,
    applyInputValue,
    disabled,
    disableWheelChange,
    invertWheelChange,
    max,
    min,
    isDecreaseDisabled,
    isIncreaseDisabled,
    id,
  }

  const root = createPartSurface<NumberFieldRootState>(
    () => ({ role: 'group' }),
    () => ({ disabled: disabled.value, readonly: readonly.value }),
  )

  function withClick(surface: PartSurface<NumberFieldButtonState>, onClick: (event: MouseEvent) => void) {
    return createPartSurface<NumberFieldButtonState>(
      () => mergeProps(surface.props.value, { onClick }),
      surface.state,
      buttonStateMapping,
    )
  }

  return {
    modelValue,
    textValue,
    disabled,
    readonly,
    isIncreaseDisabled,
    isDecreaseDisabled,
    isControlled,
    lastChangeDetails,
    setModelValue,
    increment: handleIncrease,
    decrement: handleDecrease,
    applyInputValue,
    setInputElement: (el) => { inputEl.value = el ?? undefined },
    root,
    createInputSurface: () => createNumberFieldInputSurface(context),
    incrementButton: withClick(
      getNumberFieldButtonSurface(context, 'increase'),
      event => handleIncrease(1, 'increment-press', event),
    ),
    decrementButton: withClick(
      getNumberFieldButtonSurface(context, 'decrease'),
      event => handleDecrease(1, 'decrement-press', event),
    ),
    context,
  }
}

/**
 * Once per input: owns the displayed text and IME composition state. The
 * `NumberFieldInput` shell and `useNumberField().createInputSurface()` share it.
 * Starts a watcher, so call it in `setup()` or an effect scope.
 * @internal
 */
export function createNumberFieldInputSurface(rootContext: NumberFieldRootContext): PartSurface<NumberFieldInputState> {
  const { isComposing, handleCompositionStart, handleCompositionEnd } = useComposing()

  function handleKeydown(event: KeyboardEvent) {
    // Don't step/apply mid-composition, keys are used for IME candidate navigation and commit.
    // `isComposing` stays true until the tick after `compositionend`, so the commit keydown
    // (which can report `event.isComposing === false`) is still skipped.
    if (isComposing.value || event.isComposing)
      return

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        rootContext.handleIncrease(1, 'keyboard', event)
        break
      case 'ArrowDown':
        event.preventDefault()
        rootContext.handleDecrease(1, 'keyboard', event)
        break
      case 'PageUp':
        event.preventDefault()
        rootContext.handleIncrease(10, 'keyboard', event)
        break
      case 'PageDown':
        event.preventDefault()
        rootContext.handleDecrease(10, 'keyboard', event)
        break
      case 'Home':
        event.preventDefault()
        rootContext.handleMinMaxValue('min', 'keyboard', event)
        break
      case 'End':
        event.preventDefault()
        rootContext.handleMinMaxValue('max', 'keyboard', event)
        break
      case 'Enter':
        commitText(event, 'keyboard')
        break
    }
  }

  function handleWheel(event: WheelEvent) {
    if (rootContext.disableWheelChange.value)
      return

    // only handle when in focus
    if (event.target !== getActiveElement())
      return

    // if on a trackpad, users can scroll in both X and Y at once, check the magnitude of the change
    // if it's mostly in the X direction, then just return, the user probably doesn't mean to inc/dec
    // this isn't perfect, events come in fast with small deltas and a part of the scroll may give a false indication
    // especially if the user is scrolling near 45deg
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX))
      return

    event.preventDefault()
    const increase = event.deltaY > 0 ? !rootContext.invertWheelChange.value : event.deltaY < 0 ? rootContext.invertWheelChange.value : undefined
    if (increase === true)
      rootContext.handleIncrease(1, 'wheel', event)
    else if (increase === false)
      rootContext.handleDecrease(1, 'wheel', event)
  }

  function handleBeforeInput(event: InputEvent) {
    if (event.isComposing)
      return
    // A collapsed deletion carries no data, so nextValue would repeat the current value; undo and redo read the same
    // Every deletion is skipped so they stay consistent, and applyInputValue reformats on blur
    if (event.inputType.startsWith('delete') || event.inputType.startsWith('history'))
      return
    const target = event.target as HTMLInputElement
    const nextValue
      = target.value.slice(0, target.selectionStart ?? undefined)
        + (event.data ?? '')
        + target.value.slice(target.selectionEnd ?? undefined)

    // validate
    if (!rootContext.validate(nextValue))
      event.preventDefault()
  }

  const inputValue = ref(rootContext.textValue.value)
  watch(() => rootContext.textValue.value, () => {
    inputValue.value = rootContext.textValue.value
  }, { immediate: true })

  function handleInput(event: Event) {
    inputValue.value = (event.target as HTMLInputElement).value
  }

  function handleChange() {
    requestAnimationFrame(() => {
      inputValue.value = rootContext.textValue.value
    })
  }

  /**
   * Commits the typed text, then mirrors what `applyInputValue` showed into `inputValue`: the
   * bound `value` would otherwise keep the typed text after a cancelled or unchanged commit
   * (the model, and so `textValue`, did not move) and put it back on the next re-render.
   */
  function commitText(event: Event, reason: 'keyboard' | 'blur') {
    const text = ((event.target as HTMLInputElement | null)?.value ?? '') as string
    rootContext.applyInputValue(text, reason, event)
    inputValue.value = text.length ? rootContext.textValue.value : text
  }

  function handleBlur(event: FocusEvent) {
    commitText(event, 'blur')
  }

  return createPartSurface<NumberFieldInputState>(
    () => ({
      'id': rootContext.id.value,
      'value': inputValue.value,
      'role': 'spinbutton',
      'type': 'text',
      'tabindex': '0',
      'inputmode': rootContext.inputMode.value,
      'disabled': rootContext.disabled.value ? '' : undefined,
      'readonly': rootContext.readonly.value ? '' : undefined,
      'autocomplete': 'off',
      'autocorrect': 'off',
      'spellcheck': 'false',
      'aria-roledescription': 'Number field',
      'aria-valuenow': rootContext.modelValue.value,
      'aria-valuemin': rootContext.min.value,
      'aria-valuemax': rootContext.max.value,
      'onKeydown': handleKeydown,
      'onWheel': handleWheel,
      'onBeforeinput': handleBeforeInput,
      'onInput': handleInput,
      'onChange': handleChange,
      'onBlur': handleBlur,
      'onCompositionstart': handleCompositionStart,
      'onCompositionend': handleCompositionEnd,
    }),
    () => ({ disabled: rootContext.disabled.value, readonly: rootContext.readonly.value }),
  )
}

/**
 * Increment/decrement button attrs, derived from the root context. Shared by the
 * `NumberFieldIncrement` / `NumberFieldDecrement` shells (which add the
 * press-and-hold activation) and `useNumberField()`'s button surfaces (which add
 * `onClick`). No handlers here.
 * @internal
 */
export function getNumberFieldButtonSurface(
  rootContext: NumberFieldRootContext,
  direction: 'increase' | 'decrease',
  options: { disabled?: MaybeRefOrGetter<boolean | undefined>, pressed?: MaybeRefOrGetter<boolean | undefined> } = {},
): PartSurface<NumberFieldButtonState> {
  const isDisabled = computed(() => isNumberFieldButtonDisabled(rootContext, direction, toValue(options.disabled)))
  const isPressed = computed(() => toValue(options.pressed) ?? false)
  return createPartSurface<NumberFieldButtonState>(
    () => ({
      'tabindex': '-1',
      'aria-label': direction === 'increase' ? 'Increase' : 'Decrease',
      'style': { userSelect: isPressed.value ? 'none' : undefined },
      'disabled': isDisabled.value ? '' : undefined,
      'onContextmenu': (event: Event) => event.preventDefault(),
    }),
    () => ({ disabled: isDisabled.value, pressed: isPressed.value }),
    buttonStateMapping,
  )
}

/** Root disabled/readonly, the part's own `disabled`, or no further step in that direction. @internal */
export function isNumberFieldButtonDisabled(rootContext: NumberFieldRootContext, direction: 'increase' | 'decrease', disabled?: boolean) {
  return Boolean(rootContext.disabled?.value || rootContext.readonly.value || disabled
    || (direction === 'increase' ? rootContext.isIncreaseDisabled.value : rootContext.isDecreaseDisabled.value))
}
