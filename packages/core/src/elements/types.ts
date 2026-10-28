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
  AutocompleteInputEmits,
  AutocompleteInputProps,
  AutocompleteRootEmits,
  AutocompleteRootProps,
} from '@/Autocomplete'
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
  ComboboxAnchorProps,
  ComboboxCancelProps,
  ComboboxContentEmits,
  ComboboxContentProps,
  ComboboxEmptyProps,
  ComboboxGroupProps,
  ComboboxInputEmits,
  ComboboxInputProps,
  ComboboxItemEmits,
  ComboboxItemIndicatorProps,
  ComboboxItemProps,
  ComboboxLabelProps,
  ComboboxPortalProps,
  ComboboxRootEmits,
  ComboboxRootProps,
  ComboboxSeparatorProps,
  ComboboxTriggerProps,
  ComboboxViewportProps,
} from '@/Combobox'
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
  EditableAreaProps,
  EditableCancelTriggerProps,
  EditableEditTriggerProps,
  EditableInputProps,
  EditablePreviewProps,
  EditableRootEmits,
  EditableRootProps,
  EditableSubmitTriggerProps,
} from '@/Editable'
import type {
  ListboxContentProps,
  ListboxFilterEmits,
  ListboxFilterProps,
  ListboxGroupLabelProps,
  ListboxGroupProps,
  ListboxItemEmits,
  ListboxItemIndicatorProps,
  ListboxItemProps,
  ListboxRootEmits,
  ListboxRootProps,
} from '@/Listbox'
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
import type {
  SelectContentEmits,
  SelectContentProps,
  SelectGroupProps,
  SelectIconProps,
  SelectItemEmits,
  SelectItemIndicatorProps,
  SelectItemProps,
  SelectItemTextProps,
  SelectLabelProps,
  SelectPortalProps,
  SelectRootEmits,
  SelectRootProps,
  SelectScrollDownButtonProps,
  SelectScrollUpButtonProps,
  SelectSeparatorProps,
  SelectTriggerProps,
  SelectValueProps,
  SelectViewportProps,
} from '@/Select'
import type { SwitchRootEmits, SwitchRootProps, SwitchThumbProps } from '@/Switch'
import type {
  TabsContentProps,
  TabsIndicatorProps,
  TabsListProps,
  TabsRootEmits,
  TabsRootProps,
  TabsTriggerProps,
} from '@/Tabs'
import type {
  TagGroupItemDeleteProps,
  TagGroupItemProps,
  TagGroupItemTextProps,
  TagGroupRootEmits,
  TagGroupRootProps,
} from '@/TagGroup'
import type {
  TagsInputClearProps,
  TagsInputInputProps,
  TagsInputItemDeleteProps,
  TagsInputItemProps,
  TagsInputItemTextProps,
  TagsInputRootEmits,
  TagsInputRootProps,
} from '@/TagsInput'
import type { ToggleEmits, ToggleProps } from '@/Toggle'
import type {
  TreeItemEmits,
  TreeItemProps,
  TreeRootEmits,
  TreeRootProps,
} from '@/Tree'

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
  'reka-autocomplete-root': Part<AutocompleteRootProps, AutocompleteRootEmits>
  'reka-autocomplete-input': Part<AutocompleteInputProps, AutocompleteInputEmits>
  'reka-autocomplete-anchor': Part<ComboboxAnchorProps>
  'reka-autocomplete-trigger': Part<ComboboxTriggerProps>
  'reka-autocomplete-cancel': Part<ComboboxCancelProps>
  'reka-autocomplete-portal': Part<ComboboxPortalProps>
  'reka-autocomplete-content': Part<ComboboxContentProps, ComboboxContentEmits>
  'reka-autocomplete-viewport': Part<ComboboxViewportProps>
  'reka-autocomplete-empty': Part<ComboboxEmptyProps>
  'reka-autocomplete-item': Part<ComboboxItemProps, ComboboxItemEmits>
  'reka-autocomplete-item-indicator': Part<ComboboxItemIndicatorProps>
  'reka-autocomplete-group': Part<ComboboxGroupProps>
  'reka-autocomplete-label': Part<ComboboxLabelProps>
  'reka-autocomplete-separator': Part<ComboboxSeparatorProps>
  'reka-checkbox-root': Part<CheckboxRootProps, CheckboxRootEmits>
  'reka-checkbox-indicator': Part<CheckboxIndicatorProps>
  'reka-checkbox-group-root': Part<CheckboxGroupRootProps, CheckboxGroupRootEmits>
  'reka-collapsible-root': Part<CollapsibleRootProps, CollapsibleRootEmits>
  'reka-collapsible-trigger': Part<CollapsibleTriggerProps>
  'reka-collapsible-content': Part<CollapsibleContentProps, CollapsibleContentEmits>
  'reka-combobox-root': Part<ComboboxRootProps, ComboboxRootEmits>
  'reka-combobox-input': Part<ComboboxInputProps, ComboboxInputEmits>
  'reka-combobox-anchor': Part<ComboboxAnchorProps>
  'reka-combobox-trigger': Part<ComboboxTriggerProps>
  'reka-combobox-cancel': Part<ComboboxCancelProps>
  'reka-combobox-portal': Part<ComboboxPortalProps>
  'reka-combobox-content': Part<ComboboxContentProps, ComboboxContentEmits>
  'reka-combobox-viewport': Part<ComboboxViewportProps>
  'reka-combobox-empty': Part<ComboboxEmptyProps>
  'reka-combobox-item': Part<ComboboxItemProps, ComboboxItemEmits>
  'reka-combobox-item-indicator': Part<ComboboxItemIndicatorProps>
  'reka-combobox-group': Part<ComboboxGroupProps>
  'reka-combobox-label': Part<ComboboxLabelProps>
  'reka-combobox-separator': Part<ComboboxSeparatorProps>
  'reka-dialog-root': Part<DialogRootProps, DialogRootEmits>
  'reka-dialog-trigger': Part<DialogTriggerProps>
  'reka-dialog-portal': Part<DialogPortalProps>
  'reka-dialog-overlay': Part<DialogOverlayProps>
  'reka-dialog-content': Part<DialogContentProps, DialogContentEmits>
  'reka-dialog-title': Part<DialogTitleProps>
  'reka-dialog-description': Part<DialogDescriptionProps>
  'reka-dialog-close': Part<DialogCloseProps>
  'reka-editable-root': Part<EditableRootProps, EditableRootEmits>
  'reka-editable-area': Part<EditableAreaProps>
  'reka-editable-input': Part<EditableInputProps>
  'reka-editable-preview': Part<EditablePreviewProps>
  'reka-editable-edit-trigger': Part<EditableEditTriggerProps>
  'reka-editable-submit-trigger': Part<EditableSubmitTriggerProps>
  'reka-editable-cancel-trigger': Part<EditableCancelTriggerProps>
  'reka-listbox-root': Part<ListboxRootProps, ListboxRootEmits>
  'reka-listbox-content': Part<ListboxContentProps>
  'reka-listbox-filter': Part<ListboxFilterProps, ListboxFilterEmits>
  'reka-listbox-item': Part<ListboxItemProps, ListboxItemEmits>
  'reka-listbox-item-indicator': Part<ListboxItemIndicatorProps>
  'reka-listbox-group': Part<ListboxGroupProps>
  'reka-listbox-group-label': Part<ListboxGroupLabelProps>
  'reka-popover-root': Part<PopoverRootProps, PopoverRootEmits>
  'reka-popover-trigger': Part<PopoverTriggerProps>
  'reka-popover-anchor': Part<PopoverAnchorProps>
  'reka-popover-portal': Part<PopoverPortalProps>
  'reka-popover-content': Part<PopoverContentProps, PopoverContentEmits>
  'reka-popover-close': Part<PopoverCloseProps>
  'reka-select-root': Part<SelectRootProps, SelectRootEmits>
  'reka-select-trigger': Part<SelectTriggerProps>
  'reka-select-value': Part<SelectValueProps>
  'reka-select-icon': Part<SelectIconProps>
  'reka-select-portal': Part<SelectPortalProps>
  'reka-select-content': Part<SelectContentProps, SelectContentEmits>
  'reka-select-viewport': Part<SelectViewportProps>
  'reka-select-scroll-up-button': Part<SelectScrollUpButtonProps>
  'reka-select-scroll-down-button': Part<SelectScrollDownButtonProps>
  'reka-select-item': Part<SelectItemProps, SelectItemEmits>
  'reka-select-item-text': Part<SelectItemTextProps>
  'reka-select-item-indicator': Part<SelectItemIndicatorProps>
  'reka-select-group': Part<SelectGroupProps>
  'reka-select-label': Part<SelectLabelProps>
  'reka-select-separator': Part<SelectSeparatorProps>
  'reka-switch-root': Part<SwitchRootProps, SwitchRootEmits>
  'reka-switch-thumb': Part<SwitchThumbProps>
  'reka-tabs-root': Part<TabsRootProps, TabsRootEmits>
  'reka-tabs-list': Part<TabsListProps>
  'reka-tabs-trigger': Part<TabsTriggerProps>
  'reka-tabs-content': Part<TabsContentProps>
  'reka-tabs-indicator': Part<TabsIndicatorProps>
  'reka-tag-group-root': Part<TagGroupRootProps, TagGroupRootEmits>
  'reka-tag-group-item': Part<TagGroupItemProps>
  'reka-tag-group-item-text': Part<TagGroupItemTextProps>
  'reka-tag-group-item-delete': Part<TagGroupItemDeleteProps>
  'reka-tags-input-root': Part<TagsInputRootProps, TagsInputRootEmits>
  'reka-tags-input-input': Part<TagsInputInputProps>
  'reka-tags-input-item': Part<TagsInputItemProps>
  'reka-tags-input-item-text': Part<TagsInputItemTextProps>
  'reka-tags-input-item-delete': Part<TagsInputItemDeleteProps>
  'reka-tags-input-clear': Part<TagsInputClearProps>
  'reka-toggle': Part<ToggleProps, ToggleEmits>
  'reka-tree-root': Part<TreeRootProps, TreeRootEmits>
  'reka-tree-item': Part<TreeItemProps<Record<string, any>>, TreeItemEmits<Record<string, any>>>
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
