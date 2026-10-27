import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { ColorFieldRootContext, ColorFieldRootProps } from './ColorFieldRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, PartSurface } from '@/shared'
import type { Color } from '@/shared/color'
import { computed, ref, toValue, watch } from 'vue'
import { createPartSurface, snapValueToStep, useComposing, useControllableState } from '@/shared'
import { colorToHex, convertToRgb, convertToSpace, getChannelColorSpace, getChannelRange, getChannelValue, isEqualColor, isValidColor, normalizeColor, parseColor, setChannelValue } from '@/shared/color'
import { createChangeEndTracker } from '@/shared/color/changeEnd'

type Inputs = Pick<ColorFieldRootProps, 'colorSpace' | 'channel' | 'disabled' | 'readonly' | 'disableWheelChange' | 'placeholder' | 'step' | 'modelValue' | 'defaultValue'>
export type ColorFieldChangeReason = 'keyboard' | 'wheel' | 'blur'
export type UseColorFieldProps = { [K in keyof Inputs]: MaybeRefOrGetter<Inputs[K]> } & {
  /** Called with every accepted color; same payload as `onUpdate`. */
  onColorUpdate?: (color: Color) => void
  /** Called with the hex serialization of every accepted color (lossy: drops hue on greys and sub-byte precision). */
  onHexUpdate?: (hex: string) => void
  /** Called with each committed change (edit, step or wheel). */
  onChange?: (value: Color) => void
  /** Called after each committed change; every field change is a complete interaction. */
  onChangeEnd?: (value: Color) => void
  emit?: (event: any, ...args: any[]) => void
  onBeforeUpdate?: (value: Color, details: ChangeEventDetails<ColorFieldChangeReason>) => void
  onUpdate?: (value: Color, details: ChangeEventDetails<ColorFieldChangeReason>) => void
}

export type ColorFieldRootState = { disabled: boolean, readonly: boolean, invalid: boolean }
export interface UseColorFieldReturn {
  /** The model as passed in (`string | Color`); every emitted value is a `Color`. */
  readonly modelValue: ComputedRef<string | Color>
  /** The model as a `Color`; with a `channel`, in the space that holds the channel. */
  readonly color: ComputedRef<Readonly<Color>>
  readonly disabled: ComputedRef<boolean>
  readonly isControlled: ComputedRef<boolean>
  readonly lastChangeDetails: Readonly<Ref<ChangeEventDetails<ColorFieldChangeReason>>>
  setColor: (color: Color, reason?: ColorFieldChangeReason | BaseChangeReason, event?: Event) => boolean
  readonly root: PartSurface<ColorFieldRootState>
  readonly context: { readonly [K in keyof ColorFieldRootContext]: ColorFieldRootContext[K] extends Ref ? Readonly<ColorFieldRootContext[K]> : ColorFieldRootContext[K] }
  readonly inputValue: ComputedRef<string>
  /** `true` once a commit rejected text that does not parse as a color (or, with a `channel`, a number); the text reverts. Cleared by the next edit that parses or the next committed change. */
  readonly invalid: ComputedRef<boolean>
  createInputSurface: () => PartSurface<ColorFieldInputState>
  updateValue: (value: string) => void
  commit: (event?: Event) => void
  increment: (event?: Event) => void
  decrement: (event?: Event) => void
  incrementPage: (event?: Event) => void
  decrementPage: (event?: Event) => void
  incrementToMax: (event?: Event) => void
  decrementToMin: (event?: Event) => void
  handleWheel: (event: WheelEvent) => void
}

const MIN_HEX_INT = 0x000000
const MAX_HEX_INT = 0xFFFFFF
const PAGE_STEP_MULTIPLIER = 10

/**
 * Headless ColorField state. Call in setup or an effect scope to dispose the input synchronization watcher.
 *
 * The model accepts `string | Color` and every emit carries a `Color`. With a
 * `channel`, the color is edited in the space that holds that channel (the
 * `colorSpace` prop when it does), so the hue of a grey and fractional steps survive.
 *
 * @experimental
 * @lifecycle setup
 */
