import type { MaybeRefOrGetter, Ref } from 'vue'
import type { ColorSliderRootContext, ColorSliderRootProps } from './ColorSliderRoot.vue'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import type { Color, ColorChannel as ColorChannelType, ColorSpace } from '@/shared/color'
import { computed, ref, toValue, watch } from 'vue'
import { createPartSurface, useControllableState } from '@/shared'
import { colorToString, convertToHsb, convertToHsl, convertToRgb, getChannelName, getChannelRange, getChannelValue, getSliderBackgroundStyle, normalizeColor, setChannelValue } from '@/shared/color'

type Inputs = Pick<ColorSliderRootProps, 'orientation' | 'disabled' | 'inverted' | 'channel' | 'colorSpace' | 'step' | 'modelValue' | 'defaultValue'>
export type ColorSliderChangeReason = 'slider'
export type UseColorSliderProps = { [K in keyof Inputs]: MaybeRefOrGetter<Inputs[K]> } & {
  emit?: (event: any, ...args: any[]) => void
  onBeforeUpdate?: (value: string | Color, details: ChangeEventDetails<ColorSliderChangeReason>) => void
  onUpdate?: (value: string | Color, details: ChangeEventDetails<ColorSliderChangeReason>) => void
}

export type ColorSliderRootState = { disabled: boolean }
export type UseColorSliderReturn = ReturnType<typeof useColorSlider>

/**
 * Headless ColorSlider state. Call in setup or an effect scope to dispose synchronization watchers.
 * Compose SliderRoot/Track/Thumb for pointer and keyboard navigation.
 * @experimental
 * @lifecycle setup
 */
