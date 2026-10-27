import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { PinInputContextValue, PinInputRootContext, PinInputType } from './PinInputRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, PartSurface } from '@/shared'
import type { Direction } from '@/shared/types'
import { computed, nextTick, ref, shallowRef, toValue, watch } from 'vue'
import { createPartSurface, getActiveElement, useArrowNavigation, useComposing, useControllableState } from '@/shared'

/**
 * Why the value changed; carried as `details.reason` on every change (#2828).
 * - `'input'`: a character typed into an input, an IME commit, or an autofill
 *   (a password manager or the OS one-time-code suggestion).
 * - `'paste'`: a clipboard paste spread across the inputs.
 * - `'backspace-key'`: `Backspace` cleared the current input, or the previous one.
 * - `'delete-key'`: `Delete` cleared the current input.
 */
export type PinInputChangeReason = 'input' | 'paste' | 'backspace-key' | 'delete-key'

/** Every value a pin input can hold, whatever its `type`. */
type PinInputModel = PinInputContextValue<PinInputType>

export type PinInputRootState = { complete: boolean, disabled: boolean }
export type PinInputInputState = { complete: boolean, disabled: boolean }

const NUMBER_REG = /^\d*$/
const NON_NUMBER_REG = /\D/g

/** Entry-by-entry comparison, so a fresh array with the same digits is not a change. */
function isPinInputValueEqual(a: PinInputModel | undefined | null, b: PinInputModel | undefined | null) {
  if (a === b)
    return true
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
    return false
  return a.every((value, index) => Object.is(value, b[index]))
}

function removeTrailingEmptyStrings(input: PinInputModel) {
  let i = input.length - 1
  while (i >= 0 && input[i] === '') {
    input.pop()
    i--
  }
  return input
}

/** The model after writing `value` at `index` — `updateModelValueAt`'s derivation, ported verbatim. */
function nextValueAt(current: PinInputModel, index: number, value: string, isNumeric: boolean): PinInputModel {
  const tempModelValue = [...current] as PinInputModel
  if (isNumeric) {
    const num = +value
    tempModelValue[index] = value === '' || Number.isNaN(num) ? undefined : num
  }
  else {
    tempModelValue[index] = value
  }
  return removeTrailingEmptyStrings(tempModelValue)
}

export interface UsePinInputProps {
  /**
   * Controlled value. A getter/ref resolving to `undefined` is uncontrolled; a
   * writable `Ref` (with no `emit`/`onUpdate`) is written back ("ref-owned").
   */
  modelValue?: MaybeRefOrGetter<PinInputModel | null | undefined>
  /** Initial value when uncontrolled. @defaultValue `[]` */
  defaultValue?: PinInputModel
  /** @defaultValue `'text'` */
  type?: MaybeRefOrGetter<PinInputType | undefined>
  /** Render the inputs as password fields. */
  mask?: MaybeRefOrGetter<boolean | undefined>
  /** One-time-code mode: autocomplete hint, and inputs fill in order. */
  otp?: MaybeRefOrGetter<boolean | undefined>
  /** @defaultValue `''` */
  placeholder?: MaybeRefOrGetter<string | undefined>
  /** @defaultValue `'ltr'` */
  dir?: MaybeRefOrGetter<Direction | undefined>
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** Component `emit`; receives `beforeUpdate:modelValue`, `update:modelValue` and `complete`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: PinInputModel, details: ChangeEventDetails<PinInputChangeReason>) => void
  /** Called after a change commits. */
  onUpdate?: (value: PinInputModel, details: ChangeEventDetails<PinInputChangeReason>) => void
  /** Called (after the model watcher flushes) whenever the model changes and every registered input is filled. */
  onComplete?: (value: PinInputModel) => void
}