export function useColorField(props: UseColorFieldProps = {}): UseColorFieldReturn {
  const colorSpace = computed(() => toValue(props.colorSpace) ?? 'hsl')
  const channel = computed(() => toValue(props.channel))
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const readonly = computed(() => toValue(props.readonly) ?? false)
  const disableWheelChange = computed(() => toValue(props.disableWheelChange) ?? false)
  const placeholder = computed(() => toValue(props.placeholder))
  const stepProp = computed(() => toValue(props.step))

  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<string | Color, ColorFieldChangeReason>({
    prop: props.modelValue,
    defaultValue: () => toValue(props.defaultValue) ?? '#000000',
    isEqual: isEqualColor,
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate as ((value: string | Color, details: ChangeEventDetails<ColorFieldChangeReason>) => void) | undefined,
    onUpdate: props.onUpdate as ((value: string | Color, details: ChangeEventDetails<ColorFieldChangeReason>) => void) | undefined,
  })

  // A string model is parsed once per change. A channel field reads and writes the
  // color in the space that holds its channel.
  const parsed = computed(() => normalizeColor(modelValue.value ?? '#000000'))
  const color = computed(() => channel.value
    ? convertToSpace(parsed.value, getChannelColorSpace(channel.value, colorSpace.value))
    : parsed.value)

  function reasonFromEvent(event?: Event): ColorFieldChangeReason | BaseChangeReason {
    return event?.type === 'wheel' ? 'wheel' : event?.type === 'blur' ? 'blur' : event ? 'keyboard' : 'imperative-action'
  }

  function setColor(newColor: Color, reason: ColorFieldChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    const changed = setState(newColor, reason, event)
    if (!changed)
      return false
    props.onColorUpdate?.(newColor)
    props.emit?.('update:color', newColor)
    const hex = colorToHex(newColor)
    props.onHexUpdate?.(hex)
    props.emit?.('update:hex', hex)
    return true
  }

  const changeEnd = createChangeEndTracker({
    current: () => parsed.value,
    isControlled: () => isControlled.value,
    onChangeEnd: (value) => {
      props.onChangeEnd?.(value)
      props.emit?.('changeEnd', value)
    },
  })

  // Validated at commit time, like React Aria's native validation: a commit that rejects
  // the text marks the field invalid, so partial input while typing never flickers. It
  // stays invalid until an edit parses or a later change commits.
  const isInvalid = ref(false)
  const invalid = computed(() => isInvalid.value)

  /** An interactive change: the model update, `change`, and `changeEnd` once the model holds it. */
  function applyChange(newColor: Color, event?: Event) {
    const previous = parsed.value
    if (!setColor(newColor, reasonFromEvent(event), event))
      return false
    isInvalid.value = false
    props.onChange?.(newColor)
    props.emit?.('change', newColor)
    changeEnd.record(previous, newColor)
    changeEnd.commit()
    return true
  }

  // Input value for the text field
  const inputValue = ref('')
  const isEditing = ref(false)

  function formatValue(c: Color): string {
    if (channel.value)
      return String(Math.round(getChannelValue(c, channel.value)))
    return colorToHex(c)
  }

  // Update input value when the formatted color changes (unless user is editing). The
  // getter reads the channels, so an in-place mutation of a reactive Color is seen too.
  watch(() => formatValue(color.value), (formatted) => {
    if (!isEditing.value)
      inputValue.value = formatted
  }, { immediate: true })

  /** Whether `text` parses: a number for a channel field, a color string otherwise. */
  function isParsable(text: string) {
    return channel.value ? !Number.isNaN(Number.parseFloat(text)) : isValidColor(text.trim())
  }

  function resetInput() {
    inputValue.value = formatValue(color.value)
  }

  function getStep(): number {
    if (stepProp.value != null)
      return stepProp.value
    if (channel.value)
      return getChannelRange(channel.value).step
    // Hex mode: step by 1 in the integer space (like react-spectrum)
    return 1
  }

  function updateValue(value: string) {
    isEditing.value = true
    inputValue.value = value
    // Only an edit that parses clears a rejected commit; partial input never sets it.
    if (isInvalid.value && isParsable(value))
      isInvalid.value = false
  }

  function commit(event?: Event) {
    isEditing.value = false
    // An unedited value must not be re-parsed: that would round fractional channels
    // and drop the hue of a grey shown as hex.
    if (inputValue.value === formatValue(color.value))
      return

    // Text that does not parse is dropped and marks the field invalid; the input reverts
    // to the model.
    isInvalid.value = !isParsable(inputValue.value)
    if (!isInvalid.value) {
      if (channel.value) {
        const range = getChannelRange(channel.value)
        const clamped = Math.max(range.min, Math.min(range.max, Number.parseFloat(inputValue.value)))
        applyChange(setChannelValue(color.value, channel.value, clamped), event)
      }
      else {
        applyChange(parseColor(inputValue.value.trim()), event)
      }
    }
    resetInput()
  }

  function addHexValue(delta: number, event?: Event) {
    const rgb = convertToRgb(color.value)
    const hexInt = (Math.round(rgb.r) << 16) | (Math.round(rgb.g) << 8) | Math.round(rgb.b)
    const clamped = Math.min(Math.max(hexInt + Math.trunc(delta), MIN_HEX_INT), MAX_HEX_INT)
    applyChange(parseColor(`#${clamped.toString(16).padStart(6, '0')}`), event)
  }

  function stepChannel(delta: number, event?: Event) {
    const ch = channel.value!
    const { min, max } = getChannelRange(ch)
    // Snap to the step grid so a fractional value (s = 11.1) moves to the next whole step.
    const next = snapValueToStep(getChannelValue(color.value, ch) + delta, min, max, getStep())
    applyChange(setChannelValue(color.value, ch, next), event)
  }

  function step(delta: number, event?: Event) {
    if (disabled.value || readonly.value)
      return
    isEditing.value = false
    if (channel.value)
      stepChannel(delta, event)
    else
      addHexValue(delta, event)
    resetInput()
  }

  function setToBound(bound: 'min' | 'max', event?: Event) {
    if (disabled.value || readonly.value)
      return
    isEditing.value = false
    if (channel.value)
      applyChange(setChannelValue(color.value, channel.value, getChannelRange(channel.value)[bound]), event)
    else
      addHexValue(bound === 'max' ? MAX_HEX_INT : -MAX_HEX_INT, event)
    resetInput()
  }

  const increment = (event?: Event) => step(getStep(), event)
  const decrement = (event?: Event) => step(-getStep(), event)
  const incrementPage = (event?: Event) => step(getStep() * PAGE_STEP_MULTIPLIER, event)
  const decrementPage = (event?: Event) => step(-getStep() * PAGE_STEP_MULTIPLIER, event)
  const incrementToMax = (event?: Event) => setToBound('max', event)
  const decrementToMin = (event?: Event) => setToBound('min', event)

  function handleWheel(event: WheelEvent) {
    if (disableWheelChange.value || disabled.value || readonly.value)
      return

    event.preventDefault()

    if (event.deltaY > 0)
      decrement(event)
    else
      increment(event)
  }

  const context: ColorFieldRootContext = {
    color,
    inputValue,
    invalid,
    channel,
    colorSpace,
    disabled,
    readonly,
    disableWheelChange,
    placeholder,
    updateValue,
    commit,
    increment,
    decrement,
    incrementToMax,
    decrementToMin,
    incrementPage,
    decrementPage,
    handleWheel,
  }

  const root = createPartSurface<ColorFieldRootState>(() => ({ role: 'group' }), () => ({ disabled: disabled.value, readonly: readonly.value, invalid: invalid.value }))
  return {
    modelValue,
    color,
    disabled,
    setColor,
    lastChangeDetails,
    isControlled,
    root,
    context,
    createInputSurface: () => createColorFieldInputSurface(context),
    inputValue: computed(() => inputValue.value),
    invalid,
    updateValue,
    commit,
    increment,
    decrement,
    incrementPage,
    decrementPage,
    incrementToMax,
    decrementToMin,
    handleWheel,
  }
}

