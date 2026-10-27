import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { ColorSliderRootContext, ColorSliderRootProps } from './ColorSliderRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, PartSurface } from '@/shared'
import type { Color } from '@/shared/color'
import type { SliderRootProps } from '@/Slider'
import { computed, toValue } from 'vue'
import { createPartSurface, useControllableState } from '@/shared'
import { colorToHex, convertToSpace, getChannelColorSpace, getChannelName, getChannelRange, getChannelValue, getSliderBackgroundStyle, isEqualColor, normalizeColor, setChannelValue } from '@/shared/color'
import { createChangeEndTracker } from '@/shared/color/changeEnd'

type Inputs = Pick<ColorSliderRootProps, 'orientation' | 'dir' | 'disabled' | 'inverted' | 'channel' | 'colorSpace' | 'step' | 'modelValue' | 'defaultValue'>
export type ColorSliderChangeReason = 'slider'
export type UseColorSliderProps = { [K in keyof Inputs]: MaybeRefOrGetter<Inputs[K]> } & {
  /** Called with every accepted color; same payload as `onUpdate`. */
  onColorUpdate?: (color: Color) => void
  /** Called with the hex serialization of every accepted color (lossy: drops hue on greys and sub-byte precision). */
  onHexUpdate?: (hex: string) => void
  onChange?: (value: Color) => void
  onChangeEnd?: (value: Color) => void
  emit?: (event: any, ...args: any[]) => void
  onBeforeUpdate?: (value: Color, details: ChangeEventDetails<ColorSliderChangeReason>) => void
  onUpdate?: (value: Color, details: ChangeEventDetails<ColorSliderChangeReason>) => void
}

export type ColorSliderRootState = { disabled: boolean }
export interface UseColorSliderReturn {
  /** The model as passed in (`string | Color`); every emitted value is a `Color`. */
  readonly modelValue: ComputedRef<string | Color>
  /** The model as a `Color` in the slider's color space (the `colorSpace` prop, unless the channel is outside it). */
  readonly color: ComputedRef<Readonly<Color>>
  readonly disabled: ComputedRef<boolean>
  readonly isControlled: ComputedRef<boolean>
  readonly lastChangeDetails: Readonly<Ref<ChangeEventDetails<ColorSliderChangeReason>>>
  setColor: (color: Color, reason?: ColorSliderChangeReason | BaseChangeReason, event?: Event) => boolean
  readonly root: PartSurface<ColorSliderRootState>
  readonly context: { readonly [K in keyof ColorSliderRootContext]: ColorSliderRootContext[K] extends Ref ? Readonly<ColorSliderRootContext[K]> : ColorSliderRootContext[K] }
  readonly channelValue: ComputedRef<number>
  readonly min: ComputedRef<number>
  readonly max: ComputedRef<number>
  readonly step: ComputedRef<number>
  readonly sliderValue: ComputedRef<readonly number[]>
  readonly sliderProps: ComputedRef<Pick<SliderRootProps, 'orientation' | 'disabled' | 'inverted' | 'min' | 'max' | 'step' | 'modelValue'> & {
    'onUpdate:modelValue': (value: number[]) => void
    'onValueCommit': (value: number[]) => void
  }>
  readonly track: PartSurface<ColorSliderTrackState>
  readonly thumb: PartSurface<ColorSliderThumbState>
  setValue: (values: number[], reason?: ColorSliderChangeReason | BaseChangeReason, event?: Event) => void
  /** Ends the current interaction. Pass SliderRoot's `valueCommit` payload when forwarding it. */
  handleValueCommit: (values?: number[]) => void
}

/**
 * Headless ColorSlider state. Compose SliderRoot/Track/Thumb for pointer and keyboard navigation.
 *
 * The model accepts `string | Color` and every emit carries a `Color` in the slider's
 * color space. The channel value is derived from the model alone.
 *
 * @experimental
 * @lifecycle pure
 */
