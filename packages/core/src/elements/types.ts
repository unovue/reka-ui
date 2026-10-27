import type { RekaElementEvent } from './events'
import type { RekaElement } from './RekaElement'
import type {
  AccordionContentProps,
  AccordionHeaderProps,
  AccordionItemProps,
  AccordionRootEmits,
  AccordionRootProps,
  AccordionTriggerProps,
} from '@/Accordion'
import type {
  CheckboxGroupRootEmits,
  CheckboxGroupRootProps,
  CheckboxIndicatorProps,
  CheckboxRootEmits,
  CheckboxRootProps,
} from '@/Checkbox'
import type {
  CollapsibleContentEmits,
  CollapsibleContentProps,
  CollapsibleRootEmits,
  CollapsibleRootProps,
  CollapsibleTriggerProps,
} from '@/Collapsible'
import type {
  DialogCloseProps,
  DialogContentEmits,
  DialogContentProps,
  DialogDescriptionProps,
  DialogOverlayProps,
  DialogPortalProps,
  DialogRootEmits,
  DialogRootProps,
  DialogTitleProps,
  DialogTriggerProps,
} from '@/Dialog'
import type {
  PopoverAnchorProps,
  PopoverCloseProps,
  PopoverContentEmits,
  PopoverContentProps,
  PopoverPortalProps,
  PopoverRootEmits,
  PopoverRootProps,
  PopoverTriggerProps,
} from '@/Popover'
import type { SwitchRootEmits, SwitchRootProps, SwitchThumbProps } from '@/Switch'
import type {
  TabsContentProps,
  TabsIndicatorProps,
  TabsListProps,
  TabsRootEmits,
  TabsRootProps,
  TabsTriggerProps,
} from '@/Tabs'
import type { ToggleEmits, ToggleProps } from '@/Toggle'

type Hyphenate<S extends string> = S extends `${infer Head}${infer Tail}`
  ? `${Head extends Lowercase<Head> ? Head : `-${Lowercase<Head>}`}${Hyphenate<Tail>}`
  : S
type ReplaceColons<S extends string> = S extends `${infer Head}:${infer Tail}` ? `${Head}-${ReplaceColons<Tail>}` : S
type PascalSegments<S extends string> = S extends `${infer Head}:${infer Tail}` ? `${Capitalize<Head>}${PascalSegments<Tail>}` : Capitalize<S>

/** DOM event type of a Vue emit, like `toEventType()`: `update:modelValue` → `update-model-value`. */
export type RekaEventType<Emit extends string> = Hyphenate<ReplaceColons<Emit>>

type EmitArgs<E, K extends keyof E> = E[K] extends readonly unknown[] ? E[K] : unknown[]
type EmitEvent<E, K extends keyof E> = RekaElementEvent<EmitArgs<E, K>[0], EmitArgs<E, K>[1]>

/** The `CustomEvent`s an element dispatches, by event type. */
export type RekaElementEventMap<Emits> = {
  [K in keyof Emits & string as RekaEventType<K>]: EmitEvent<Emits, K>
}

/** The element's props as properties: everything but `as` / `asChild`. */
export type RekaElementProps<Props> = Partial<Omit<Props, 'as' | 'asChild'>>

/**
 * A Reka element instance: its props as properties, and typed `addEventListener`
 * (listed first, so its overload wins over `HTMLElement`'s `string` one).
 */
