import type { MaybeRefOrGetter, Ref } from 'vue'
import type { ColorFieldRootContext, ColorFieldRootProps } from './ColorFieldRoot.vue'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import type { Color } from '@/shared/color'
import { computed, ref, toValue, watch } from 'vue'
import { createPartSurface, useComposing, useControllableState } from '@/shared'
import { colorToString, convertToRgb, getChannelRange, getChannelValue, isValidColor, normalizeColor, parseColor, setChannelValue } from '@/shared/color'

type Inputs = Pick<ColorFieldRootProps, 'colorSpace' | 'channel' | 'disabled' | 'readonly' | 'disableWheelChange' | 'placeholder' | 'step' | 'modelValue' | 'defaultValue'>
export type ColorFieldChangeReason = 'keyboard' | 'wheel' | 'blur'
export type UseColorFieldProps = { [K in keyof Inputs]: MaybeRefOrGetter<Inputs[K]> } & {
  emit?: (event: any, ...args: any[]) => void
  onBeforeUpdate?: (value: string | Color, details: ChangeEventDetails<ColorFieldChangeReason>) => void
  onUpdate?: (value: string | Color, details: ChangeEventDetails<ColorFieldChangeReason>) => void
}

export type ColorFieldRootState = { disabled: boolean, readonly: boolean }
export type UseColorFieldReturn = ReturnType<typeof useColorField>

/**
 * Headless ColorField state. Call in setup or an effect scope to dispose synchronization watchers.
 *
 * @experimental
 * @lifecycle setup
 */