export function useColorSlider(props: UseColorSliderProps): UseColorSliderReturn {
  const orientation = computed(() => toValue(props.orientation) ?? 'horizontal')
  const dir = computed(() => toValue(props.dir) ?? 'ltr')
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const inverted = computed(() => toValue(props.inverted) ?? false)
  const channel = computed(() => toValue(props.channel))
  const colorSpace = computed(() => toValue(props.colorSpace) ?? 'hsl')
  const stepProp = computed(() => toValue(props.step))

  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<string | Color, ColorSliderChangeReason>({
    prop: props.modelValue,
    defaultValue: () => toValue(props.defaultValue) ?? '#000000',
    isEqual: isEqualColor,
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate as ((value: string | Color, details: ChangeEventDetails<ColorSliderChangeReason>) => void) | undefined,
    onUpdate: props.onUpdate as ((value: string | Color, details: ChangeEventDetails<ColorSliderChangeReason>) => void) | undefined,
  })

  // A string model is parsed once per change, then read in the space that holds the
  // channel, so a hue slider on an HSL grey keeps its hue.
  const parsed = computed(() => normalizeColor(modelValue.value ?? '#000000'))
  const workingSpace = computed(() => getChannelColorSpace(channel.value, colorSpace.value))
  const color = computed(() => convertToSpace(parsed.value, workingSpace.value))

  const changeEnd = createChangeEndTracker({
    current: () => parsed.value,
    isControlled: () => isControlled.value,
    onChangeEnd: (value) => {
      props.onChangeEnd?.(value)
      props.emit?.('changeEnd', value)
    },
  })
  // SliderRoot emits `valueCommit` for a keyboard step *before* the value update it
  // commits; such a commit is held until that update arrives.
  let commitRequested = false

  function setColor(newColor: Color, reason: ColorSliderChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
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

  const channelRange = computed(() => getChannelRange(channel.value))
  const min = computed(() => channelRange.value.min)
  const max = computed(() => channelRange.value.max)
  const step = computed(() => stepProp.value ?? channelRange.value.step)

  const channelValue = computed(() => getChannelValue(color.value, channel.value))
  const sliderValue = computed(() => [channelValue.value])

  function setValue(newValue: number[], reason: ColorSliderChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    const commitNow = commitRequested
    commitRequested = false
    const clamped = Math.max(min.value, Math.min(max.value, newValue[0]))
    if (clamped === channelValue.value)
      return
    const previous = parsed.value
    const newColor = setChannelValue(color.value, channel.value, clamped)
    if (setColor(newColor, reason, event)) {
      changeEnd.record(previous, newColor)
      props.onChange?.(newColor)
      props.emit?.('change', newColor)
      if (commitNow)
        changeEnd.commit()
    }
  }

  function handleValueCommit(values?: number[]) {
    // A pointer release commits the value the model already holds. A keyboard step
    // commits a value it has not written yet: that step is a whole interaction of its
    // own, so anything left over (a drag back to its start, which SliderRoot never
    // commits, or updates a controlled parent rejected) is dropped.
    if (values && values[0] !== channelValue.value) {
      changeEnd.discard()
      commitRequested = true
      return
    }
    changeEnd.commit()
  }

  const context: ColorSliderRootContext = {
    color,
    channelValue,
    channel,
    colorSpace,
    orientation,
    dir,
    disabled,
    inverted,
    min,
    max,
    step,
  }

  const sliderProps = computed(() => ({
    'modelValue': sliderValue.value,
    'onUpdate:modelValue': (value: number[]) => setValue(value, 'slider'),
    'onValueCommit': handleValueCommit,
    'orientation': orientation.value,
    'disabled': disabled.value,
    'inverted': inverted.value,
    'min': min.value,
    'max': max.value,
    'step': step.value,
  }))
  const root = createPartSurface<ColorSliderRootState>(() => ({
    'role': 'group',
    'aria-disabled': disabled.value || undefined,
  }), () => ({ disabled: disabled.value }))
  return {
    modelValue,
    color,
    disabled,
    setColor,
    lastChangeDetails,
    isControlled,
    root,
    sliderProps,
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
 * Context-pure track gradient, layered over SliderTrack. The gradient follows the
 * slider's orientation, `inverted` and reading direction.
 * @internal
 */
export function getColorSliderTrackSurface(rootContext: ColorSliderRootContext) {
  const backgroundStyle = computed(() => {
    return getSliderBackgroundStyle(
      rootContext.color.value,
      rootContext.channel.value,
      rootContext.colorSpace.value,
      {
        orientation: rootContext.orientation.value,
        dir: rootContext.dir.value,
        inverted: rootContext.inverted.value,
      },
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
