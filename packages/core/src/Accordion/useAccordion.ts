import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { AccordionRootContext, AccordionRootProps } from './AccordionRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, DisclosureState, PartSurface } from '@/shared'
import type { DataOrientation, Direction, SingleOrMultipleType } from '@/shared/types'
import { computed, ref, toValue } from 'vue'
import { getCollapsibleTriggerProps } from '@/Collapsible/useCollapsible'
import { createPartSurface, disclosureState, getterRef, useArrowNavigation, useControllableState } from '@/shared'

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
  /** SSR-stable content id; standalone callers get one derived from `(baseId, value)`. */
  contentId?: MaybeRefOrGetter<string | undefined>
  unmountOnHide?: MaybeRefOrGetter<boolean | undefined>
  /** Base id used when a standalone caller does not supply trigger/content ids. */
  baseId?: string
}

export interface AccordionItemSurfaceContext {
  open: ComputedRef<boolean>
  disabled: ComputedRef<boolean>
  state?: ComputedRef<AccordionPartState>
  triggerId: MaybeRefOrGetter<string>
  /** Omitted by the SFC shells, where Collapsible links trigger and content. */
  contentId?: MaybeRefOrGetter<string>
  value: ComputedRef<string>
}

/** The item wrapper alone: what the `AccordionItem` shell binds. */
export interface AccordionItemStateReturn {
  open: ComputedRef<boolean>
  disabled: ComputedRef<boolean>
  /** Whether closed content should be unmounted rather than `hidden="until-found"`. */
  unmountOnHide: ComputedRef<boolean>
  state: ComputedRef<AccordionPartState>
  item: PartSurface<AccordionPartState>
}