export type RekaPartElement<Props, Emits = object> = {
  addEventListener: <K extends keyof RekaElementEventMap<Emits>>(
    type: K,
    listener: (this: HTMLElement, event: RekaElementEventMap<Emits>[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ) => void
  removeEventListener: <K extends keyof RekaElementEventMap<Emits>>(
    type: K,
    listener: (this: HTMLElement, event: RekaElementEventMap<Emits>[K]) => void,
    options?: boolean | EventListenerOptions,
  ) => void
} & RekaElement & RekaElementProps<Props>

/** Shown in a type error when a JSX handler uses React's camelCase event naming. */
export interface UseKebabCaseEventProp<Name extends string> {
  'Custom element events are named in kebab-case. Use this prop instead:': Name
}

/**
 * JSX props of an element for frameworks that set properties and listen to custom
 * events with `on<event-type>` (React 19, Preact, Solid with `prop:`/`on:` aside):
 * camelCase props, and `onupdate-model-value`-style event props. A camelCase handler
 * such as `onUpdateModelValue` is a type error: React would listen to an event
 * named `UpdateModelValue`, which never fires.
 */
export type RekaElementJSXProps<Props, Emits = object> = RekaElementProps<Props> & {
  [K in keyof Emits & string as `on${RekaEventType<K>}`]?: (event: EmitEvent<Emits, K>) => void
} & {
  [K in keyof Emits & string as `on${PascalSegments<K>}`]?: UseKebabCaseEventProp<`on${RekaEventType<K>}`>
}

interface Part<Props, Emits = object> {
  element: RekaPartElement<Props, Emits>
  jsx: RekaElementJSXProps<Props, Emits>
}

interface RekaElementParts {
  'reka-accordion-root': Part<AccordionRootProps, AccordionRootEmits>
  'reka-accordion-item': Part<AccordionItemProps>
  'reka-accordion-header': Part<AccordionHeaderProps>
  'reka-accordion-trigger': Part<AccordionTriggerProps>
  'reka-accordion-content': Part<AccordionContentProps>
  'reka-checkbox-root': Part<CheckboxRootProps, CheckboxRootEmits>
  'reka-checkbox-indicator': Part<CheckboxIndicatorProps>
  'reka-checkbox-group-root': Part<CheckboxGroupRootProps, CheckboxGroupRootEmits>
  'reka-collapsible-root': Part<CollapsibleRootProps, CollapsibleRootEmits>
  'reka-collapsible-trigger': Part<CollapsibleTriggerProps>
  'reka-collapsible-content': Part<CollapsibleContentProps, CollapsibleContentEmits>
  'reka-dialog-root': Part<DialogRootProps, DialogRootEmits>
  'reka-dialog-trigger': Part<DialogTriggerProps>
  'reka-dialog-portal': Part<DialogPortalProps>
  'reka-dialog-overlay': Part<DialogOverlayProps>
  'reka-dialog-content': Part<DialogContentProps, DialogContentEmits>
  'reka-dialog-title': Part<DialogTitleProps>
  'reka-dialog-description': Part<DialogDescriptionProps>
  'reka-dialog-close': Part<DialogCloseProps>
  'reka-popover-root': Part<PopoverRootProps, PopoverRootEmits>
  'reka-popover-trigger': Part<PopoverTriggerProps>
  'reka-popover-anchor': Part<PopoverAnchorProps>
  'reka-popover-portal': Part<PopoverPortalProps>
  'reka-popover-content': Part<PopoverContentProps, PopoverContentEmits>
  'reka-popover-close': Part<PopoverCloseProps>
  'reka-switch-root': Part<SwitchRootProps, SwitchRootEmits>
  'reka-switch-thumb': Part<SwitchThumbProps>
  'reka-tabs-root': Part<TabsRootProps, TabsRootEmits>
  'reka-tabs-list': Part<TabsListProps>
  'reka-tabs-trigger': Part<TabsTriggerProps>
  'reka-tabs-content': Part<TabsContentProps>
  'reka-tabs-indicator': Part<TabsIndicatorProps>
  'reka-toggle': Part<ToggleProps, ToggleEmits>
}

/**
 * Element types of the default-prefixed tags. Opt in to typed
 * `document.querySelector('reka-switch-root')` / `createElement()` with:
 *
 * ```ts
 * import type { RekaElementTagNameMap } from 'reka-ui/elements'
 *
 * declare global {
 *   interface HTMLElementTagNameMap extends RekaElementTagNameMap {}
 * }
 * ```
 *
 * (Not declared by the package itself: every entry shares one declaration chunk,
 * so it would reach every `reka-ui` user, elements or not.)
 */
export type RekaElementTagNameMap = {
  [Tag in keyof RekaElementParts]: RekaElementParts[Tag]['element']
}

/**
 * JSX intrinsic elements for the default-prefixed tags. `Base` is your framework's
 * own attributes type; the element's props replace the ones it shares with it
 * (`defaultValue`, `dir`, …).
 *
 * @example
 * ```ts
 * // React 19
 * import type { HTMLAttributes, RefAttributes } from 'react'
 * import type { RekaIntrinsicElements } from 'reka-ui/elements'
 *
 * declare module 'react' {
 *   namespace JSX {
 *     interface IntrinsicElements extends RekaIntrinsicElements<HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>> {}
 *   }
 * }
 * ```
 */
export type RekaIntrinsicElements<Base = object> = {
  [Tag in keyof RekaElementParts]: Omit<Base, keyof RekaElementParts[Tag]['jsx']> & RekaElementParts[Tag]['jsx']
}