export interface UsePinInputReturn {
  modelValue: ComputedRef<PinInputModel>
  /** The model as an array (`[]` while it is `null`/`undefined`). */
  currentModelValue: ComputedRef<PinInputModel>
  isCompleted: ComputedRef<boolean>
  isNumericMode: ComputedRef<boolean>
  disabled: ComputedRef<boolean>
  /** Replace the whole value. Returns `false` when unchanged or cancelled. */
  setModelValue: (value: PinInputModel, reason?: PinInputChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Write one input's value (`''` clears it). Returns `false` when unchanged or cancelled. */
  updateModelValueAt: (index: number, value: string, reason?: PinInputChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Register an input element, in DOM order; completion counts registered inputs. */
  registerInput: (el: HTMLInputElement) => void
  unregisterInput: (el: HTMLInputElement) => void
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<PinInputChangeReason>>>
  isControlled: ComputedRef<boolean>
  root: PartSurface<PinInputRootState>
  /**
   * Creates the surface of the input at `index`. A factory: call it once per
   * input (it holds that input's IME composition state).
   */
  createInputSurface: (options: CreatePinInputInputSurfaceOptions) => PinInputInputSurface
  context: PinInputRootContext<PinInputType>
}

/**
 * Headless PinInput logic. The `.vue` shells compose this; a standalone
 * consumer binds `root.attrs` and one `createInputSurface({ index, element })`
 * per input, and registers each input element with `registerInput` (completion
 * is "every registered input is filled").
 *
 * Mount-bound: it installs the `complete` watcher in the current effect scope.
 * SSR-safe — no `document` at call scope.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup
 */
export function usePinInput(props: UsePinInputProps = {}): UsePinInputReturn {
  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<PinInputModel, PinInputChangeReason>({
    prop: props.modelValue as MaybeRefOrGetter<PinInputModel | undefined>,
    defaultValue: () => props.defaultValue ?? [],
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
    isEqual: isPinInputValueEqual,
  })

  // A controlled parent applies an accepted change on its next render, but an
  // autofill or IME commit can write several inputs in one tick. Each write
  // builds on the previous one through this pending value (v2's `useVModel`
  // wrote a local copy synchronously); it is dropped on the next tick, when the
  // parent's value is authoritative again.
  const pending = shallowRef<PinInputModel>()
  const currentModelValue = computed(() => {
    const value = pending.value ?? modelValue.value
    return (Array.isArray(value) ? [...value] : []) as PinInputModel
  })
  const type = computed<PinInputType>(() => toValue(props.type) ?? 'text')
  const isNumericMode = computed(() => type.value === 'number')
  const mask = computed(() => toValue(props.mask) ?? false)
  const otp = computed(() => toValue(props.otp) ?? false)
  const placeholder = computed(() => toValue(props.placeholder) ?? '')
  const dir = computed<Direction>(() => toValue(props.dir) ?? 'ltr')
  const disabled = computed(() => toValue(props.disabled) ?? false)

  const inputElements = ref<Set<HTMLInputElement>>(new Set())
  function registerInput(el: HTMLInputElement) {
    inputElements.value.add(el)
  }
  function unregisterInput(el: HTMLInputElement) {
    inputElements.value.delete(el)
  }

  const isCompleted = computed(() => {
    const modelValues = currentModelValue.value.filter(i => !!i || (isNumericMode.value && i === 0))
    return modelValues.length === inputElements.value.size
  })

  function setModelValue(value: PinInputModel, reason: PinInputChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    const changed = setState(value, reason, event)
    if (changed && isControlled.value) {
      pending.value = value
      nextTick(() => {
        pending.value = undefined
      })
    }
    return changed
  }

  function updateModelValueAt(index: number, value: string, reason: PinInputChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setModelValue(nextValueAt(currentModelValue.value, index, value, isNumericMode.value), reason, event)
  }

  // v2 parity: `complete` follows the (deep) model watcher, so it also fires when
  // a controlled parent fills the value, and only after the change flushed.
  watch(modelValue, () => {
    if (!isCompleted.value)
      return
    props.onComplete?.(modelValue.value)
    props.emit?.('complete', modelValue.value)
  }, { deep: true })

  const context: PinInputRootContext<PinInputType> = {
    modelValue,
    currentModelValue,
    mask,
    otp,
    placeholder,
    type,
    dir,
    disabled,
    isCompleted,
    inputElements,
    onInputElementChange: registerInput,
    isNumericMode,
    setModelValue,
    updateModelValueAt,
  }

  const root = createPartSurface<PinInputRootState>(
    () => ({ dir: dir.value }),
    () => ({ complete: isCompleted.value, disabled: disabled.value }),
  )

  return {
    modelValue,
    currentModelValue,
    isCompleted,
    isNumericMode,
    disabled,
    setModelValue,
    updateModelValueAt,
    registerInput,
    unregisterInput,
    lastChangeDetails,
    isControlled,
    root,
    createInputSurface: options => createPinInputInputSurface(context, options),
    context,
  }
}

export interface CreatePinInputInputSurfaceOptions {
  /** Position of the value this input binds to. */
  index: MaybeRefOrGetter<number>
  /** Disables this input on top of the root's `disabled`. */
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** The input element (for the placeholder toggle on focus). */
  element?: MaybeRefOrGetter<HTMLInputElement | null | undefined>
}

export interface PinInputInputSurface extends PartSurface<PinInputInputState> {
  /** This input's value in the model. */
  currentValue: ComputedRef<string | number | undefined>
  /** Shows the placeholder unless the input is empty and focused (next tick). */
  updatePlaceholder: () => void
}

/**
 * The per-input surface: attributes plus every input/keyboard/paste/IME
 * handler. A once-per-input factory (it owns the input's composition state).
 * Shared by `PinInputInput.vue` and `usePinInput().createInputSurface`.
 *
 * @internal
 */
export function createPinInputInputSurface(
  context: PinInputRootContext<PinInputType>,
  options: CreatePinInputInputSurfaceOptions,
): PinInputInputSurface {
  const index = () => toValue(options.index)
  const inputElements = computed(() => [...context.inputElements!.value])
  const currentValue = computed(() => context.currentModelValue.value[index()])
  const disabled = computed(() => (toValue(options.disabled) || context.disabled.value) ?? false)

  /** Restores the input's text to the model after a cancelled change. */
  function syncInput(target: HTMLInputElement) {
    target.value = String(context.currentModelValue.value[index()] ?? '')
  }

  /**
   * Writes `value` at `at`. `false` only when a `beforeUpdate` handler (or a
   * disabled consumer) refused it — an unchanged value still counts as handled,
   * so focus keeps advancing as in v2.
   */
  function writeAt(at: number, value: string, reason: PinInputChangeReason, event?: Event) {
    const next = nextValueAt(context.currentModelValue.value, at, value, context.isNumericMode.value)
    if (isPinInputValueEqual(next, context.currentModelValue.value))
      return true
    return context.setModelValue(next, reason, event)
  }

  function focusNext() {
    inputElements.value[index() + 1]?.focus()
  }

  const { isComposing, handleCompositionStart, handleCompositionEnd } = useComposing((event) => {
    const target = event.target as HTMLInputElement
    const value = event.data || target.value

    if (context.isNumericMode.value) {
      const filtered = value.replace(NON_NUMBER_REG, '')
      if (!filtered) {
        target.value = ''
        return
      }
      if (filtered.length > 1) {
        handleMultipleCharacter(filtered, 'input', event)
        return
      }
      target.value = filtered
      if (!writeAt(index(), filtered, 'input', event))
        return syncInput(target)
      focusNext()
      return
    }

    if (value.length > 1) {
      handleMultipleCharacter(value, 'input', event)
      return
    }

    target.value = value
    if (!writeAt(index(), value, 'input', event))
      return syncInput(target)
    focusNext()
  })

  function handleInput(event: InputEvent) {
    if (isComposing.value || event.isComposing)
      return
    const target = event.target as HTMLInputElement

    if ((event.data?.length ?? 0) > 1) {
      handleMultipleCharacter(target.value, 'input', event)
      return
    }

    if (context.isNumericMode.value && !NUMBER_REG.test(target.value)) {
      target.value = target.value.replace(NON_NUMBER_REG, '')
      return
    }

    target.value = event.data || target.value.slice(-1)
    if (!writeAt(index(), target.value, 'input', event))
      return syncInput(target)
    focusNext()
  }

  function updatePlaceholder() {
    nextTick(() => {
      const target = toValue(options.element)
      if (!target)
        return
      if (!target.value && target === getActiveElement())
        target.placeholder = ''
      else
        target.placeholder = context.placeholder.value
    })
  }

  /**
   * In OTP mode, inputs should be filled one by one without skipping middle inputs.
   * Returns the index of the first empty input, or `-1` when not in OTP mode / all filled.
   */
  function getFirstEmptyInputIndex() {
    if (!context.otp.value)
      return -1
    return inputElements.value.findIndex((_, idx) =>
      context.currentModelValue.value[idx] === ''
      || context.currentModelValue.value[idx] === undefined,
    )
  }

  function getEarlierEmptyInput() {
    const firstEmptyInputIdx = getFirstEmptyInputIndex()
    if (firstEmptyInputIdx !== -1 && firstEmptyInputIdx < index())
      return inputElements.value[firstEmptyInputIdx]
    return undefined
  }

  function handleNavigationKeydown(event: KeyboardEvent) {
    // Don't move between inputs mid-composition, arrow keys are used for IME candidate navigation
    if (isComposing.value || event.isComposing)
      return
    // In OTP mode, arrow keys must not move past the first empty input
    const firstEmptyInputIdx = getFirstEmptyInputIndex()
    const itemsArray = firstEmptyInputIdx === -1
      ? inputElements.value
      : inputElements.value.slice(0, firstEmptyInputIdx + 1)
    useArrowNavigation(event, getActiveElement() as HTMLElement, undefined, {
      itemsArray,
      focus: true,
      loop: false,
      arrowKeyOptions: 'horizontal',
      dir: context.dir.value,
    })
  }

  function handleBackspace(event: KeyboardEvent) {
    event.preventDefault()
    const target = event.target as HTMLInputElement
    if (target.value) {
      writeAt(index(), '', 'backspace-key', event)
    }
    else {
      const prevEl = inputElements.value[index() - 1]
      if (prevEl) {
        prevEl.focus()
        writeAt(index() - 1, '', 'backspace-key', event)
      }
    }
  }

  function handleDelete(event: KeyboardEvent) {
    event.preventDefault()
    writeAt(index(), '', 'delete-key', event)
  }

  const NAVIGATION_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']

  // Ported from the SFC's `@keydown.left.right.up.down.home.end` /
  // `@keydown.backspace` / `@keydown.delete` listeners (no modifier guards).
  function onKeydown(event: KeyboardEvent) {
    if (NAVIGATION_KEYS.includes(event.key))
      handleNavigationKeydown(event)
    else if (event.key === 'Backspace')
      handleBackspace(event)
    else if (event.key === 'Delete')
      handleDelete(event)
  }

  function onMousedown(event: MouseEvent) {
    const earlierEmptyInput = getEarlierEmptyInput()
    if (!earlierEmptyInput)
      return
    // Prevent this input from receiving focus and send it to the first empty one instead
    event.preventDefault()
    earlierEmptyInput.focus()
  }

  function onFocus(event: FocusEvent) {
    // Focus arriving from a sibling input (e.g. `Tab`) must not be redirected,
    // otherwise keyboard users get trapped inside the pin input (#2943)
    const isFromSiblingInput = inputElements.value.includes(event.relatedTarget as HTMLInputElement)
    if (!isFromSiblingInput) {
      const earlierEmptyInput = getEarlierEmptyInput()
      if (earlierEmptyInput) {
        earlierEmptyInput.focus()
        return
      }
    }

    const target = event.target as HTMLInputElement
    target.setSelectionRange(1, 1)
    updatePlaceholder()
  }

  function onPaste(event: ClipboardEvent) {
    event.preventDefault()
    const clipboardData = event.clipboardData
    if (!clipboardData)
      return

    const rawValues = clipboardData.getData('text')
    const values = context.isNumericMode.value
      ? rawValues.replace(NON_NUMBER_REG, '')
      : rawValues
    handleMultipleCharacter(values, 'paste', event)
  }

  function handleMultipleCharacter(values: string, reason: PinInputChangeReason, event?: Event) {
    const tempModelValue = [...context.currentModelValue.value] as PinInputModel
    const initialIndex = values.length >= inputElements.value.length ? 0 : index()
    const lastIndex = Math.min(initialIndex + values.length, inputElements.value.length)
    for (let i = initialIndex; i < lastIndex; i++) {
      const input = inputElements.value[i]
      const value = values[i - initialIndex]
      if (context.isNumericMode.value) {
        const num = Number.parseInt(value)
        if (Number.isNaN(num))
          continue
        tempModelValue[i] = num
      }
      else {
        tempModelValue[i] = value
      }
      input.focus()
    }
    const changed = isPinInputValueEqual(tempModelValue, context.currentModelValue.value)
      || context.setModelValue(tempModelValue, reason, event)
    if (!changed) {
      // Cancelled: put back the text an IME or autofill wrote into this input.
      const target = event?.target
      if (target instanceof HTMLInputElement)
        syncInput(target)
      return
    }
    inputElements.value[lastIndex]?.focus()
  }

  const surface = createPartSurface<PinInputInputState>(
    () => ({
      'autocapitalize': 'none',
      'autocomplete': context.otp.value ? 'one-time-code' : 'false',
      'type': context.mask.value ? 'password' : 'text',
      'inputmode': context.isNumericMode.value ? 'numeric' : 'text',
      'pattern': context.isNumericMode.value ? '[0-9]*' : undefined,
      'placeholder': context.placeholder.value,
      'value': currentValue.value,
      'disabled': disabled.value,
      'aria-label': `pin input ${index() + 1} of ${inputElements.value.length}`,
      'onInput': (event: Event) => handleInput(event as InputEvent),
      'onKeydown': onKeydown,
      'onMousedown': onMousedown,
      'onFocus': onFocus,
      'onBlur': () => updatePlaceholder(),
      'onPaste': onPaste,
      'onCompositionstart': handleCompositionStart,
      'onCompositionend': handleCompositionEnd,
    }),
    () => ({ disabled: disabled.value, complete: context.isCompleted.value }),
  )

  return { ...surface, currentValue, updatePlaceholder }
}