export function useColorSlider(props: UseColorSliderProps) {
  const orientation = computed(() => toValue(props.orientation) ?? 'horizontal')
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const inverted = computed(() => toValue(props.inverted) ?? false)
  const channel = computed(() => toValue(props.channel))
  const colorSpace = computed(() => toValue(props.colorSpace) ?? 'hsl')
  const stepProp = computed(() => toValue(props.step))

  // Normalize the model value to a Color object
  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<string | Color, ColorSliderChangeReason>({
    prop: props.modelValue,
    defaultValue: () => toValue(props.defaultValue) ?? '#000000',
    // Distinct channel values can serialize to the same hex (grayscale hue or
    // sub-byte precision). Each color action must still pass the cancellation gate.
    isEqual: () => false,
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })

  // Convert a color to the native color space for the given channel.
  // This ensures setChannelValue/getChannelValue operate without cross-space round-trips.
  function toNativeSpace(color: Color, ch: ColorChannelType, space: ColorSpace): Color {
    switch (ch) {
      case 'hue':
      case 'lightness':
        return convertToHsl(color)
      case 'saturation':
        return space === 'hsb' ? convertToHsb(color) : convertToHsl(color)
      case 'brightness':
        return convertToHsb(color)
      case 'red':
      case 'green':
      case 'blue':
        return convertToRgb(color)
      case 'alpha':
        return color
      default:
        return color
    }
  }

  // Internal color ref that preserves color space precision.
  // Convert to the channel's native space to avoid cross-space round-trips during drag.
  const internalColor = ref<Color>(toNativeSpace(normalizeColor(modelValue.value ?? toValue(props.defaultValue) ?? '#000000'), channel.value, colorSpace.value))

  // Check if a color is achromatic (hue information is lost in hex round-trips)
  function isAchromatic(color: Color): boolean {
    const hsl = convertToHsl(color)
    return hsl.s === 0 || hsl.l === 0 || hsl.l >= 100
  }

  const channelRange = computed(() => getChannelRange(channel.value))

  // Sync internal color from external modelValue changes (e.g. parent updates)
  watch(() => modelValue.value, (newVal) => {
    if (newVal == null)
      return
    const parsed = normalizeColor(newVal)
    const currentHex = colorToString(internalColor.value, 'hex')
    const newHex = colorToString(parsed, 'hex')
    // Only update if the external value actually changed (avoid overwriting
    // precision during our own drag updates)
    if (currentHex !== newHex) {
      const nativeColor = toNativeSpace(parsed, channel.value, colorSpace.value)
      const currentChannelVal = getChannelValue(internalColor.value, channel.value)
      const newChannelVal = getChannelValue(nativeColor, channel.value)

      // Preserve this slider's channel value when:
      // 1. Color is achromatic (hue completely lost in hex round-trip)
      // 2. Channel value diff is within 2% of range (8-bit RGB quantization drift)
      // We still update the rest of the color so the track gradient stays correct.
      const range = channelRange.value.max - channelRange.value.min
      const shouldPreserve = (channel.value === 'hue' && isAchromatic(parsed))
        || Math.abs(currentChannelVal - newChannelVal) < range * 0.02

      if (shouldPreserve) {
        internalColor.value = setChannelValue(nativeColor, channel.value, currentChannelVal)
      }
      else {
        internalColor.value = nativeColor
      }
    }
  })

  const color = computed(() => internalColor.value)

  function setColor(newColor: Color, reason: ColorSliderChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    const hexString = colorToString(newColor, 'hex')
    const changed = setState(hexString, reason, event)
    if (!changed)
      return false
    internalColor.value = newColor
    props.emit?.('update:color', newColor)
    return true
  }

  // Get channel range
  const min = computed(() => channelRange.value.min)
  const max = computed(() => channelRange.value.max)
  const step = computed(() => stepProp.value ?? channelRange.value.step)

  // Current channel value
  const channelValue = computed(() => getChannelValue(color.value, channel.value))

  // Convert channel value to array format for SliderRoot
  const sliderValue = computed(() => [channelValue.value])

  function setValue(newValue: number[], reason: ColorSliderChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    const clamped = Math.max(min.value, Math.min(max.value, newValue[0]))
    const newColor = setChannelValue(color.value, channel.value, clamped)
    if (setColor(newColor, reason, event))
      props.emit?.('change', colorToString(newColor, 'hex'))
  }

  function handleValueCommit() {
    props.emit?.('changeEnd', colorToString(color.value, 'hex'))
  }

  const context: ColorSliderRootContext = {
    color: computed(() => color.value) as Ref<Color>,
    channelValue,
    channel,
    colorSpace,
    orientation,
    disabled,
    inverted,
    min,
    max,
    step,
  }

  const root = createPartSurface<ColorSliderRootState>(() => ({
    'modelValue': sliderValue.value,
    'onUpdate:modelValue': (value: number[]) => setValue(value, 'slider'),
    'onValueCommit': handleValueCommit,
    'orientation': orientation.value,
    'disabled': disabled.value,
    'inverted': inverted.value,
    'min': min.value,
    'max': max.value,
    'step': step.value,
  }), () => ({ disabled: disabled.value }))
  return {
    modelValue,
    color,
    disabled,
    setColor,
    lastChangeDetails,
    isControlled,
    root,
    context,
    track: getColorSliderTrackSurface(context),
    thumb: getColorSliderThumbSurface(context),
    channelValue,
    min,
    max,
    step,
    sliderValue,
    handleValueCommit,
    setValue,
  }
}

export type ColorSliderTrackState = Record<string, never>

/**
 * Context-pure track gradient, layered over SliderTrack.
 * @internal
 */
export function getColorSliderTrackSurface(rootContext: ColorSliderRootContext) {
  const backgroundStyle = computed(() => {
    return getSliderBackgroundStyle(
      rootContext.color.value,
      rootContext.channel.value,
      rootContext.colorSpace.value,
    )
  })
  return createPartSurface<ColorSliderTrackState>(() => ({ style: backgroundStyle.value }), () => ({}))
}

export type ColorSliderThumbState = Record<string, never>

/**
 * Context-pure channel description, layered over SliderThumb.
 * @internal
 */
export function getColorSliderThumbSurface(rootContext: ColorSliderRootContext) {
  const ariaLabel = computed(() => {
    return getChannelName(rootContext.channel.value)
  })

  const ariaValueText = computed(() => {
    const value = rootContext.channelValue.value
    const channel = rootContext.channel.value
    if (channel === 'alpha') {
      return `${Math.round(value)}%`
    }
    return String(Math.round(value))
  })
  return createPartSurface<ColorSliderThumbState>(() => ({ 'aria-label': ariaLabel.value, 'aria-valuetext': ariaValueText.value }), () => ({}))
}
