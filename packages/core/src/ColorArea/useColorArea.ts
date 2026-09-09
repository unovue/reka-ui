import type { MaybeRefOrGetter, Ref } from 'vue'
import type { ColorAreaRootContext, ColorAreaRootProps } from './ColorAreaRoot.vue'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import type { Color, ColorChannel } from '@/shared/color'
import { computed, nextTick, ref, toValue, watch } from 'vue'
import { createPartSurface, useControllableState } from '@/shared'
import { colorToString, convertToHsb, convertToHsl, getAreaBackgroundStyle, getChannelName, getChannelRange, getChannelValue, normalizeColor, setChannelValues } from '@/shared/color'
import { convertValueToPercentage, linearScale } from './utils'

type Inputs = Pick<ColorAreaRootProps, 'colorSpace' | 'xChannel' | 'yChannel' | 'disabled' | 'modelValue' | 'defaultValue'>
export type ColorAreaChangeReason = 'pointer' | 'keyboard'
export type UseColorAreaProps = { [K in keyof Inputs]: MaybeRefOrGetter<Inputs[K]> } & {
  emit?: (event: any, ...args: any[]) => void
  onBeforeUpdate?: (value: string | Color, details: ChangeEventDetails<ColorAreaChangeReason>) => void
  onUpdate?: (value: string | Color, details: ChangeEventDetails<ColorAreaChangeReason>) => void
}

export type ColorAreaRootState = { disabled: boolean }
export type UseColorAreaReturn = ReturnType<typeof useColorArea>

/**
 * Headless ColorArea state. Call in setup or an effect scope to dispose synchronization watchers.
 *
 * @experimental
 * @lifecycle setup
 */
