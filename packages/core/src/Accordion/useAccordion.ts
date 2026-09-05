import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { AccordionRootContext, AccordionRootProps } from './AccordionRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, DisclosureState, PartSurface } from '@/shared'
import type { DataOrientation, Direction, SingleOrMultipleType } from '@/shared/types'
import { computed, ref, toValue } from 'vue'
import { createPartSurface, disclosureState, useArrowNavigation, useControllableState } from '@/shared'

/** Why the expanded value changed; carried as `details.reason` on every change. */
export type AccordionChangeReason = 'trigger-press' | 'content-found'

let accordionCount = 0

export interface UseAccordionProps {
  /** Controlled value, or a writable ref for standalone ref-owned state. */
  modelValue?: MaybeRefOrGetter<string | string[] | undefined>
  /** Component emit; fires beforeUpdate:modelValue then update:modelValue. */
  emit?: (event: any, ...args: any[]) => void
  /** Runs before a change; call details.cancel() to keep the current value. */
  onBeforeUpdate?: (value: string | string[] | undefined, details: ChangeEventDetails<AccordionChangeReason>) => void
  /** Runs after an accepted change. */
  onUpdate?: (value: string | string[] | undefined, details: ChangeEventDetails<AccordionChangeReason>) => void
  /** Initial selected value(s) for standalone uncontrolled use. */
  defaultValue?: string | string[]
  /** @defaultValue `'single'` (or inferred from an array value). */
  type?: MaybeRefOrGetter<SingleOrMultipleType | undefined>
  /** @defaultValue `false` */
  collapsible?: MaybeRefOrGetter<boolean | undefined>
  /** @defaultValue `'ltr'` */
  dir?: MaybeRefOrGetter<Direction | undefined>
  /** @defaultValue `false` */
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** @defaultValue `'vertical'` */
  orientation?: MaybeRefOrGetter<DataOrientation | undefined>
  /** @defaultValue `true` */
  unmountOnHide?: MaybeRefOrGetter<boolean | undefined>
  /** Root element used by the item keyboard-navigation surface. */
  parentElement?: Ref<HTMLElement | undefined>
  /** Unique per-call default. SSR consumers must supply a stable baseId. */
  baseId?: string
}

export interface UseAccordionReturn {
  modelValue: ComputedRef<string | string[] | undefined>
  isSingle: ComputedRef<boolean>
  /** Toggle a value; returns false when the change is cancelled. */
  changeModelValue: (value: string, reason?: AccordionChangeReason | BaseChangeReason, event?: Event) => boolean
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<AccordionChangeReason>>>
  isControlled: ComputedRef<boolean>
  getItemSurface: (value: MaybeRefOrGetter<string>, options?: AccordionItemSurfaceOptions) => AccordionItemSurfaceReturn
  context: AccordionRootContext<AccordionRootProps>
}

export type AccordionPartState = {
  state: DisclosureState
  disabled: boolean
  orientation: DataOrientation
}

export interface AccordionItemSurfaceOptions {
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** SSR-stable trigger id supplied by the rendering shell. */
  triggerId?: MaybeRefOrGetter<string | undefined>
  unmountOnHide?: MaybeRefOrGetter<boolean | undefined>
  /** Base id used when a standalone caller does not supply a trigger id. */
  baseId?: string
}

export interface AccordionItemSurfaceContext {
  open: ComputedRef<boolean>
  disabled: ComputedRef<boolean>
  state?: ComputedRef<AccordionPartState>
  triggerId: MaybeRefOrGetter<string>
  value: ComputedRef<string>
}

export interface AccordionItemSurfaceReturn {
  open: ComputedRef<boolean>
  disabled: ComputedRef<boolean>
  item: PartSurface<AccordionPartState>
  header: PartSurface<AccordionPartState>
  trigger: PartSurface<AccordionPartState>
  content: PartSurface<AccordionPartState>
  context: AccordionItemSurfaceContext
}

/** Header semantic state derived from the provided item context. */
export function getAccordionHeaderSurface(
  rootContext: AccordionRootContext<AccordionRootProps>,
  itemContext: AccordionItemSurfaceContext,
): PartSurface<AccordionPartState> {
  return createPartSurface(
    () => ({}),
    getAccordionPartState(rootContext, itemContext),
  )
}

/**
 * Content aria/style/event surface. Presence, measurement, animation suppression,
 * and `beforematch` remain responsibilities of `CollapsibleContent`.
 */
export function getAccordionContentSurface(
  rootContext: AccordionRootContext<AccordionRootProps>,
  itemContext: AccordionItemSurfaceContext,
): PartSurface<AccordionPartState> {
  return createPartSurface(
    () => ({
      'role': 'region',
      'aria-labelledby': toValue(itemContext.triggerId),
      'style': `
        --reka-accordion-content-width: var(--reka-collapsible-content-width);
        --reka-accordion-content-height: var(--reka-collapsible-content-height);
      `,
      'onContentFound': (event?: Event) => rootContext.changeModelValue(itemContext.value.value, 'content-found', event),
    }),
    getAccordionPartState(rootContext, itemContext),
  )
}

function getAccordionPartState(
  rootContext: AccordionRootContext<AccordionRootProps>,
  itemContext: AccordionItemSurfaceContext,
): ComputedRef<AccordionPartState> {
  return itemContext.state ?? computed(() => ({
    state: disclosureState(itemContext.open.value),
    disabled: itemContext.disabled.value,
    orientation: rootContext.orientation ?? 'vertical',
  }))
}