export type ColorFieldInputState = { disabled: boolean, readonly: boolean, invalid: boolean }

const ALLOWED_INPUT_RE = /[\d.-]/

/**
 * Once per input; owns focus and IME composition state.
 * @internal
 */
export function createColorFieldInputSurface(rootContext: ColorFieldRootContext) {
  const isFocused = ref(false)
  const { isComposing, handleCompositionStart, handleCompositionEnd } = useComposing()

  const inputMode = computed(() => {
    return rootContext.channel.value ? 'numeric' : 'text'
  })

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement
    rootContext.updateValue(target.value)
  }

  function handleBlur(event: FocusEvent) {
    isFocused.value = false
    rootContext.commit(event)
  }

  function handleFocus() {
    isFocused.value = true
  }

  function handleWheel(event: WheelEvent) {
    if (!isFocused.value)
      return
    rootContext.handleWheel(event)
  }

  function handleKeydown(event: KeyboardEvent) {
    // Don't step/commit mid-composition, keys are used for IME candidate navigation and commit.
    // `isComposing` stays true until the tick after `compositionend`, so the commit keydown
    // (which can report `event.isComposing === false`) is still skipped.
    if (isComposing.value || event.isComposing)
      return
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        rootContext.increment(event)
        break
      case 'ArrowDown':
        event.preventDefault()
        rootContext.decrement(event)
        break
      case 'PageUp':
        event.preventDefault()
        rootContext.incrementPage(event)
        break
      case 'PageDown':
        event.preventDefault()
        rootContext.decrementPage(event)
        break
      case 'Home':
        event.preventDefault()
        rootContext.decrementToMin(event)
        break
      case 'End':
        event.preventDefault()
        rootContext.incrementToMax(event)
        break
      case 'Enter':
        event.preventDefault()
        rootContext.commit(event)
        break
    }
  }

  // Handle numeric key validation for channel mode
  function handleBeforeInput(event: InputEvent) {
    if (event.isComposing)
      return
    if (!rootContext.channel.value)
      return // No validation for hex mode

    const target = event.target as HTMLInputElement
    const data = event.data

    // Allow numbers, decimal point, minus sign
    if (data && !ALLOWED_INPUT_RE.test(data)) {
      event.preventDefault()
      return
    }

    // Check the resulting value would be valid
    const nextValue = target.value.slice(0, target.selectionStart ?? undefined)
      + (data ?? '')
      + target.value.slice(target.selectionEnd ?? undefined)

    // Allow empty or partial values while typing
    if (nextValue === '-' || nextValue === '.' || nextValue === '-.')
      return

    const numValue = parseFloat(nextValue)
    if (isNaN(numValue)) {
      event.preventDefault()
    }
  }
  return createPartSurface<ColorFieldInputState>(() => ({
    'type': 'text',
    'inputmode': inputMode.value,
    'value': rootContext.inputValue.value,
    'placeholder': rootContext.placeholder.value,
    'disabled': rootContext.disabled.value,
    'readonly': rootContext.readonly.value,
    // Set when a commit rejects the text; cleared by an edit that parses or a committed change.
    'aria-invalid': rootContext.invalid.value ? 'true' : undefined,
    'onInput': handleInput,
    'onBlur': handleBlur,
    'onFocus': handleFocus,
    'onKeydown': handleKeydown,
    'onWheel': handleWheel,
    'onBeforeinput': handleBeforeInput,
    'onCompositionstart': handleCompositionStart,
    'onCompositionend': handleCompositionEnd,
  }), () => ({ disabled: rootContext.disabled.value, readonly: rootContext.readonly.value, invalid: rootContext.invalid.value }))
}