export function useColorArea(props: UseColorAreaProps = {}) {
  const colorSpace = computed(() => toValue(props.colorSpace) ?? 'hsl')
  const xChannel = computed(() => toValue(props.xChannel) ?? 'hue')
  const yChannel = computed(() => toValue(props.yChannel) ?? 'saturation')
  const disabled = computed(() => toValue(props.disabled) ?? false)

  // Normalize the model value to a Color object
  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<string | Color, ColorAreaChangeReason>({
    prop: props.modelValue,
    defaultValue: () => toValue(props.defaultValue) ?? '#ff0000',
    // Distinct channel values can serialize to the same hex (grayscale hue or
    // sub-byte precision). Each color action must still pass the cancellation gate.
    isEqual: () => false,
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })

  // The actual color object for rendering
  const color = computed(() => normalizeColor(modelValue.value ?? '#000000'))

  function setColor(newColor: Color, reason: ColorAreaChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    const hexString = colorToString(newColor, 'hex')
    const changed = setState(hexString, reason, event)
    if (!changed)
      return false

    props.emit?.('update:color', newColor)
    return true
  }

  // Get channel ranges
  const xRange = computed(() => getChannelRange(xChannel.value))
  const yRange = computed(() => getChannelRange(yChannel.value))

  // Store exact channel values as refs to avoid floating-point drift
  // Initialize from the color value (rounded to nearest integer)
  const xValue = ref(Math.round(getChannelValue(color.value, xChannel.value)))
  const yValue = ref(Math.round(getChannelValue(color.value, yChannel.value)))

  // Store the hue separately to preserve it when saturation is 0 (grayscale)
  const hueValue = ref(colorSpace.value === 'hsl'
    ? convertToHsl(color.value).h
    : colorSpace.value === 'hsb'
      ? convertToHsb(color.value).h
      : 0)

  // Track when we're in the middle of an update to prevent circular sync
  let isUpdating = false

  // Sync channel values when color changes externally
  watch(() => color.value, (newColor) => {
    // Skip if we just triggered this update ourselves
    if (isUpdating)
      return

    const newX = Math.round(getChannelValue(newColor, xChannel.value))
    const newY = Math.round(getChannelValue(newColor, yChannel.value))

    // Only update if the rounded value meaningfully changed.
    // During drag, xValue/yValue store exact floats (e.g. 80.45).
    // External updates (e.g. hue slider) should not snap these to integers.
    if (Math.round(xValue.value) !== newX)
      xValue.value = newX
    if (Math.round(yValue.value) !== newY)
      yValue.value = newY

    // Update hue if saturation is not 0 (to preserve hue for grayscale colors)
    if (colorSpace.value === 'hsl') {
      const hsl = convertToHsl(newColor)
      if (hsl.s > 0)
        hueValue.value = hsl.h
    }
    else if (colorSpace.value === 'hsb') {
      const hsb = convertToHsb(newColor)
      if (hsb.s > 0)
        hueValue.value = hsb.h
    }
  }, { immediate: true })

  // Background styles for the color area
  // Use preserved hue to ensure background doesn't change when saturation is 0
  const areaStyles = computed(() => {
    // Create a color with the preserved hue for background computation
    let bgColor = color.value
    if (colorSpace.value === 'hsl' || colorSpace.value === 'hsb') {
      if (colorSpace.value === 'hsl') {
        bgColor = { space: 'hsl', h: hueValue.value, s: 100, l: 50, alpha: 1 }
      }
      else {
        bgColor = { space: 'hsb', h: hueValue.value, s: 100, b: 100, alpha: 1 }
      }
    }
    return getAreaBackgroundStyle(bgColor, xChannel.value, yChannel.value, colorSpace.value)
  })

  function updateValues(x: number, y: number, reason: ColorAreaChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    const clampedX = Math.max(xRange.value.min, Math.min(xRange.value.max, x))
    const clampedY = Math.max(yRange.value.min, Math.min(yRange.value.max, y))

    // Prevent watch from syncing back to xValue/yValue
    isUpdating = true

    // Update color from exact values (with preserved hue)
    const channels: Array<{ channel: ColorChannel, value: number }> = [
      { channel: xChannel.value, value: clampedX },
      { channel: yChannel.value, value: clampedY },
    ]

    // Preserve hue only when it is NOT directly controlled by an axis
    const usesHueAxis = xChannel.value === 'hue' || yChannel.value === 'hue'
    if (!usesHueAxis && (colorSpace.value === 'hsl' || colorSpace.value === 'hsb')) {
      channels.push({ channel: 'hue', value: hueValue.value })
    }

    if (setColor(setChannelValues(color.value, channels), reason, event)) {
      xValue.value = clampedX
      yValue.value = clampedY
    }

    // Re-enable watch sync after Vue has processed the update
    nextTick(() => {
      isUpdating = false
    })
  }

  function commitValues() {
    props.emit?.('changeEnd', colorToString(color.value, 'hex'))
  }

  const thumbRef = ref<HTMLElement>()

  const context: ColorAreaRootContext = {
    color: computed(() => color.value) as Ref<Color>,
    xValue,
    yValue,
    xChannel,
    yChannel,
    colorSpace,
    disabled,
    xRange,
    yRange,
    thumbRef,
    updateValues,
    commitValues,
  }

  const root = createPartSurface<ColorAreaRootState>(() => ({ 'role': 'group', 'aria-disabled': disabled.value ? 'true' : undefined }), () => ({ disabled: disabled.value }))
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
    thumbRef,
  }
}

export type ColorAreaAreaState = { disabled: boolean }
export type ColorAreaThumbState = { disabled: boolean }

/**
 * Once per interactive area; owns pointer capture state.
 * @internal
 */
export function createColorAreaAreaSurface(rootContext: ColorAreaRootContext, areaElement: Ref<HTMLElement | undefined>) {
  const isDragging = ref(false)

  // Convert pointer position to channel values
  function getValuesFromPointer(event: PointerEvent) {
    const rect = areaElement.value!.getBoundingClientRect()

    const xInput: [number, number] = [0, rect.width]
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
    const xStepSize = rootContext.xRange.value.step * stepMultiplier
    const yStepSize = rootContext.yRange.value.step * stepMultiplier

    let xDelta = 0
    let yDelta = 0

    switch (event.key) {
      case 'ArrowLeft':
        xDelta = -xStepSize
        break
      case 'ArrowRight':
        xDelta = xStepSize
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
    rootContext.updateValues(
      rootContext.xValue.value + xDelta,
      rootContext.yValue.value + yDelta,
      'keyboard',
      event,
    )
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
    'aria-valuenow': rootContext.xValue.value,
    'aria-valuetext': ariaValueText.value,
    'aria-orientation': 'horizontal',
    'style': {
      position: 'absolute',
      left: `${xPercent.value}%`,
      top: `${100 - yPercent.value}%`,
      transform: 'translate(-50%, -50%)',
      touchAction: 'none',
    },
  }), () => ({ disabled: rootContext.disabled.value }))
}