export function getAccordionTriggerSurface(
  rootContext: AccordionRootContext<AccordionRootProps>,
  itemContext: AccordionItemSurfaceContext,
): PartSurface<AccordionPartState> {
  function changeItem(event?: MouseEvent) {
    const triggerDisabled = rootContext.isSingle.value && itemContext.open.value && !rootContext.collapsible
    if (itemContext.disabled.value || triggerDisabled)
      return

    rootContext.changeModelValue(itemContext.value.value, 'trigger-press', event)
  }

  return createPartSurface(
    () => ({
      'id': toValue(itemContext.triggerId),
      'aria-disabled': itemContext.disabled.value || undefined,
      'aria-expanded': itemContext.open.value || false,
      'data-reka-collection-item': '',
      'disabled': itemContext.disabled.value,
      'onClick': changeItem,
    }),
    getAccordionPartState(rootContext, itemContext),
  )
}

/**
 * Creates one Accordion item and its descendant surfaces. Call exactly once per
 * standalone item: the factory owns the item's open/disabled state and closes its
 * keyboard handler over the root element used to collect triggers.
 *
 * Existing SFCs keep their established provide/inject context. AccordionItem uses
 * this factory for its wrapper, while Header/Trigger/Content call the same exported
 * descendant builders with the injected context.
 */
export function getAccordionItemSurface(
  rootContext: AccordionRootContext<AccordionRootProps>,
  value: MaybeRefOrGetter<string>,
  options: AccordionItemSurfaceOptions = {},
): AccordionItemSurfaceReturn {
  const open = computed(() => rootContext.isSingle.value
    ? toValue(value) === rootContext.modelValue.value
    : Array.isArray(rootContext.modelValue.value) && rootContext.modelValue.value.includes(toValue(value)))
  const disabled = computed(() => rootContext.disabled.value || (toValue(options.disabled) ?? false))
  const state = computed<AccordionPartState>(() => ({
    state: disclosureState(open.value),
    disabled: disabled.value,
    orientation: rootContext.orientation ?? 'vertical',
  }))

  function handleKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement
    const collectionItems = Array.from(rootContext.parentElement.value?.querySelectorAll<HTMLElement>('[data-reka-collection-item]') ?? [])
    if (!collectionItems.includes(target))
      return

    useArrowNavigation(event, target, rootContext.parentElement.value, {
      arrowKeyOptions: rootContext.orientation,
      dir: rootContext.direction.value,
      focus: true,
    })
  }

  const item = createPartSurface(
    () => ({
      disabled: disabled.value,
      open: open.value,
      unmountOnHide: toValue(options.unmountOnHide) ?? rootContext.unmountOnHide.value,
      onKeydown: handleKeydown,
    }),
    state,
  )
  const itemContext: AccordionItemSurfaceContext = {
    open,
    disabled,
    state,
    triggerId: computed(() => toValue(options.triggerId) ?? `${options.baseId ?? 'reka-accordion'}-trigger-${toValue(value)}`),
    value: computed(() => toValue(value)),
  }
  const header = getAccordionHeaderSurface(rootContext, itemContext)
  const trigger = getAccordionTriggerSurface(rootContext, itemContext)
  const content = getAccordionContentSurface(rootContext, itemContext)

  return { open, disabled, item, header, trigger, content, context: itemContext }
}

/**
 * Headless Accordion state and part factories. The root renders no Accordion-
 * specific attributes, so there is no empty root `PartSurface`: model state and
 * the root context begin here, and rendered surfaces begin at each item.
 *
 * Standalone consumers get single/multiple selection, collapse guards, disabled
 * state, semantic part surfaces, keyboard navigation, and ids derived from
 * `(baseId, value)`. They provide a root element ref for arrow navigation and may
 * override an item's `triggerId` when needed. SSR consumers must supply a stable
 * `baseId`; the default counter is unique per call but not stable across hydration.
 * The `.vue` shells keep `useId`, forwarding, and Collapsible wrappers for presence,
 * measurement, animation, and browser find-in-page handling.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useAccordion(props: UseAccordionProps = {}): UseAccordionReturn {
  const baseId = props.baseId ?? `reka-accordion-${++accordionCount}`
  const isSingle = computed(() => {
    const inferredValue = toValue(props.modelValue) ?? props.defaultValue
    return (toValue(props.type) ?? (Array.isArray(inferredValue) ? 'multiple' : 'single')) === 'single'
  })
  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<string | string[] | undefined, AccordionChangeReason>({
    prop: props.modelValue,
    defaultValue: () => props.defaultValue ?? (isSingle.value ? undefined : []),
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })

  function changeModelValue(value: string, reason: AccordionChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    if (isSingle.value)
      return setState(modelValue.value === value ? undefined : value, reason, event)

    const values = Array.isArray(modelValue.value)
      ? [...modelValue.value]
      : [modelValue.value].filter((current): current is string => Boolean(current))
    const index = values.indexOf(value)
    if (index === -1)
      values.push(value)
    else
      values.splice(index, 1)
    return setState(values, reason, event)
  }

  const disabled = computed(() => toValue(props.disabled) ?? false)
  const direction = computed<Direction>(() => toValue(props.dir) ?? 'ltr')
  const unmountOnHide = computed(() => toValue(props.unmountOnHide) ?? true)
  const parentElement = props.parentElement ?? ref<HTMLElement>()

  const context: AccordionRootContext<AccordionRootProps> = {
    disabled,
    direction,
    get orientation() {
      return toValue(props.orientation) ?? 'vertical'
    },
    parentElement,
    changeModelValue,
    isSingle,
    modelValue,
    get collapsible() {
      return toValue(props.collapsible) ?? false
    },
    unmountOnHide,
  }

  return {
    modelValue,
    isSingle,
    changeModelValue,
    lastChangeDetails,
    isControlled,
    getItemSurface: (value, options) => getAccordionItemSurface(context, value, {
      baseId,
      ...options,
    }),
    context,
  }
}
