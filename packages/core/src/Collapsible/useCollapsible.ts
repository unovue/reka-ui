import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { CollapsibleRootContext } from './CollapsibleRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, DisclosureState, PartSurface } from '@/shared'
import { computed, ref, toValue } from 'vue'
import { createPartSurface, disclosureState, useControllableState } from '@/shared'

export type CollapsibleChangeReason = 'trigger-press' | 'content-found'

export interface UseCollapsibleProps {
  /** Controlled value, or a writable ref for standalone ref-owned state. */
  open?: MaybeRefOrGetter<boolean | undefined>
  defaultOpen?: boolean
  disabled?: MaybeRefOrGetter<boolean | undefined>
  unmountOnHide?: MaybeRefOrGetter<boolean | undefined>
  emit?: (event: any, ...args: any[]) => void
  onBeforeUpdate?: (value: boolean, details: ChangeEventDetails<CollapsibleChangeReason>) => void
  onUpdate?: (value: boolean, details: ChangeEventDetails<CollapsibleChangeReason>) => void
  /**
   * Called once the content's open (`true`) or close (`false`) transitions and
   * animations have finished (`update:openComplete`), reported by the content's
   * `Presence` through `context.notifyOpenComplete`.
   */
  onOpenComplete?: (value: boolean) => void
  /** SSR consumers must supply a stable baseId. */
  baseId?: string
}

export type CollapsiblePartState = {
  state: DisclosureState
  disabled: boolean
}

export interface UseCollapsibleReturn {
  open: ComputedRef<boolean>
  disabled: ComputedRef<boolean>
  setOpen: (value: boolean, reason?: CollapsibleChangeReason | BaseChangeReason, event?: Event) => boolean
  onOpenToggle: (event?: Event) => void
  onContentFound: (event: Event) => void
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<CollapsibleChangeReason>>>
  isControlled: ComputedRef<boolean>
  root: PartSurface<CollapsiblePartState>
  trigger: PartSurface<CollapsiblePartState>
  content: PartSurface<CollapsiblePartState>
  context: CollapsibleRootContext
}

// A getter, not a computed: `createPartSurface` only wraps it in a computed when
// a consumer reads `surface.state` on its own.
function getCollapsiblePartState(context: Pick<CollapsibleRootContext, 'open' | 'disabled'>) {
  return (): CollapsiblePartState => ({
    state: disclosureState(context.open.value),
    disabled: context.disabled?.value ?? false,
  })
}

/** `hidden` of closed content: `''`, or `'until-found'` when it stays mounted. */
export function getCollapsibleContentHidden(present: boolean, unmountOnHide: boolean): '' | 'until-found' | undefined {
  return present ? undefined : unmountOnHide ? '' : 'until-found'
}

type CollapsibleTriggerContext = Pick<CollapsibleRootContext, 'open' | 'disabled' | 'onOpenToggle'> & { contentId?: string }

/**
 * The trigger's props as a plain getter, for surfaces that extend them (Accordion)
 * without paying for a computed of their own.
 *
 * @internal
 */
export function getCollapsibleTriggerProps(context: CollapsibleTriggerContext): () => Record<string, any> {
  const onClick = (event: MouseEvent) => context.onOpenToggle(event)
  return () => ({
    ...(context.contentId === undefined ? {} : { 'aria-controls': context.contentId }),
    'aria-expanded': context.open.value,
    'disabled': context.disabled?.value,
    onClick,
  })
}

export function getCollapsibleTriggerSurface(context: CollapsibleTriggerContext): PartSurface<CollapsiblePartState> {
  return createPartSurface(getCollapsibleTriggerProps(context), getCollapsiblePartState(context))
}

/** Presence and dimensions are supplied by the rendering shell when available. */
export function getCollapsibleContentSurface(
  context: CollapsibleRootContext,
  options: {
    present?: MaybeRefOrGetter<boolean>
    width?: MaybeRefOrGetter<number>
    height?: MaybeRefOrGetter<number>
  } = {},
): PartSurface<CollapsiblePartState> {
  return createPartSurface(() => ({
    id: context.contentId,
    hidden: getCollapsibleContentHidden(toValue(options.present) ?? context.open.value, context.unmountOnHide.value),
    style: {
      '--reka-collapsible-content-height': `${toValue(options.height) ?? 0}px`,
      '--reka-collapsible-content-width': `${toValue(options.width) ?? 0}px`,
    },
  }), getCollapsiblePartState(context))
}

let collapsibleCount = 0

/**
 * Headless disclosure state and root/trigger/content surfaces. The rendering shell
 * owns presence, mounting, measurement, animations and the beforematch listener;
 * use onContentFound(event) to handle browser content discovery.
 * Standalone SSR consumers must supply a stable baseId; the default is unique
 * per call but is not hydration-stable.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useCollapsible(props: UseCollapsibleProps = {}): UseCollapsibleReturn {
  const { state: open, setState: setOpen, lastChangeDetails, isControlled } = useControllableState<boolean, CollapsibleChangeReason>({
    prop: props.open,
    defaultValue: props.defaultOpen ?? false,
    name: 'open',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const unmountOnHide = computed(() => toValue(props.unmountOnHide) ?? true)
  function onOpenToggle(event?: Event) {
    if (!disabled.value)
      setOpen(!open.value, 'trigger-press', event)
  }
  function onContentFound(event: Event) {
    if (!disabled.value)
      setOpen(true, 'content-found', event)
  }
  const contentId = ref(`${props.baseId ?? `reka-collapsible-${++collapsibleCount}`}-content`)
  const context: CollapsibleRootContext = {
    get contentId() { return contentId.value },
    set contentId(value) { contentId.value = value },
    open,
    disabled,
    unmountOnHide,
    onOpenToggle,
    onContentFound,
    notifyOpenComplete: value => props.onOpenComplete?.(value),
  }
  return {
    open,
    disabled,
    setOpen,
    onOpenToggle,
    onContentFound,
    lastChangeDetails,
    isControlled,
    root: createPartSurface(() => ({}), getCollapsiblePartState(context)),
    trigger: getCollapsibleTriggerSurface(context),
    content: getCollapsibleContentSurface(context),
    context,
  }
}
