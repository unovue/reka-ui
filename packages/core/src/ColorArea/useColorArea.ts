import type { ComputedRef, CSSProperties, MaybeRefOrGetter, Ref } from 'vue'
import type { ColorAreaRootContext, ColorAreaRootProps } from './ColorAreaRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, PartSurface } from '@/shared'
import type { Color, ColorChannel } from '@/shared/color'
import { computed, nextTick, ref, toValue } from 'vue'
import { createPartSurface, useControllableState } from '@/shared'
import { colorToHex, convertToSpace, getAreaBackgroundStyle, getChannelColorSpace, getChannelName, getChannelRange, getChannelValue, isEqualColor, normalizeColor, setChannelValues } from '@/shared/color'
import { createChangeEndTracker } from '@/shared/color/changeEnd'
import { convertValueToPercentage, linearScale } from './utils'

type Inputs = Pick<ColorAreaRootProps, 'colorSpace' | 'xChannel' | 'yChannel' | 'disabled' | 'modelValue' | 'defaultValue' | 'dir'>
export type ColorAreaChangeReason = 'pointer' | 'keyboard'
/** One of the area's two axes; each has its own hidden range input. */
export type ColorAreaAxis = 'x' | 'y'
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
  /** The visually hidden `input type="range"` for the x channel; render it inside the thumb. */
  readonly xInput: PartSurface<ColorAreaInputState>
  /** The visually hidden `input type="range"` for the y channel; render it inside the thumb. */
  readonly yInput: PartSurface<ColorAreaInputState>
  /** Binds an axis input element, so pointer interaction and the arrow keys can focus it. */
  setInputElement: (axis: ColorAreaAxis, element: HTMLInputElement | null | undefined) => void
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
  const xInputRef = ref<HTMLInputElement>()
  const yInputRef = ref<HTMLInputElement>()
  const focusedAxis = ref<ColorAreaAxis>('x')

  function focusInput(axis: ColorAreaAxis = focusedAxis.value) {
    const input = (axis === 'y' ? yInputRef.value : xInputRef.value) ?? xInputRef.value
    if (input)
      input.focus()
    else
      thumbRef.value?.focus()
  }

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
    xInputRef,
    yInputRef,
    focusedAxis,
    focusInput,
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
    xInput: getColorAreaInputSurface(context, 'x'),
    yInput: getColorAreaInputSurface(context, 'y'),
    createAreaSurface: (element: Ref<HTMLElement | undefined>) => createColorAreaAreaSurface(context, element),
    areaStyles,
    xValue,
    yValue,
    updateValues,
    commitValues,
    thumbRef: computed(() => thumbRef.value),
    setThumbElement: (element) => { thumbRef.value = element ?? undefined },
    setInputElement: (axis, element) => { (axis === 'y' ? yInputRef : xInputRef).value = element ?? undefined },
  }
}

export type ColorAreaAreaState = { disabled: boolean }
export type ColorAreaThumbState = { disabled: boolean }
export type ColorAreaInputState = { disabled: boolean }

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

    // Focus the input of the last focused axis when dragging starts
    rootContext.focusInput()
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
      case 'Enter':
        // A range input submits its form on Enter; the v2 thumb (a span) did not, and
        // ColorSlider's thumb does not.
        if (event.target === rootContext.xInputRef.value || event.target === rootContext.yInputRef.value)
          event.preventDefault()
        return
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
    // Keep focus on the input of the axis the key moves, so a screen reader announces
    // that channel's new value.
    const target = event.target
    if (target && (target === rootContext.xInputRef.value || target === rootContext.yInputRef.value))
      rootContext.focusInput(yDelta ? 'y' : 'x')
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
  // No role: the area is the pointer surface. Each channel is exposed by its own range
  // input in the thumb, and arrow keys pressed there bubble up to this handler.
  return createPartSurface<ColorAreaAreaState>(() => ({
    style: { touchAction: 'none' },
    onKeydown: handleKeyDown,
    onPointerdown: handlePointerDown,
    onPointermove: handlePointerMove,
    onPointerup: handlePointerUp,
  }), () => ({ disabled: rootContext.disabled.value }))
}

/**
 * Context-pure thumb surface shared by the shell and standalone consumers. The thumb
 * is the visual marker only: its two hidden range inputs carry focus and semantics.
 * @internal
 */
