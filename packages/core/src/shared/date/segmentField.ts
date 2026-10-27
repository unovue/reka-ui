import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { SegmentFieldChangeReason } from './useDateFieldSegment'
import type { ChangeEventDetails, Formatter, PartSurface } from '@/shared'
import type { DateStep, DateValue, HourCycle, SegmentPart, SegmentValueObj } from '@/shared/date/types'
import type { Direction } from '@/shared/types'
import { computed, getCurrentInstance, nextTick, onMounted, ref, toValue, watch } from 'vue'
import { createPartSurface } from '@/shared/partSurface'
import { useKbd } from '@/shared/useKbd'
import { isSegmentNavigationKey } from './segment'
import { useDateFieldSegment } from './useDateFieldSegment'
import { useSegmentNavigation } from './useSegmentNavigation'

// =============================================================================
// Internal building blocks shared by the four segmented field composables
// (`useDateField`, `useTimeField`, `useDateRangeField`, `useTimeRangeField`),
// #2723. The segment keyboard / IME logic itself lives in
// `useDateFieldSegment`; this file wraps it into a `PartSurface` and holds the
// root surface and the DOM-bound segment navigation every field repeats.
// =============================================================================

/** Semantic state of a segmented field root (`data-disabled`, `data-readonly`, `data-invalid`). */
export type SegmentFieldRootState = { disabled: boolean, readonly: boolean, invalid: boolean }

/**
 * Semantic state of one segment. `placeholder` is set while an editable segment
 * is empty, `segment` names the non-editable kinds (`literal`, `timeZoneName`),
 * and `readonly` marks the time zone segment, which is never editable.
 */
export type SegmentFieldSegmentState = {
  disabled: boolean
  invalid: boolean
  placeholder: boolean
  segment: 'literal' | 'timeZoneName' | undefined
  readonly: boolean
}

const EMPTY_TRACKED_PARTS = ['day', 'month', 'year', 'hour', 'minute', 'second'] as const

/** The context slice a segment reads; every field root context satisfies it. */
export interface SegmentFieldSegmentContext {
  placeholder: Ref<DateValue>
  hourCycle: HourCycle
  step: Ref<DateStep>
  stepSnapping?: Ref<boolean>
  formatter: Formatter
  disabled: Ref<boolean>
  readonly: Ref<boolean>
  isInvalid: Ref<boolean>
  focusNext: () => void
  setFocusedElement: (el: HTMLElement) => void
}

export interface CreateSegmentFieldSegmentSurfaceOptions {
  context: SegmentFieldSegmentContext
  /** The segment values this segment edits (a range field passes the start or end values). */
  segmentValues: Ref<SegmentValueObj>
  /** The value this segment edits (a range field passes the start or end value). */
  modelValue: Readonly<Ref<DateValue | undefined>>
  setModelValue: (value: DateValue | undefined, reason: SegmentFieldChangeReason, event?: Event) => void
  part: MaybeRefOrGetter<SegmentPart>
  /**
   * Functional selector attributes (`data-reka-date-field-segment`, …) the
   * field's segment navigation queries. Not semantic state, so they live in `props`.
   */
  selectors: () => Record<string, string>
  /** Snap to `step` when the segment loses focus (`stepSnapping`). @default true */
  snapOnFocusOut?: boolean
}

/**
 * The surface of one segment (`DateFieldInput`, `TimeFieldInput`, …). Holds
 * per-segment typing state, so call it EXACTLY ONCE per rendered segment.
 *
 * @internal
 */
