import type { ComputedRef, CSSProperties, MaybeRefOrGetter, Ref } from 'vue'
import type { ColorAreaRootContext, ColorAreaRootProps } from './ColorAreaRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, PartSurface } from '@/shared'
import type { Color, ColorChannel } from '@/shared/color'
import { computed, ref, toValue } from 'vue'
import { createPartSurface, useControllableState } from '@/shared'
import { colorToHex, convertToSpace, getAreaBackgroundStyle, getChannelColorSpace, getChannelName, getChannelRange, getChannelValue, isEqualColor, normalizeColor, setChannelValues } from '@/shared/color'
import { createChangeEndTracker } from '@/shared/color/changeEnd'
import { convertValueToPercentage, linearScale } from './utils'

type Inputs = Pick<ColorAreaRootProps, 'colorSpace' | 'xChannel' | 'yChannel' | 'disabled' | 'modelValue' | 'defaultValue' | 'dir'>
export type ColorAreaChangeReason = 'pointer' | 'keyboard'
export type UseColorAreaProps = { [K in keyof Inputs]: MaybeRefOrGetter<Inputs[K]> } & {
  /** Called with every accepted color; same payload as `onUpdate`. */
  onColorUpdate?: (color: Color) => void
  /** Called with the hex serialization of every accepted color (lossy: drops hue on greys and sub-byte precision). */
  onHexUpdate?: (hex: string) => void
  onChange?: (value: Color) => void
  onChangeEnd?: (value: Color) => void
  emit?: (event: any, ...args: any[]) => void
  onBeforeUpdate?: (value: Color, details: ChangeEventDetails<ColorAreaChangeReason>) => void
  onUpdate?: (value: Color, details: ChangeEventDetails<ColorAreaChangeReason>) => void
}

export type ColorAreaRootState = { disabled: boolean }
export interface UseColorAreaReturn {
  /** The model as passed in (`string | Color`); every emitted value is a `Color`. */
  readonly modelValue: ComputedRef<string | Color>
  /** The model parsed to a `Color`. */
  readonly color: ComputedRef<Readonly<Color>>
  readonly disabled: ComputedRef<boolean>
  readonly isControlled: ComputedRef<boolean>
  readonly lastChangeDetails: Readonly<Ref<ChangeEventDetails<ColorAreaChangeReason>>>
  setColor: (color: Color, reason?: ColorAreaChangeReason | BaseChangeReason, event?: Event) => boolean
  readonly root: PartSurface<ColorAreaRootState>
  readonly context: { readonly [K in keyof ColorAreaRootContext]: ColorAreaRootContext[K] extends Ref ? Readonly<ColorAreaRootContext[K]> : ColorAreaRootContext[K] }
  readonly areaStyles: ComputedRef<CSSProperties>
  readonly xValue: ComputedRef<number>
  readonly yValue: ComputedRef<number>
  readonly thumbRef: ComputedRef<HTMLElement | undefined>
  setThumbElement: (element: HTMLElement | null | undefined) => void
  readonly thumb: PartSurface<ColorAreaThumbState>
  createAreaSurface: (element: Ref<HTMLElement | undefined>) => PartSurface<ColorAreaAreaState>
  updateValues: (x: number, y: number, reason?: ColorAreaChangeReason | BaseChangeReason, event?: Event) => boolean
  commitValues: () => void
}

/**
 * Headless ColorArea state. Holds no watchers, so it can be called outside setup.
 *
 * The model accepts `string | Color` and every emit carries a `Color` in the area's
 * color space. The channel values and the thumb are derived from the model alone.
 *
 * @experimental
 * @lifecycle pure
 */