export interface AccordionItemSurfaceReturn extends AccordionItemStateReturn {
  header: PartSurface<AccordionPartState>
  trigger: PartSurface<AccordionPartState>
  /** Standalone content: carries `hidden` (`''`, or `'until-found'` with `unmountOnHide: false`) while closed. */
  content: PartSurface<AccordionPartState>
  /** Call from a `beforematch` listener to open discovered content; ignored when disabled or already open. */
  onContentFound: (event?: Event) => void
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

function getAccordionContentProps(itemContext: AccordionItemSurfaceContext): Record<string, any> {
  return {
    ...contentIdAttr(itemContext, 'id'),
    'role': 'region',
    'aria-labelledby': toValue(itemContext.triggerId),
    'style': `
        --reka-accordion-content-width: var(--reka-collapsible-content-width);
        --reka-accordion-content-height: var(--reka-collapsible-content-height);
      `,
  }
}

// `beforematch` can only reveal content: it never opens a disabled item and never toggles an open one closed.
function createContentFoundHandler(
  rootContext: AccordionRootContext<AccordionRootProps>,
  itemContext: AccordionItemSurfaceContext,
) {
  return (event?: Event) => {
    if (itemContext.disabled.value || itemContext.open.value)
      return
    rootContext.changeModelValue(itemContext.value.value, 'content-found', event)
  }
}

/**
 * Content aria/style/event surface for the `AccordionContent` shell. Presence,
 * `hidden`, measurement, animation suppression, and the `beforematch` listener
 * remain responsibilities of `CollapsibleContent`, which emits `contentFound`.
 */
export function getAccordionContentSurface(
  rootContext: AccordionRootContext<AccordionRootProps>,
  itemContext: AccordionItemSurfaceContext,
): PartSurface<AccordionPartState> {
  const onContentFound = createContentFoundHandler(rootContext, itemContext)
  return createPartSurface(
    () => ({
      ...getAccordionContentProps(itemContext),
      onContentFound,
    }),
    getAccordionPartState(rootContext, itemContext),
  )
}

// Keys are omitted, not set to undefined: a fallthrough `undefined` would override
// the id/aria-controls that the Collapsible shells render.
function contentIdAttr(itemContext: AccordionItemSurfaceContext, key: 'id' | 'aria-controls') {
  const contentId = toValue(itemContext.contentId)
  return contentId === undefined ? {} : { [key]: contentId }
}

// A getter, not a computed: `createPartSurface` only wraps it in a computed when
// a consumer reads `surface.state` on its own.
function getAccordionPartState(
  rootContext: AccordionRootContext<AccordionRootProps>,
  itemContext: Pick<AccordionItemSurfaceContext, 'open' | 'disabled' | 'state'>,
): ComputedRef<AccordionPartState> | (() => AccordionPartState) {
  return itemContext.state ?? (() => ({
    state: disclosureState(itemContext.open.value),
    disabled: itemContext.disabled.value,
    orientation: rootContext.orientation ?? 'vertical',
  }))
}

export function getAccordionTriggerSurface(
  rootContext: AccordionRootContext<AccordionRootProps>,
  itemContext: AccordionItemSurfaceContext,
): PartSurface<AccordionPartState> {
  function changeItem(event?: Event) {
    const triggerDisabled = rootContext.isSingle.value && itemContext.open.value && !rootContext.collapsible
    if (itemContext.disabled.value || triggerDisabled)
      return

    rootContext.changeModelValue(itemContext.value.value, 'trigger-press', event)
  }

  const disclosureTriggerProps = getCollapsibleTriggerProps({
    open: itemContext.open,
    disabled: itemContext.disabled,
    onOpenToggle: changeItem,
  })
  return createPartSurface(
    () => ({
      ...disclosureTriggerProps(),
      'id': toValue(itemContext.triggerId),
      ...contentIdAttr(itemContext, 'aria-controls'),
      'aria-disabled': itemContext.disabled.value || undefined,
      'data-reka-collection-item': '',
    }),
    getAccordionPartState(rootContext, itemContext),
  )
}

/**
 * The item wrapper alone: open/disabled state plus the root-element-backed
 * arrow-key handler. `AccordionItem` uses this; its descendants build their own
 * surfaces from the injected item context.
 */
export function getAccordionItemState(
  rootContext: AccordionRootContext<AccordionRootProps>,
  value: MaybeRefOrGetter<string>,
  options: Pick<AccordionItemSurfaceOptions, 'disabled' | 'unmountOnHide'> = {},
): AccordionItemStateReturn {
  const open = computed(() => rootContext.isSingle.value
    ? toValue(value) === rootContext.modelValue.value
    : Array.isArray(rootContext.modelValue.value) && rootContext.modelValue.value.includes(toValue(value)))
  const disabled = computed(() => rootContext.disabled.value || (toValue(options.disabled) ?? false))
  // Shared by `item` and the descendant surfaces of a standalone item.
  const state = getterRef(getAccordionPartState(rootContext, { open, disabled }) as () => AccordionPartState)

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

  const unmountOnHide = computed(() => toValue(options.unmountOnHide) ?? rootContext.unmountOnHide.value)
  // Only DOM-safe props: standalone callers bind this onto a plain element.
  const item = createPartSurface(
    () => ({
      onKeydown: handleKeydown,
    }),
    state,
  )

  return { open, disabled, unmountOnHide, state, item }
}

/**
 * Creates one standalone Accordion item and its descendant surfaces. Call exactly
 * once per item. Every surface carries only DOM-safe attrs, so each binds onto a
 * plain element; closed content is `hidden`. Wire a `beforematch` listener to
 * `onContentFound` when using `unmountOnHide: false`.
 */
export function getAccordionItemSurface(
  rootContext: AccordionRootContext<AccordionRootProps>,
  value: MaybeRefOrGetter<string>,
  options: AccordionItemSurfaceOptions = {},
): AccordionItemSurfaceReturn {
  const itemState = getAccordionItemState(rootContext, value, options)
  const { open, disabled, unmountOnHide, state } = itemState
  // Values become part of ids, and `aria-labelledby`/`aria-controls` are space-separated id lists.
  const idPart = () => encodeURIComponent(toValue(value))
  const itemContext: AccordionItemSurfaceContext = {
    open,
    disabled,
    state,
    triggerId: computed(() => toValue(options.triggerId) ?? `${options.baseId ?? 'reka-accordion'}-trigger-${idPart()}`),
    contentId: computed(() => toValue(options.contentId) ?? `${options.baseId ?? 'reka-accordion'}-content-${idPart()}`),
    value: computed(() => toValue(value)),
  }
  const header = getAccordionHeaderSurface(rootContext, itemContext)
  const trigger = getAccordionTriggerSurface(rootContext, itemContext)
  const content = createPartSurface(
    () => ({
      ...getAccordionContentProps(itemContext),
      hidden: open.value ? undefined : unmountOnHide.value ? '' : 'until-found',
    }),
    state,
  )
  const onContentFound = createContentFoundHandler(rootContext, itemContext)

  return { ...itemState, header, trigger, content, onContentFound, context: itemContext }
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
    // v2 `getDefaultValue` parity (as in `useToggleGroup`): keyed off the raw `type`,
    // so a root with neither `type` nor a value starts as `[]`.
    defaultValue: () => props.defaultValue ?? (toValue(props.type) === 'single' ? undefined : []),
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