export function useColorField(props: UseColorFieldProps = {}) {
  const colorSpace = computed(() => toValue(props.colorSpace) ?? 'hsl')
  const channel = computed(() => toValue(props.channel))
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const readonly = computed(() => toValue(props.readonly) ?? false)
  const disableWheelChange = computed(() => toValue(props.disableWheelChange) ?? false)
  const placeholder = computed(() => toValue(props.placeholder))
  const stepProp = computed(() => toValue(props.step))

  // Normalize the model value
  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<string | Color, ColorFieldChangeReason>({
    prop: props.modelValue,
    defaultValue: () => toValue(props.defaultValue) ?? '#000000',
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })

  const color = computed(() => normalizeColor(modelValue.value ?? '#000000'))

  function reasonFromEvent(event?: Event): ColorFieldChangeReason | BaseChangeReason {
    return event?.type === 'wheel' ? 'wheel' : event?.type === 'blur' ? 'blur' : event ? 'keyboard' : 'imperative-action'
  }

  function setColor(newColor: Color, reason: ColorFieldChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    const hexString = colorToString(newColor, 'hex')
    const changed = setState(hexString, reason, event)
    if (!changed)
      return false

    props.emit?.('update:color', newColor)
    return true
  }

  // Input value for the text field
  const inputValue = ref('')
  const isEditing = ref(false)

  // Update input value when color changes (unless user is editing)
  watch(() => color.value, (newColor) => {
    if (!isEditing.value) {
      inputValue.value = formatValue(newColor)
    }
  }, { immediate: true })

  function formatValue(c: Color): string {
    if (channel.value) {
      const value = getChannelValue(c, channel.value)
      if (channel.value === 'alpha') {
        return String(Math.round(value))
      }
      return String(Math.round(value))
    }
    // Hex mode
    return colorToString(c, 'hex')
  }

  // The effective step size
  const MIN_HEX_INT = 0x000000
  const MAX_HEX_INT = 0xFFFFFF
  const PAGE_STEP_MULTIPLIER = 10

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
  }

  function commit(event?: Event) {
    isEditing.value = false

    if (channel.value) {
      // Channel mode - parse as number
      const numValue = parseFloat(inputValue.value)
      if (!isNaN(numValue)) {
        const range = getChannelRange(channel.value)
        const clamped = Math.max(range.min, Math.min(range.max, numValue))
        setColor(setChannelValue(color.value, channel.value, clamped), reasonFromEvent(event), event)
      }
      // Reset to formatted value
      inputValue.value = formatValue(color.value)
    }
    else {
      // Hex mode - parse as color
      const trimmed = inputValue.value.trim()
      if (isValidColor(trimmed)) {
        setColor(parseColor(trimmed), reasonFromEvent(event), event)
      }
      // Reset to formatted value
      inputValue.value = formatValue(color.value)
    }
  }

  function addHexValue(delta: number, event?: Event) {
    const intDelta = Math.trunc(delta)
    const hexInt = color.value.space === 'rgb'
      ? ((Math.round((color.value as any).r) << 16) | (Math.round((color.value as any).g) << 8) | Math.round((color.value as any).b))
      : (() => {
          const rgb = convertToRgb(color.value)
          return (Math.round(rgb.r) << 16) | (Math.round(rgb.g) << 8) | Math.round(rgb.b)
        })()
    const clamped = Math.min(Math.max(hexInt + intDelta, MIN_HEX_INT), MAX_HEX_INT)
    const hex = `#${clamped.toString(16).padStart(6, '0')}`
    setColor(parseColor(hex), reasonFromEvent(event), event)
    inputValue.value = formatValue(color.value)
  }

  function increment(event?: Event) {
    if (disabled.value || readonly.value)
      return
    const step = getStep()
    if (channel.value) {
      const currentValue = getChannelValue(color.value, channel.value)
      setColor(setChannelValue(color.value, channel.value, currentValue + step), reasonFromEvent(event), event)
      inputValue.value = formatValue(color.value)
    }
    else {
      addHexValue(step, event)
    }
  }

  function decrement(event?: Event) {
    if (disabled.value || readonly.value)
      return
    const step = getStep()
    if (channel.value) {
      const currentValue = getChannelValue(color.value, channel.value)
      setColor(setChannelValue(color.value, channel.value, currentValue - step), reasonFromEvent(event), event)
      inputValue.value = formatValue(color.value)
    }
    else {
      addHexValue(-step, event)
    }
  }

  function incrementPage(event?: Event) {
    if (disabled.value || readonly.value)
      return
    const step = getStep() * PAGE_STEP_MULTIPLIER
    if (channel.value) {
      const currentValue = getChannelValue(color.value, channel.value)
      setColor(setChannelValue(color.value, channel.value, currentValue + step), reasonFromEvent(event), event)
      inputValue.value = formatValue(color.value)
    }
    else {
      addHexValue(step, event)
    }
  }

  function decrementPage(event?: Event) {
    if (disabled.value || readonly.value)
      return
    const step = getStep() * PAGE_STEP_MULTIPLIER
    if (channel.value) {
      const currentValue = getChannelValue(color.value, channel.value)
      setColor(setChannelValue(color.value, channel.value, currentValue - step), reasonFromEvent(event), event)
      inputValue.value = formatValue(color.value)
    }
    else {
      addHexValue(-step, event)
    }
  }

  function incrementToMax(event?: Event) {
    if (disabled.value || readonly.value)
      return
    if (channel.value) {
      const range = getChannelRange(channel.value)
      setColor(setChannelValue(color.value, channel.value, range.max), reasonFromEvent(event), event)
      inputValue.value = formatValue(color.value)
    }
    else {
      addHexValue(MAX_HEX_INT, event)
    }
  }

  function decrementToMin(event?: Event) {
    if (disabled.value || readonly.value)
      return
    if (channel.value) {
      const range = getChannelRange(channel.value)
      setColor(setChannelValue(color.value, channel.value, range.min), reasonFromEvent(event), event)
      inputValue.value = formatValue(color.value)
    }
    else {
      addHexValue(-MAX_HEX_INT, event)
    }
  }

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
    color: computed(() => color.value) as Ref<Color>,
    inputValue,
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

  const root = createPartSurface<ColorFieldRootState>(() => ({ role: 'group' }), () => ({ disabled: disabled.value, readonly: readonly.value }))
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
    inputValue,
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

export type ColorFieldInputState = { disabled: boolean, readonly: boolean }

const ALLOWED_INPUT_RE = /[\d.-]/

/**
 * Once per input; owns focus and IME composition state.
 * @internal
 */
export function createColorFieldInputSurface(rootContext: ColorFieldRootContext) {
  const isFocused = ref(false)
  const { isComposing, handleCompositionStart, handleCompositionEnd } = useComposing()

  const inputType = computed(() => {
    return rootContext.channel.value ? 'text' : 'text'
  })

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
    type: inputType.value,
    inputmode: inputMode.value,
    value: rootContext.inputValue.value,
    placeholder: rootContext.placeholder.value,
    disabled: rootContext.disabled.value,
    readonly: rootContext.readonly.value,
    onInput: handleInput,
    onBlur: handleBlur,
    onFocus: handleFocus,
    onKeydown: handleKeydown,
    onWheel: handleWheel,
    onBeforeinput: handleBeforeInput,
    onCompositionstart: handleCompositionStart,
    onCompositionend: handleCompositionEnd,
  }), () => ({ disabled: rootContext.disabled.value, readonly: rootContext.readonly.value }))
}