export function createSegmentFieldSegmentSurface(options: CreateSegmentFieldSegmentSurfaceOptions): PartSurface<SegmentFieldSegmentState> {
  const { context, segmentValues, part } = options
  const hasLeftFocus = ref(true)
  const lastKeyZero = ref(false)

  const segment = useDateFieldSegment({
    hasLeftFocus,
    lastKeyZero,
    placeholder: context.placeholder,
    hourCycle: context.hourCycle,
    step: context.step,
    stepSnapping: context.stepSnapping,
    segmentValues,
    formatter: context.formatter,
    part,
    disabled: context.disabled,
    readonly: context.readonly,
    focusNext: context.focusNext,
    modelValue: options.modelValue,
    setModelValue: options.setModelValue,
  })

  const snapOnFocusOut = options.snapOnFocusOut ?? true

  return createPartSurface<SegmentFieldSegmentState>(
    () => {
      const currentPart = toValue(part)
      const disabled = context.disabled.value
      const readonly = context.readonly.value
      const invalid = context.isInvalid.value
      const handlers = currentPart === 'literal'
        ? {}
        : {
            onMousedown: segment.handleSegmentClick,
            onKeydown: segment.handleSegmentKeydown,
            onBeforeinput: segment.handleSegmentBeforeInput,
            onCompositionstart: segment.handleSegmentCompositionStart,
            onCompositionend: segment.handleSegmentCompositionEnd,
            onFocusout: (event: FocusEvent) => {
              hasLeftFocus.value = true
              if (snapOnFocusOut)
                segment.handleSegmentFocusOut(event)
            },
            onFocusin: (event: FocusEvent) => {
              context.setFocusedElement(event.target as HTMLElement)
            },
          }
      return {
        ...segment.attributes.value,
        'contenteditable': disabled || readonly ? false : currentPart !== 'literal',
        ...options.selectors(),
        'aria-disabled': disabled ? true : undefined,
        'aria-readonly': readonly ? true : undefined,
        'aria-invalid': invalid ? true : undefined,
        ...handlers,
      }
    },
    () => {
      const currentPart = toValue(part)
      const values = segmentValues.value as Record<string, unknown>
      return {
        disabled: context.disabled.value,
        invalid: context.isInvalid.value,
        placeholder: (EMPTY_TRACKED_PARTS as readonly string[]).includes(currentPart)
          && currentPart in values
          && values[currentPart] === null,
        segment: currentPart === 'literal' || currentPart === 'timeZoneName' ? currentPart : undefined,
        readonly: currentPart === 'timeZoneName',
      }
    },
  )
}

export interface SegmentFieldRootSurfaceOptions {
  disabled: Ref<boolean>
  readonly: Ref<boolean>
  isInvalid: Ref<boolean>
  dir: Ref<Direction>
  onKeydown: (event: KeyboardEvent) => void
}

/** The `role="group"` root surface of a segmented field. @internal */
export function createSegmentFieldRootSurface(options: SegmentFieldRootSurfaceOptions): PartSurface<SegmentFieldRootState> {
  return createPartSurface<SegmentFieldRootState>(
    () => ({
      'role': 'group',
      'aria-disabled': options.disabled.value ? true : undefined,
      'dir': options.dir.value,
      'onKeydown': options.onKeydown,
    }),
    () => ({
      disabled: options.disabled.value,
      readonly: options.readonly.value,
      invalid: options.isInvalid.value,
    }),
  )
}

export interface UseSegmentFieldNavigationOptions {
  /** The field's root element; segment elements are queried inside it. */
  parentElement: Ref<HTMLElement | undefined>
  dir: Ref<Direction>
  /** The attribute every segment carries (`data-reka-date-field-segment` / `data-reka-time-field-segment`). */
  segmentAttribute: string
  /** Attributes that together identify a segment (adds the range `…-segment-type`). */
  segmentAttributes: string[]
}

/**
 * The DOM-bound part every field repeats: the ordered set of focusable
 * segments, ArrowLeft / ArrowRight navigation, and auto-advance. Segments are
 * collected on mount; call `refreshSegmentElements()` after the segment order
 * changes (a locale change does it for you).
 *
 * @lifecycle setup — collects the segments `onMounted` when called inside a component.
 * @internal
 */