export function getColorAreaThumbSurface(rootContext: ColorAreaRootContext) {
  const position = getColorAreaThumbPosition(rootContext)
  return createPartSurface<ColorAreaThumbState>(() => ({
    style: {
      position: 'absolute',
      left: position.value.left,
      top: position.value.top,
      transform: 'translate(-50%, -50%)',
      touchAction: 'none',
    },
  }), () => ({ disabled: rootContext.disabled.value }))
}

/** The thumb's `left` / `top` within the area, mirrored in RTL. */
function getColorAreaThumbPosition(rootContext: ColorAreaRootContext) {
  return computed(() => {
    const x = convertValueToPercentage(rootContext.xValue.value, rootContext.xRange.value.min, rootContext.xRange.value.max)
    const y = convertValueToPercentage(rootContext.yValue.value, rootContext.yRange.value.min, rootContext.yRange.value.max)
    return {
      left: `${rootContext.dir.value === 'rtl' ? 100 - x : x}%`,
      top: `${100 - y}%`,
    }
  })
}

/**
 * Where a channel input sits. `'thumb'`: inside the thumb element, at its center.
 * `'area'`: next to the thumb (an `asChild` thumb, which cannot hold the inputs), at the
 * thumb's position in the area. Either way a screen reader's focus rect lands on the thumb.
 */
export type ColorAreaInputAnchor = 'thumb' | 'area'

// Same rules as `VisuallyHidden`: out of sight, still focusable and in the accessibility tree.
const VISUALLY_HIDDEN_STYLE = {
  position: 'absolute',
  border: 0,
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  wordWrap: 'normal',
} as const

/**
 * Context-pure surface for one axis's visually hidden `input type="range"`.
 *
 * Each channel is a native range input with its own name, value and orientation, as in
 * React Aria's ColorArea, so it reads like any slider and stays adjustable with a mobile
 * screen reader's swipe gestures. Arrow keys bubble to the area's handler, which keeps the
 * existing step, RTL and focus rules; an `input` event (assistive technology setting the
 * value) writes that one channel. One input is in the tab order at a time.
 * @internal
 */
export function getColorAreaInputSurface(rootContext: ColorAreaRootContext, axis: ColorAreaAxis, anchor: MaybeRefOrGetter<ColorAreaInputAnchor> = 'thumb') {
  const position = getColorAreaThumbPosition(rootContext)
  const isX = axis === 'x'
  const channel = computed(() => isX ? rootContext.xChannel.value : rootContext.yChannel.value)
  const otherChannel = computed(() => isX ? rootContext.yChannel.value : rootContext.xChannel.value)
  const range = computed(() => isX ? rootContext.xRange.value : rootContext.yRange.value)
  const value = computed(() => isX ? rootContext.xValue.value : rootContext.yValue.value)
  const otherValue = computed(() => isX ? rootContext.yValue.value : rootContext.xValue.value)
  // Every channel steps by 1, and a browser snaps a range input's value to its step anyway:
  // round it here so the value assistive technology reads is the same everywhere.
  const inputValue = computed(() => Math.round(value.value))

  function handleInput(event: Event) {
    const input = event.target as HTMLInputElement
    const next = Number(input.value)
    const changed = !Number.isNaN(next) && rootContext.updateValues(
      isX ? next : rootContext.xValue.value,
      isX ? rootContext.yValue.value : next,
      'keyboard',
      event,
    )
    if (changed)
      rootContext.commitValues()
    // Once a controlled parent has applied (or rejected) the update, show the model's
    // value: a rejected update does not re-render, so the input would keep the new value.
    nextTick(() => {
      input.value = String(inputValue.value)
    })
  }

  return createPartSurface<ColorAreaInputState>(() => ({
    'type': 'range',
    'min': range.value.min,
    'max': range.value.max,
    'step': range.value.step,
    'value': inputValue.value,
    'disabled': rootContext.disabled.value,
    'tabindex': rootContext.focusedAxis.value === axis ? 0 : -1,
    'aria-label': getChannelName(channel.value),
    'aria-roledescription': '2D slider',
    'aria-orientation': isX ? 'horizontal' : 'vertical',
    // The channel's own value, then the other channel for context.
    'aria-valuetext': `${inputValue.value}, ${getChannelName(otherChannel.value)} ${Math.round(otherValue.value)}`,
    'style': {
      ...VISUALLY_HIDDEN_STYLE,
      ...(toValue(anchor) === 'area' ? position.value : { left: '50%', top: '50%' }),
    },
    'onFocus': () => { rootContext.focusedAxis.value = axis },
    'onInput': handleInput,
  }), () => ({ disabled: rootContext.disabled.value }))
}