export function useColorArea(props: UseColorAreaProps = {}): UseColorAreaReturn {
  const colorSpace = computed(() => toValue(props.colorSpace) ?? 'hsl')
  const xChannel = computed(() => toValue(props.xChannel) ?? 'hue')
  const yChannel = computed(() => toValue(props.yChannel) ?? 'saturation')
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const dir = computed(() => toValue(props.dir) ?? 'ltr')

  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<string | Color, ColorAreaChangeReason>({
    prop: props.modelValue,
    defaultValue: () => toValue(props.defaultValue) ?? '#ff0000',
    isEqual: isEqualColor,
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate as ((value: string | Color, details: ChangeEventDetails<ColorAreaChangeReason>) => void) | undefined,
    onUpdate: props.onUpdate as ((value: string | Color, details: ChangeEventDetails<ColorAreaChangeReason>) => void) | undefined,
  })

  // A string model is parsed once per change; a Color is used as-is.
  const color = computed(() => normalizeColor(modelValue.value ?? '#000000'))
  // The space that holds both axes: the `colorSpace` prop unless an axis is outside it.
  const workingSpace = computed(() => getChannelColorSpace([xChannel.value, yChannel.value], colorSpace.value))
  const workingColor = computed(() => convertToSpace(color.value, workingSpace.value))

  // `changeEnd` reports an interaction only once the model holds its last color, so a
  // drag back to the start or an update a controlled parent rejected reports nothing.
  const changeEnd = createChangeEndTracker({
    current: () => color.value,
    isControlled: () => isControlled.value,
    onChangeEnd: (value) => {
      props.onChangeEnd?.(value)
      props.emit?.('changeEnd', value)
    },
  })

  function setColor(newColor: Color, reason: ColorAreaChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
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

  const xRange = computed(() => getChannelRange(xChannel.value))
  const yRange = computed(() => getChannelRange(yChannel.value))
  const xValue = computed(() => getChannelValue(workingColor.value, xChannel.value))
  const yValue = computed(() => getChannelValue(workingColor.value, yChannel.value))

  const areaStyles = computed(() => getAreaBackgroundStyle(workingColor.value, xChannel.value, yChannel.value, colorSpace.value, dir.value))

  function updateValues(x: number, y: number, reason: ColorAreaChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    const clampedX = Math.max(xRange.value.min, Math.min(xRange.value.max, x))
    const clampedY = Math.max(yRange.value.min, Math.min(yRange.value.max, y))
    if (clampedX === xValue.value && clampedY === yValue.value)
      return false

    const channels: Array<{ channel: ColorChannel, value: number }> = [
      { channel: xChannel.value, value: clampedX },
      { channel: yChannel.value, value: clampedY },
    ]
    const previous = color.value
    const newColor = setChannelValues(workingColor.value, channels)
    const changed = setColor(newColor, reason, event)
    if (changed) {
      changeEnd.record(previous, newColor)
      props.onChange?.(newColor)
      props.emit?.('change', newColor)
    }
    return changed
  }

  function commitValues() {
    changeEnd.commit()
  }

  const thumbRef = ref<HTMLElement>()

  const context: ColorAreaRootContext = {
    color: workingColor,
    xValue,
    yValue,
    xChannel,
    yChannel,
    colorSpace,
    disabled,
    dir,
    xRange,
    yRange,
    thumbRef,
    updateValues,
    commitValues,
  }

  const root = createPartSurface<ColorAreaRootState>(() => ({ 'role': 'group', 'dir': dir.value, 'aria-disabled': disabled.value ? 'true' : undefined }), () => ({ disabled: disabled.value }))
  return {
    modelValue,
    color,
    disabled,
    setColor,
    lastChangeDetails,
    isControlled,
    root,
    context,
    thumb: getColorAreaThumbSurface(context),
    createAreaSurface: (element: Ref<HTMLElement | undefined>) => createColorAreaAreaSurface(context, element),
    areaStyles,
    xValue,
    yValue,
    updateValues,
    commitValues,
    thumbRef: computed(() => thumbRef.value),
    setThumbElement: (element) => { thumbRef.value = element ?? undefined },
  }
}

export type ColorAreaAreaState = { disabled: boolean }
export type ColorAreaThumbState = { disabled: boolean }

function snapToStep(value: number, step: number) {
  return Math.round(value / step) * step
}

/**
 * Once per interactive area; owns pointer capture state.
 * @internal
 */
export function createColorAreaAreaSurface(rootContext: ColorAreaRootContext, areaElement: Ref<HTMLElement | undefined>) {
  const isDragging = ref(false)

  // Convert pointer position to channel values
  function getValuesFromPointer(event: PointerEvent) {
    const rect = areaElement.value!.getBoundingClientRect()
    const isRtl = rootContext.dir.value === 'rtl'

    // In RTL the x axis is mirrored: the minimum is on the right edge.
    const xInput: [number, number] = isRtl ? [rect.width, 0] : [0, rect.width]
    const xOutput: [number, number] = [rootContext.xRange.value.min, rootContext.xRange.value.max]
    const xScale = linearScale(xInput, xOutput)
    const xValue = xScale(event.clientX - rect.left)

    // Y is inverted (top is max, bottom is min for most channels)
    const yInput: [number, number] = [0, rect.height]
    const yOutput: [number, number] = [rootContext.yRange.value.max, rootContext.yRange.value.min]
    const yScale = linearScale(yInput, yOutput)
    const yValue = yScale(event.clientY - rect.top)

    return { x: xValue, y: yValue }
  }

  function handlePointerDown(event: PointerEvent) {
    if (rootContext.disabled.value)
      return

    const target = event.target as HTMLElement
    target.setPointerCapture(event.pointerId)
    event.preventDefault()

    isDragging.value = true
    const { x, y } = getValuesFromPointer(event)
    rootContext.updateValues(x, y, 'pointer', event)

    // Focus the thumb when dragging starts
    rootContext.thumbRef.value?.focus()
  }

  function handlePointerMove(event: PointerEvent) {
    if (!isDragging.value || rootContext.disabled.value)
      return

    const target = event.target as HTMLElement
    if (target.hasPointerCapture(event.pointerId)) {
      const { x, y } = getValuesFromPointer(event)
      rootContext.updateValues(x, y, 'pointer', event)
    }
  }

  function handlePointerUp(event: PointerEvent) {
    if (!isDragging.value)
      return

    const target = event.target as HTMLElement
    target.releasePointerCapture(event.pointerId)
    isDragging.value = false
    rootContext.commitValues()
  }

  // Keyboard navigation
  function handleKeyDown(event: KeyboardEvent) {
    if (rootContext.disabled.value)
      return

    const stepMultiplier = event.shiftKey ? 10 : 1
    const xStep = rootContext.xRange.value.step
    const yStep = rootContext.yRange.value.step
    const xStepSize = xStep * stepMultiplier
    const yStepSize = yStep * stepMultiplier
    // ArrowLeft and ArrowRight follow the visual direction, so they swap in RTL.
    const xForward = rootContext.dir.value === 'rtl' ? -1 : 1

    let xDelta = 0
    let yDelta = 0

    switch (event.key) {
      case 'ArrowLeft':
        xDelta = -xStepSize * xForward
        break
      case 'ArrowRight':
        xDelta = xStepSize * xForward
        break
      case 'ArrowUp':
        yDelta = yStepSize
        break
      case 'ArrowDown':
        yDelta = -yStepSize
        break
      case 'PageUp':
        yDelta = yStepSize * 10
        break
      case 'PageDown':
        yDelta = -yStepSize * 10
        break
      case 'Home':
        xDelta = -xStepSize * 10
        break
      case 'End':
        xDelta = xStepSize * 10
        break
      default:
        return
    }

    event.preventDefault()
    const x = rootContext.xValue.value
    const y = rootContext.yValue.value
    const changed = rootContext.updateValues(
      xDelta ? snapToStep(x + xDelta, xStep) : x,
      yDelta ? snapToStep(y + yDelta, yStep) : y,
      'keyboard',
      event,
    )
    // Each keyboard step is a complete change, like a pointer release.
    if (changed)
      rootContext.commitValues()
  }
  return createPartSurface<ColorAreaAreaState>(() => ({
    'role': 'application',
    'aria-roledescription': 'Color picker',
    'aria-disabled': rootContext.disabled.value ? 'true' : undefined,
    'style': { touchAction: 'none' },
    'onKeydown': handleKeyDown,
    'onPointerdown': handlePointerDown,
    'onPointermove': handlePointerMove,
    'onPointerup': handlePointerUp,
  }), () => ({ disabled: rootContext.disabled.value }))
}

/**
 * Context-pure thumb surface shared by the shell and standalone consumers.
 * @internal
 */
export function getColorAreaThumbSurface(rootContext: ColorAreaRootContext) {
  const xPercent = computed(() =>
    convertValueToPercentage(
      rootContext.xValue.value,
      rootContext.xRange.value.min,
      rootContext.xRange.value.max,
    ),
  )

  const yPercent = computed(() =>
    convertValueToPercentage(
      rootContext.yValue.value,
      rootContext.yRange.value.min,
      rootContext.yRange.value.max,
    ),
  )

  const ariaLabel = computed(() => {
    return `${getChannelName(rootContext.xChannel.value)}, ${getChannelName(rootContext.yChannel.value)}`
  })

  const ariaValueText = computed(() => {
    return `${getChannelName(rootContext.xChannel.value)} ${Math.round(rootContext.xValue.value)}, ${getChannelName(rootContext.yChannel.value)} ${Math.round(rootContext.yValue.value)}`
  })
  return createPartSurface<ColorAreaThumbState>(() => ({
    'role': 'slider',
    'tabindex': rootContext.disabled.value ? undefined : 0,
    'aria-label': ariaLabel.value,
    'aria-roledescription': 'Color thumb',
    'aria-valuemin': rootContext.xRange.value.min,
    'aria-valuemax': rootContext.xRange.value.max,
    'aria-valuenow': Math.round(rootContext.xValue.value),
    'aria-valuetext': ariaValueText.value,
    'aria-orientation': 'horizontal',
    'style': {
      position: 'absolute',
      left: `${rootContext.dir.value === 'rtl' ? 100 - xPercent.value : xPercent.value}%`,
      top: `${100 - yPercent.value}%`,
      transform: 'translate(-50%, -50%)',
      touchAction: 'none',
    },
  }), () => ({ disabled: rootContext.disabled.value }))
}