export function useSegmentFieldNavigation(options: UseSegmentFieldNavigationOptions) {
  const segmentElements = ref<Set<HTMLElement>>(new Set())
  const currentFocusedElement = ref<HTMLElement | null>(null)
  const kbd = useKbd()

  function refreshSegmentElements() {
    const parent = options.parentElement.value
    segmentElements.value.clear()
    if (!parent)
      return
    parent.querySelectorAll(`[${options.segmentAttribute}]`).forEach((item) => {
      if (item.getAttribute(options.segmentAttribute) !== 'literal')
        segmentElements.value.add(item as HTMLElement)
    })
  }

  if (getCurrentInstance())
    onMounted(refreshSegmentElements)

  const { nextFocusableSegment, prevFocusableSegment, focusNext } = useSegmentNavigation({
    segmentElements,
    currentFocusedElement,
    dir: options.dir,
    segmentAttributes: options.segmentAttributes,
  })

  function onKeydown(e: KeyboardEvent) {
    // Don't navigate between segments mid-composition, arrow keys are used for IME candidate navigation
    if (e.isComposing)
      return
    if (!isSegmentNavigationKey(e.key))
      return
    if (e.key === kbd.ARROW_LEFT)
      prevFocusableSegment.value?.focus()
    if (e.key === kbd.ARROW_RIGHT)
      nextFocusableSegment.value?.focus()
  }

  function setFocusedElement(el: HTMLElement) {
    currentFocusedElement.value = el
  }

  /** Focus the first segment (the hidden input's focus handler and `FieldLabel` use this). */
  function focusFirstSegment() {
    Array.from(segmentElements.value)[0]?.focus()
  }

  return { segmentElements, refreshSegmentElements, setFocusedElement, focusNext, focusFirstSegment, onKeydown }
}

/**
 * Keeps the formatter on the current locale; on a change the segment order may
 * differ, so the segment elements are re-collected after the next render.
 * Declared before the segment-value sync watchers, so they format with the new locale.
 *
 * @internal
 */
export function watchSegmentFieldLocale(locale: Ref<string>, formatter: Formatter, refreshSegmentElements: () => void) {
  watch(locale, (value) => {
    if (formatter.getLocale() !== value) {
      formatter.setLocale(value)
      nextTick(refreshSegmentElements)
    }
  })
}

/** `true` when both are empty, or both are the same calendar value (time and zone included). @internal */
export function isSameTemporalValue(a: { toString: () => string } | null | undefined, b: { toString: () => string } | null | undefined): boolean {
  if (a == null || b == null)
    return a == null && b == null
  return (a as any).calendar?.identifier === (b as any).calendar?.identifier
    && a.toString() === b.toString()
}

/**
 * `true` when the latest `setState` call was cancelled through
 * `beforeUpdate:<name>`; `false` for an applied or an unchanged value.
 *
 * @internal
 */
export function wasCanceled(lastChangeDetails: Readonly<Ref<ChangeEventDetails<any>>>, before: ChangeEventDetails<any>) {
  return lastChangeDetails.value !== before && lastChangeDetails.value.isCanceled
}

/**
 * Wires a child root's `beforeUpdate:<name>` to the owning parent's model: the
 * parent's `setState` runs during the child's `beforeUpdate` phase (emitting the
 * parent's own `beforeUpdate:` / `update:` pair with the same reason and event),
 * and a parent-side cancel cancels the child's change too. Used by the pickers,
 * whose field and calendar parts are controlled by the picker's models.
 *
 * @internal
 */
export function bridgeChange<T, R extends string>(
  setState: (value: T, reason?: any, event?: Event) => boolean,
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<R>>>,
) {
  return (value: T, details: ChangeEventDetails<any>) => {
    const before = lastChangeDetails.value
    setState(value, details.reason, details.event)
    if (wasCanceled(lastChangeDetails, before))
      details.cancel()
  }
}

export type { SegmentFieldChangeReason }

/** The segment values a field shows, as `{ part, value }` pairs (literals included). */
export type SegmentContents = { part: SegmentPart, value: string }[]

/** @internal */
export function editableSegments(contents: ComputedRef<SegmentContents>) {
  return computed(() => contents.value.filter(({ part }) => part !== 'literal'))
}
