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
import type { AspectRatioProps } from '@/AspectRatio'
import type { AvatarFallbackProps, AvatarRootProps } from '@/Avatar'
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
import type { ConfigProviderProps } from '@/ConfigProvider'
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
import type { FieldDescriptionProps, FieldErrorProps, FieldLabelProps, FieldRootProps } from '@/Field'
import type { FormRootEmits, FormRootProps } from '@/Form'
import type {
  PaginationEllipsisProps,
  PaginationFirstProps,
  PaginationLastProps,
  PaginationListItemProps,
  PaginationListProps,
  PaginationNextProps,
  PaginationPrevProps,
  PaginationRootEmits,
  PaginationRootProps,
} from '@/Pagination'
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
import type { ProgressIndicatorProps, ProgressRootEmits, ProgressRootProps } from '@/Progress'
import type {
  RadioGroupIndicatorProps,
  RadioGroupItemEmits,
  RadioGroupItemProps,
  RadioGroupRootEmits,
  RadioGroupRootProps,
} from '@/RadioGroup'
import type {
  ScrollAreaCornerProps,
  ScrollAreaRootProps,
  ScrollAreaScrollbarProps,
  ScrollAreaThumbProps,
  ScrollAreaViewportProps,
} from '@/ScrollArea'
import type { SeparatorProps } from '@/Separator'
import type {
  SplitterGroupEmits,
  SplitterGroupProps,
  SplitterPanelEmits,
  SplitterPanelProps,
  SplitterResizeHandleEmits,
  SplitterResizeHandleProps,
} from '@/Splitter'
import type {
  StepperDescriptionProps,
  StepperIndicatorProps,
  StepperItemProps,
  StepperRootEmits,
  StepperRootProps,
  StepperSeparatorProps,
  StepperTitleProps,
  StepperTriggerProps,
} from '@/Stepper'
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
import type { ToggleGroupItemProps, ToggleGroupRootEmits, ToggleGroupRootProps } from '@/ToggleGroup'
import type {
  ToolbarButtonProps,
  ToolbarRootProps,
  ToolbarSeparatorProps,
  ToolbarToggleGroupEmits,
  ToolbarToggleGroupProps,
  ToolbarToggleItemProps,
} from '@/Toolbar'
import type { VisuallyHiddenProps } from '@/VisuallyHidden'

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
  'reka-aspect-ratio': Part<AspectRatioProps>
  'reka-avatar-root': Part<AvatarRootProps>
  'reka-avatar-fallback': Part<AvatarFallbackProps>
  'reka-checkbox-root': Part<CheckboxRootProps, CheckboxRootEmits>
  'reka-checkbox-indicator': Part<CheckboxIndicatorProps>
  'reka-checkbox-group-root': Part<CheckboxGroupRootProps, CheckboxGroupRootEmits>
  'reka-collapsible-root': Part<CollapsibleRootProps, CollapsibleRootEmits>
  'reka-collapsible-trigger': Part<CollapsibleTriggerProps>
  'reka-collapsible-content': Part<CollapsibleContentProps, CollapsibleContentEmits>
  'reka-config-provider': Part<ConfigProviderProps>
  'reka-dialog-root': Part<DialogRootProps, DialogRootEmits>
  'reka-dialog-trigger': Part<DialogTriggerProps>
  'reka-dialog-portal': Part<DialogPortalProps>
  'reka-dialog-overlay': Part<DialogOverlayProps>
  'reka-dialog-content': Part<DialogContentProps, DialogContentEmits>
  'reka-dialog-title': Part<DialogTitleProps>
  'reka-dialog-description': Part<DialogDescriptionProps>
  'reka-dialog-close': Part<DialogCloseProps>
  'reka-field-root': Part<FieldRootProps>
  // Never a native label: `nativeLabel` and `for` are not part of the element.
  'reka-field-label': Part<Omit<FieldLabelProps, 'nativeLabel' | 'for'>>
  'reka-field-description': Part<FieldDescriptionProps>
  'reka-field-error': Part<FieldErrorProps>
  'reka-form-root': Part<FormRootProps, FormRootEmits>
  'reka-pagination-root': Part<PaginationRootProps, PaginationRootEmits>
  'reka-pagination-list': Part<PaginationListProps>
  'reka-pagination-list-item': Part<PaginationListItemProps>
  'reka-pagination-first': Part<PaginationFirstProps>
  'reka-pagination-prev': Part<PaginationPrevProps>
  'reka-pagination-next': Part<PaginationNextProps>
  'reka-pagination-last': Part<PaginationLastProps>
  'reka-pagination-ellipsis': Part<PaginationEllipsisProps>
  'reka-popover-root': Part<PopoverRootProps, PopoverRootEmits>
  'reka-popover-trigger': Part<PopoverTriggerProps>
  'reka-popover-anchor': Part<PopoverAnchorProps>
  'reka-popover-portal': Part<PopoverPortalProps>
  'reka-popover-content': Part<PopoverContentProps, PopoverContentEmits>
  'reka-popover-close': Part<PopoverCloseProps>
  'reka-progress-root': Part<ProgressRootProps, ProgressRootEmits>
  'reka-progress-indicator': Part<ProgressIndicatorProps>
  'reka-radio-group-root': Part<RadioGroupRootProps, RadioGroupRootEmits>
  'reka-radio-group-item': Part<RadioGroupItemProps, RadioGroupItemEmits>
  'reka-radio-group-indicator': Part<RadioGroupIndicatorProps>
  'reka-scroll-area-root': Part<ScrollAreaRootProps>
  'reka-scroll-area-viewport': Part<ScrollAreaViewportProps>
  'reka-scroll-area-scrollbar': Part<ScrollAreaScrollbarProps>
  'reka-scroll-area-thumb': Part<ScrollAreaThumbProps>
  'reka-scroll-area-corner': Part<ScrollAreaCornerProps>
  'reka-separator': Part<SeparatorProps>
  'reka-splitter-group': Part<SplitterGroupProps, SplitterGroupEmits>
  'reka-splitter-panel': Part<SplitterPanelProps, SplitterPanelEmits>
  'reka-splitter-resize-handle': Part<SplitterResizeHandleProps, SplitterResizeHandleEmits>
  'reka-stepper-root': Part<StepperRootProps, StepperRootEmits>
  'reka-stepper-item': Part<StepperItemProps>
  'reka-stepper-trigger': Part<StepperTriggerProps>
  'reka-stepper-indicator': Part<StepperIndicatorProps>
  'reka-stepper-title': Part<StepperTitleProps>
  'reka-stepper-description': Part<StepperDescriptionProps>
  'reka-stepper-separator': Part<StepperSeparatorProps>
  'reka-switch-root': Part<SwitchRootProps, SwitchRootEmits>
  'reka-switch-thumb': Part<SwitchThumbProps>
  'reka-tabs-root': Part<TabsRootProps, TabsRootEmits>
  'reka-tabs-list': Part<TabsListProps>
  'reka-tabs-trigger': Part<TabsTriggerProps>
  'reka-tabs-content': Part<TabsContentProps>
  'reka-tabs-indicator': Part<TabsIndicatorProps>
  'reka-toggle': Part<ToggleProps, ToggleEmits>
  'reka-toggle-group-root': Part<ToggleGroupRootProps, ToggleGroupRootEmits>
  'reka-toggle-group-item': Part<ToggleGroupItemProps>
  'reka-toolbar-root': Part<ToolbarRootProps>
  'reka-toolbar-button': Part<ToolbarButtonProps>
  'reka-toolbar-separator': Part<ToolbarSeparatorProps>
  'reka-toolbar-toggle-group': Part<ToolbarToggleGroupProps, ToolbarToggleGroupEmits>
  'reka-toolbar-toggle-item': Part<ToolbarToggleItemProps>
  'reka-visually-hidden': Part<VisuallyHiddenProps>
}

/**
 * Element types of the default-prefixed tags. Opt in to typed
 * `document.querySelector('reka-switch-root')` / `createElement()` with:
 *
 * ```ts
 * /// <reference types="reka-ui/elements/global" />
 * ```
 *
 * (A separate, types-only entry: every JavaScript entry shares one declaration
 * chunk, so a global declared there would reach every `reka-ui` user.)
 */
export type RekaElementTagNameMap = {
  [Tag in keyof RekaElementParts]: RekaElementParts[Tag]['element']
}

/**
 * JSX intrinsic elements for the default-prefixed tags. `Base` is your framework's
 * own attributes type; the element's props replace the ones it shares with it
 * (`defaultValue`, `dir`, …).
 *
 * React 19 typings for these are in `reka-ui/elements/react`
 * (`/// <reference types="reka-ui/elements/react" />`).
 *
 * @example
 * ```ts
 * // React 19, by hand
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
