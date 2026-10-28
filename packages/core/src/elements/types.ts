import type { RekaElementEvent } from './events'
import type { RekaElement } from './RekaElement'
import type { ToastProviderElementEmits } from './toast'
import type {
  AccordionContentProps,
  AccordionHeaderProps,
  AccordionItemProps,
  AccordionRootEmits,
  AccordionRootProps,
  AccordionTriggerProps,
} from '@/Accordion'
import type {
  AlertDialogActionProps,
  AlertDialogCancelProps,
  AlertDialogContentEmits,
  AlertDialogContentProps,
  AlertDialogDescriptionProps,
  AlertDialogEmits,
  AlertDialogOverlayProps,
  AlertDialogPortalProps,
  AlertDialogProps,
  AlertDialogTitleProps,
  AlertDialogTriggerProps,
} from '@/AlertDialog'
import type { AspectRatioProps } from '@/AspectRatio'
import type {
  AutocompleteInputEmits,
  AutocompleteInputProps,
  AutocompleteRootEmits,
  AutocompleteRootProps,
} from '@/Autocomplete'
import type { AvatarFallbackProps, AvatarRootProps } from '@/Avatar'
import type {
  CalendarCellProps,
  CalendarCellTriggerProps,
  CalendarGridBodyProps,
  CalendarGridHeadProps,
  CalendarGridProps,
  CalendarGridRowProps,
  CalendarHeadCellProps,
  CalendarHeaderProps,
  CalendarHeadingProps,
  CalendarNextProps,
  CalendarPrevProps,
  CalendarRootEmits,
  CalendarRootProps,
  CalendarViewProps,
  CalendarViewTriggerProps,
} from '@/Calendar'
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
  ColorAreaAreaProps,
  ColorAreaRootEmits,
  ColorAreaRootProps,
  ColorAreaThumbProps,
} from '@/ColorArea'
import type {
  ColorFieldInputProps,
  ColorFieldRootEmits,
  ColorFieldRootProps,
} from '@/ColorField'
import type {
  ColorSliderRootEmits,
  ColorSliderRootProps,
  ColorSliderThumbProps,
  ColorSliderTrackProps,
} from '@/ColorSlider'
import type {
  ColorSwatchProps,
} from '@/ColorSwatch'
import type {
  ColorSwatchPickerItemIndicatorProps,
  ColorSwatchPickerItemProps,
  ColorSwatchPickerItemSwatchProps,
  ColorSwatchPickerRootEmits,
  ColorSwatchPickerRootProps,
} from '@/ColorSwatchPicker'
import type {
  ComboboxAnchorProps,
  ComboboxArrowProps,
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
import type { ConfigProviderProps } from '@/ConfigProvider'
import type {
  ContextMenuArrowProps,
  ContextMenuCheckboxItemEmits,
  ContextMenuCheckboxItemProps,
  ContextMenuContentEmits,
  ContextMenuContentProps,
  ContextMenuGroupProps,
  ContextMenuItemEmits,
  ContextMenuItemIndicatorProps,
  ContextMenuItemProps,
  ContextMenuLabelProps,
  ContextMenuPortalProps,
  ContextMenuRadioGroupEmits,
  ContextMenuRadioGroupProps,
  ContextMenuRadioItemEmits,
  ContextMenuRadioItemProps,
  ContextMenuRootEmits,
  ContextMenuRootProps,
  ContextMenuSeparatorProps,
  ContextMenuSubContentEmits,
  ContextMenuSubContentProps,
  ContextMenuSubEmits,
  ContextMenuSubProps,
  ContextMenuSubTriggerProps,
  ContextMenuTriggerProps,
} from '@/ContextMenu'
import type {
  DateFieldInputProps,
  DateFieldRootEmits,
  DateFieldRootProps,
} from '@/DateField'
import type {
  DatePickerAnchorProps,
  DatePickerArrowProps,
  DatePickerCellProps,
  DatePickerCellTriggerProps,
  DatePickerCloseProps,
  DatePickerContentEmits,
  DatePickerContentProps,
  DatePickerGridBodyProps,
  DatePickerGridHeadProps,
  DatePickerGridProps,
  DatePickerGridRowProps,
  DatePickerHeadCellProps,
  DatePickerHeaderProps,
  DatePickerHeadingProps,
  DatePickerInputProps,
  DatePickerNextProps,
  DatePickerPrevProps,
  DatePickerRootEmits,
  DatePickerRootProps,
  DatePickerTriggerProps,
  DatePickerViewProps,
  DatePickerViewTriggerProps,
} from '@/DatePicker'
import type {
  DateRangeFieldInputProps,
  DateRangeFieldRootEmits,
  DateRangeFieldRootProps,
} from '@/DateRangeField'
import type {
  DateRangePickerAnchorProps,
  DateRangePickerArrowProps,
  DateRangePickerCellProps,
  DateRangePickerCellTriggerProps,
  DateRangePickerCloseProps,
  DateRangePickerContentEmits,
  DateRangePickerContentProps,
  DateRangePickerGridBodyProps,
  DateRangePickerGridHeadProps,
  DateRangePickerGridProps,
  DateRangePickerGridRowProps,
  DateRangePickerHeadCellProps,
  DateRangePickerHeaderProps,
  DateRangePickerHeadingProps,
  DateRangePickerInputProps,
  DateRangePickerNextProps,
  DateRangePickerPrevProps,
  DateRangePickerRootEmits,
  DateRangePickerRootProps,
  DateRangePickerTriggerProps,
  DateRangePickerViewProps,
  DateRangePickerViewTriggerProps,
} from '@/DateRangePicker'
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
  DrawerBackdropProps,
  DrawerCloseProps,
  DrawerDescriptionProps,
  DrawerGrabberProps,
  DrawerIndentBackgroundProps,
  DrawerIndentProps,
  DrawerPopupEmits,
  DrawerPopupProps,
  DrawerPortalProps,
  DrawerRootEmits,
  DrawerRootProps,
  DrawerSwipeAreaProps,
  DrawerTitleProps,
  DrawerTriggerProps,
  DrawerViewportProps,
} from '@/Drawer'
import type {
  DropdownMenuArrowProps,
  DropdownMenuCheckboxItemEmits,
  DropdownMenuCheckboxItemProps,
  DropdownMenuContentEmits,
  DropdownMenuContentProps,
  DropdownMenuFilterEmits,
  DropdownMenuFilterProps,
  DropdownMenuGroupProps,
  DropdownMenuItemEmits,
  DropdownMenuItemIndicatorProps,
  DropdownMenuItemProps,
  DropdownMenuLabelProps,
  DropdownMenuPortalProps,
  DropdownMenuRadioGroupEmits,
  DropdownMenuRadioGroupProps,
  DropdownMenuRadioItemEmits,
  DropdownMenuRadioItemProps,
  DropdownMenuRootEmits,
  DropdownMenuRootProps,
  DropdownMenuSeparatorProps,
  DropdownMenuSubContentEmits,
  DropdownMenuSubContentProps,
  DropdownMenuSubEmits,
  DropdownMenuSubProps,
  DropdownMenuSubTriggerProps,
  DropdownMenuTriggerProps,
} from '@/DropdownMenu'
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
import type { FieldDescriptionProps, FieldErrorProps, FieldLabelProps, FieldRootProps } from '@/Field'
import type { FormRootEmits, FormRootProps } from '@/Form'
import type {
  HoverCardArrowProps,
  HoverCardContentProps,
  HoverCardPortalProps,
  HoverCardRootEmits,
  HoverCardRootProps,
  HoverCardTriggerProps,
} from '@/HoverCard'
import type { HoverCardContentEmits } from '@/HoverCard/HoverCardContent.vue'
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
  MenubarArrowProps,
  MenubarCheckboxItemEmits,
  MenubarCheckboxItemProps,
  MenubarContentEmits,
  MenubarContentProps,
  MenubarGroupProps,
  MenubarItemEmits,
  MenubarItemIndicatorProps,
  MenubarItemProps,
  MenubarLabelProps,
  MenubarMenuEmits,
  MenubarMenuProps,
  MenubarPortalProps,
  MenubarRadioGroupEmits,
  MenubarRadioGroupProps,
  MenubarRadioItemEmits,
  MenubarRadioItemProps,
  MenubarRootEmits,
  MenubarRootProps,
  MenubarSeparatorProps,
  MenubarSubContentEmits,
  MenubarSubContentProps,
  MenubarSubEmits,
  MenubarSubProps,
  MenubarSubTriggerProps,
  MenubarTriggerProps,
} from '@/Menubar'
import type {
  NavigationMenuContentEmits,
  NavigationMenuContentProps,
  NavigationMenuIndicatorProps,
  NavigationMenuItemProps,
  NavigationMenuLinkEmits,
  NavigationMenuLinkProps,
  NavigationMenuListProps,
  NavigationMenuRootEmits,
  NavigationMenuRootProps,
  NavigationMenuSubEmits,
  NavigationMenuSubProps,
  NavigationMenuTriggerProps,
  NavigationMenuViewportProps,
} from '@/NavigationMenu'
import type {
  NumberFieldDecrementProps,
  NumberFieldIncrementProps,
  NumberFieldInputProps,
  NumberFieldRootEmits,
  NumberFieldRootProps,
} from '@/NumberField'
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
  PinInputInputProps,
  PinInputRootEmits,
  PinInputRootProps,
} from '@/PinInput'
import type {
  PopoverAnchorProps,
  PopoverArrowProps,
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
  RangeCalendarCellProps,
  RangeCalendarCellTriggerProps,
  RangeCalendarGridBodyProps,
  RangeCalendarGridHeadProps,
  RangeCalendarGridProps,
  RangeCalendarGridRowProps,
  RangeCalendarHeadCellProps,
  RangeCalendarHeaderProps,
  RangeCalendarHeadingProps,
  RangeCalendarNextProps,
  RangeCalendarPrevProps,
  RangeCalendarRootEmits,
  RangeCalendarRootProps,
  RangeCalendarViewProps,
  RangeCalendarViewTriggerProps,
} from '@/RangeCalendar'
import type {
  RatingItemIndicatorProps,
  RatingItemProps,
  RatingRootEmits,
  RatingRootProps,
} from '@/Rating'
import type {
  ScrollAreaCornerProps,
  ScrollAreaRootProps,
  ScrollAreaScrollbarProps,
  ScrollAreaThumbProps,
  ScrollAreaViewportProps,
} from '@/ScrollArea'
import type {
  SelectArrowProps,
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

import type { SeparatorProps } from '@/Separator'
import type {
  SliderRangeProps,
  SliderRootEmits,
  SliderRootProps,
  SliderThumbProps,
  SliderTrackProps,
} from '@/Slider'
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
import type {
  TimeFieldInputProps,
  TimeFieldRootEmits,
  TimeFieldRootProps,
} from '@/TimeField'
import type {
  TimeRangeFieldInputProps,
  TimeRangeFieldRootEmits,
  TimeRangeFieldRootProps,
} from '@/TimeRangeField'
import type {
  ToastActionProps,
  ToastArrowProps,
  ToastCloseProps,
  ToastDescriptionProps,
  ToastPortalProps,
  ToastPositionerProps,
  ToastProviderProps,
  ToastRootEmits,
  ToastRootProps,
  ToastTitleProps,
  ToastViewportProps,
} from '@/Toast'
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
import type {
  TooltipArrowProps,
  TooltipContentEmits,
  TooltipContentProps,
  TooltipPortalProps,
  TooltipProviderProps,
  TooltipRootEmits,
  TooltipRootProps,
  TooltipTriggerProps,
} from '@/Tooltip'
import type {
  TreeItemEmits,
  TreeItemProps,
  TreeRootEmits,
  TreeRootProps,
} from '@/Tree'
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
  'reka-alert-dialog-root': Part<AlertDialogProps, AlertDialogEmits>
  'reka-alert-dialog-trigger': Part<AlertDialogTriggerProps>
  'reka-alert-dialog-portal': Part<AlertDialogPortalProps>
  'reka-alert-dialog-overlay': Part<AlertDialogOverlayProps>
  'reka-alert-dialog-content': Part<AlertDialogContentProps, AlertDialogContentEmits>
  'reka-alert-dialog-title': Part<AlertDialogTitleProps>
  'reka-alert-dialog-description': Part<AlertDialogDescriptionProps>
  'reka-alert-dialog-cancel': Part<AlertDialogCancelProps>
  'reka-alert-dialog-action': Part<AlertDialogActionProps>
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
  'reka-config-provider': Part<ConfigProviderProps>
  'reka-context-menu-root': Part<ContextMenuRootProps, ContextMenuRootEmits>
  'reka-context-menu-trigger': Part<ContextMenuTriggerProps>
  'reka-context-menu-portal': Part<ContextMenuPortalProps>
  'reka-context-menu-content': Part<ContextMenuContentProps, ContextMenuContentEmits>
  'reka-context-menu-arrow': Part<ContextMenuArrowProps>
  'reka-context-menu-item': Part<ContextMenuItemProps, ContextMenuItemEmits>
  'reka-context-menu-group': Part<ContextMenuGroupProps>
  'reka-context-menu-label': Part<ContextMenuLabelProps>
  'reka-context-menu-checkbox-item': Part<ContextMenuCheckboxItemProps, ContextMenuCheckboxItemEmits>
  'reka-context-menu-radio-group': Part<ContextMenuRadioGroupProps, ContextMenuRadioGroupEmits>
  'reka-context-menu-radio-item': Part<ContextMenuRadioItemProps, ContextMenuRadioItemEmits>
  'reka-context-menu-item-indicator': Part<ContextMenuItemIndicatorProps>
  'reka-context-menu-separator': Part<ContextMenuSeparatorProps>
  'reka-context-menu-sub': Part<ContextMenuSubProps, ContextMenuSubEmits>
  'reka-context-menu-sub-trigger': Part<ContextMenuSubTriggerProps>
  'reka-context-menu-sub-content': Part<ContextMenuSubContentProps, ContextMenuSubContentEmits>
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
  'reka-combobox-arrow': Part<ComboboxArrowProps>
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
  'reka-drawer-root': Part<DrawerRootProps, DrawerRootEmits>
  'reka-drawer-trigger': Part<DrawerTriggerProps>
  'reka-drawer-portal': Part<DrawerPortalProps>
  'reka-drawer-backdrop': Part<DrawerBackdropProps>
  'reka-drawer-viewport': Part<DrawerViewportProps>
  'reka-drawer-popup': Part<DrawerPopupProps, DrawerPopupEmits>
  'reka-drawer-title': Part<DrawerTitleProps>
  'reka-drawer-description': Part<DrawerDescriptionProps>
  'reka-drawer-close': Part<DrawerCloseProps>
  'reka-drawer-grabber': Part<DrawerGrabberProps>
  'reka-drawer-swipe-area': Part<DrawerSwipeAreaProps>
  'reka-drawer-provider': Part<object>
  'reka-drawer-indent': Part<DrawerIndentProps>
  'reka-drawer-indent-background': Part<DrawerIndentBackgroundProps>
  'reka-drawer-virtual-keyboard-provider': Part<object>
  'reka-dropdown-menu-root': Part<DropdownMenuRootProps, DropdownMenuRootEmits>
  'reka-dropdown-menu-trigger': Part<DropdownMenuTriggerProps>
  'reka-dropdown-menu-portal': Part<DropdownMenuPortalProps>
  'reka-dropdown-menu-content': Part<DropdownMenuContentProps, DropdownMenuContentEmits>
  'reka-dropdown-menu-filter': Part<DropdownMenuFilterProps, DropdownMenuFilterEmits>
  'reka-dropdown-menu-arrow': Part<DropdownMenuArrowProps>
  'reka-dropdown-menu-item': Part<DropdownMenuItemProps, DropdownMenuItemEmits>
  'reka-dropdown-menu-group': Part<DropdownMenuGroupProps>
  'reka-dropdown-menu-label': Part<DropdownMenuLabelProps>
  'reka-dropdown-menu-checkbox-item': Part<DropdownMenuCheckboxItemProps, DropdownMenuCheckboxItemEmits>
  'reka-dropdown-menu-radio-group': Part<DropdownMenuRadioGroupProps, DropdownMenuRadioGroupEmits>
  'reka-dropdown-menu-radio-item': Part<DropdownMenuRadioItemProps, DropdownMenuRadioItemEmits>
  'reka-dropdown-menu-item-indicator': Part<DropdownMenuItemIndicatorProps>
  'reka-dropdown-menu-separator': Part<DropdownMenuSeparatorProps>
  'reka-dropdown-menu-sub': Part<DropdownMenuSubProps, DropdownMenuSubEmits>
  'reka-dropdown-menu-sub-trigger': Part<DropdownMenuSubTriggerProps>
  'reka-dropdown-menu-sub-content': Part<DropdownMenuSubContentProps, DropdownMenuSubContentEmits>
  'reka-hover-card-root': Part<HoverCardRootProps, HoverCardRootEmits>
  'reka-hover-card-trigger': Part<HoverCardTriggerProps>
  'reka-hover-card-portal': Part<HoverCardPortalProps>
  'reka-hover-card-content': Part<HoverCardContentProps, HoverCardContentEmits>
  'reka-hover-card-arrow': Part<HoverCardArrowProps>
  'reka-menubar-root': Part<MenubarRootProps, MenubarRootEmits>
  'reka-menubar-menu': Part<MenubarMenuProps, MenubarMenuEmits>
  'reka-menubar-trigger': Part<MenubarTriggerProps>
  'reka-menubar-portal': Part<MenubarPortalProps>
  'reka-menubar-content': Part<MenubarContentProps, MenubarContentEmits>
  'reka-menubar-arrow': Part<MenubarArrowProps>
  'reka-menubar-item': Part<MenubarItemProps, MenubarItemEmits>
  'reka-menubar-group': Part<MenubarGroupProps>
  'reka-menubar-label': Part<MenubarLabelProps>
  'reka-menubar-checkbox-item': Part<MenubarCheckboxItemProps, MenubarCheckboxItemEmits>
  'reka-menubar-radio-group': Part<MenubarRadioGroupProps, MenubarRadioGroupEmits>
  'reka-menubar-radio-item': Part<MenubarRadioItemProps, MenubarRadioItemEmits>
  'reka-menubar-item-indicator': Part<MenubarItemIndicatorProps>
  'reka-menubar-separator': Part<MenubarSeparatorProps>
  'reka-menubar-sub': Part<MenubarSubProps, MenubarSubEmits>
  'reka-menubar-sub-trigger': Part<MenubarSubTriggerProps>
  'reka-menubar-sub-content': Part<MenubarSubContentProps, MenubarSubContentEmits>
  'reka-navigation-menu-root': Part<NavigationMenuRootProps, NavigationMenuRootEmits>
  'reka-navigation-menu-sub': Part<NavigationMenuSubProps, NavigationMenuSubEmits>
  'reka-navigation-menu-list': Part<NavigationMenuListProps>
  'reka-navigation-menu-item': Part<NavigationMenuItemProps>
  'reka-navigation-menu-trigger': Part<NavigationMenuTriggerProps>
  'reka-navigation-menu-content': Part<NavigationMenuContentProps, NavigationMenuContentEmits>
  'reka-navigation-menu-link': Part<NavigationMenuLinkProps, NavigationMenuLinkEmits>
  'reka-navigation-menu-indicator': Part<NavigationMenuIndicatorProps>
  'reka-navigation-menu-viewport': Part<NavigationMenuViewportProps>
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
  'reka-popover-arrow': Part<PopoverArrowProps>
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
  'reka-select-arrow': Part<SelectArrowProps>
  'reka-switch-root': Part<SwitchRootProps, SwitchRootEmits>
  'reka-switch-thumb': Part<SwitchThumbProps>
  'reka-tabs-root': Part<TabsRootProps, TabsRootEmits>
  'reka-tabs-list': Part<TabsListProps>
  'reka-tabs-trigger': Part<TabsTriggerProps>
  'reka-tabs-content': Part<TabsContentProps>
  'reka-tabs-indicator': Part<TabsIndicatorProps>
  'reka-toast-provider': Part<ToastProviderProps, ToastProviderElementEmits>
  'reka-toast-viewport': Part<ToastViewportProps>
  'reka-toast-root': Part<ToastRootProps, ToastRootEmits>
  'reka-toast-title': Part<ToastTitleProps>
  'reka-toast-description': Part<ToastDescriptionProps>
  'reka-toast-action': Part<ToastActionProps>
  'reka-toast-close': Part<ToastCloseProps>
  'reka-toast-portal': Part<ToastPortalProps>
  'reka-toast-positioner': Part<ToastPositionerProps>
  'reka-toast-arrow': Part<ToastArrowProps>
  'reka-toggle': Part<ToggleProps, ToggleEmits>
  'reka-toggle-group-root': Part<ToggleGroupRootProps, ToggleGroupRootEmits>
  'reka-toggle-group-item': Part<ToggleGroupItemProps>
  'reka-toolbar-root': Part<ToolbarRootProps>
  'reka-toolbar-button': Part<ToolbarButtonProps>
  'reka-toolbar-separator': Part<ToolbarSeparatorProps>
  'reka-toolbar-toggle-group': Part<ToolbarToggleGroupProps, ToolbarToggleGroupEmits>
  'reka-toolbar-toggle-item': Part<ToolbarToggleItemProps>
  'reka-visually-hidden': Part<VisuallyHiddenProps>
  'reka-tooltip-provider': Part<TooltipProviderProps>
  'reka-tooltip-root': Part<TooltipRootProps, TooltipRootEmits>
  'reka-tooltip-trigger': Part<TooltipTriggerProps>
  'reka-tooltip-portal': Part<TooltipPortalProps>
  'reka-tooltip-content': Part<TooltipContentProps, TooltipContentEmits>
  'reka-tooltip-arrow': Part<TooltipArrowProps>
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
  'reka-tree-root': Part<TreeRootProps, TreeRootEmits>
  'reka-tree-item': Part<TreeItemProps<Record<string, any>>, TreeItemEmits<Record<string, any>>>
  'reka-calendar-root': Part<CalendarRootProps, CalendarRootEmits>
  'reka-calendar-header': Part<CalendarHeaderProps>
  'reka-calendar-heading': Part<CalendarHeadingProps>
  'reka-calendar-prev': Part<CalendarPrevProps>
  'reka-calendar-next': Part<CalendarNextProps>
  'reka-calendar-grid': Part<CalendarGridProps>
  'reka-calendar-grid-head': Part<CalendarGridHeadProps>
  'reka-calendar-grid-body': Part<CalendarGridBodyProps>
  'reka-calendar-grid-row': Part<CalendarGridRowProps>
  'reka-calendar-head-cell': Part<CalendarHeadCellProps>
  'reka-calendar-cell': Part<CalendarCellProps>
  'reka-calendar-cell-trigger': Part<CalendarCellTriggerProps>
  'reka-calendar-view': Part<CalendarViewProps>
  'reka-calendar-view-trigger': Part<CalendarViewTriggerProps>
  'reka-range-calendar-root': Part<RangeCalendarRootProps, RangeCalendarRootEmits>
  'reka-range-calendar-header': Part<RangeCalendarHeaderProps>
  'reka-range-calendar-heading': Part<RangeCalendarHeadingProps>
  'reka-range-calendar-prev': Part<RangeCalendarPrevProps>
  'reka-range-calendar-next': Part<RangeCalendarNextProps>
  'reka-range-calendar-grid': Part<RangeCalendarGridProps>
  'reka-range-calendar-grid-head': Part<RangeCalendarGridHeadProps>
  'reka-range-calendar-grid-body': Part<RangeCalendarGridBodyProps>
  'reka-range-calendar-grid-row': Part<RangeCalendarGridRowProps>
  'reka-range-calendar-head-cell': Part<RangeCalendarHeadCellProps>
  'reka-range-calendar-cell': Part<RangeCalendarCellProps>
  'reka-range-calendar-cell-trigger': Part<RangeCalendarCellTriggerProps>
  'reka-range-calendar-view': Part<RangeCalendarViewProps>
  'reka-range-calendar-view-trigger': Part<RangeCalendarViewTriggerProps>
  'reka-date-field-root': Part<DateFieldRootProps, DateFieldRootEmits>
  'reka-date-field-input': Part<DateFieldInputProps>
  'reka-date-range-field-root': Part<DateRangeFieldRootProps, DateRangeFieldRootEmits>
  'reka-date-range-field-input': Part<DateRangeFieldInputProps>
  'reka-time-field-root': Part<TimeFieldRootProps, TimeFieldRootEmits>
  'reka-time-field-input': Part<TimeFieldInputProps>
  'reka-time-range-field-root': Part<TimeRangeFieldRootProps, TimeRangeFieldRootEmits>
  'reka-time-range-field-input': Part<TimeRangeFieldInputProps>
  'reka-date-picker-root': Part<DatePickerRootProps, DatePickerRootEmits>
  'reka-date-picker-field': Part<object>
  'reka-date-picker-input': Part<DatePickerInputProps>
  'reka-date-picker-trigger': Part<DatePickerTriggerProps>
  'reka-date-picker-anchor': Part<DatePickerAnchorProps>
  'reka-date-picker-content': Part<DatePickerContentProps, DatePickerContentEmits>
  'reka-date-picker-arrow': Part<DatePickerArrowProps>
  'reka-date-picker-close': Part<DatePickerCloseProps>
  'reka-date-picker-calendar': Part<object>
  'reka-date-picker-header': Part<DatePickerHeaderProps>
  'reka-date-picker-heading': Part<DatePickerHeadingProps>
  'reka-date-picker-prev': Part<DatePickerPrevProps>
  'reka-date-picker-next': Part<DatePickerNextProps>
  'reka-date-picker-grid': Part<DatePickerGridProps>
  'reka-date-picker-grid-head': Part<DatePickerGridHeadProps>
  'reka-date-picker-grid-body': Part<DatePickerGridBodyProps>
  'reka-date-picker-grid-row': Part<DatePickerGridRowProps>
  'reka-date-picker-head-cell': Part<DatePickerHeadCellProps>
  'reka-date-picker-cell': Part<DatePickerCellProps>
  'reka-date-picker-cell-trigger': Part<DatePickerCellTriggerProps>
  'reka-date-picker-view': Part<DatePickerViewProps>
  'reka-date-picker-view-trigger': Part<DatePickerViewTriggerProps>
  'reka-date-range-picker-root': Part<DateRangePickerRootProps, DateRangePickerRootEmits>
  'reka-date-range-picker-field': Part<object>
  'reka-date-range-picker-input': Part<DateRangePickerInputProps>
  'reka-date-range-picker-trigger': Part<DateRangePickerTriggerProps>
  'reka-date-range-picker-anchor': Part<DateRangePickerAnchorProps>
  'reka-date-range-picker-content': Part<DateRangePickerContentProps, DateRangePickerContentEmits>
  'reka-date-range-picker-arrow': Part<DateRangePickerArrowProps>
  'reka-date-range-picker-close': Part<DateRangePickerCloseProps>
  'reka-date-range-picker-calendar': Part<object>
  'reka-date-range-picker-header': Part<DateRangePickerHeaderProps>
  'reka-date-range-picker-heading': Part<DateRangePickerHeadingProps>
  'reka-date-range-picker-prev': Part<DateRangePickerPrevProps>
  'reka-date-range-picker-next': Part<DateRangePickerNextProps>
  'reka-date-range-picker-grid': Part<DateRangePickerGridProps>
  'reka-date-range-picker-grid-head': Part<DateRangePickerGridHeadProps>
  'reka-date-range-picker-grid-body': Part<DateRangePickerGridBodyProps>
  'reka-date-range-picker-grid-row': Part<DateRangePickerGridRowProps>
  'reka-date-range-picker-head-cell': Part<DateRangePickerHeadCellProps>
  'reka-date-range-picker-cell': Part<DateRangePickerCellProps>
  'reka-date-range-picker-cell-trigger': Part<DateRangePickerCellTriggerProps>
  'reka-date-range-picker-view': Part<DateRangePickerViewProps>
  'reka-date-range-picker-view-trigger': Part<DateRangePickerViewTriggerProps>
  'reka-color-area-root': Part<ColorAreaRootProps, ColorAreaRootEmits>
  'reka-color-area-area': Part<ColorAreaAreaProps>
  'reka-color-area-thumb': Part<ColorAreaThumbProps>
  'reka-color-field-root': Part<ColorFieldRootProps, ColorFieldRootEmits>
  'reka-color-field-input': Part<ColorFieldInputProps>
  'reka-color-slider-root': Part<ColorSliderRootProps, ColorSliderRootEmits>
  'reka-color-slider-track': Part<ColorSliderTrackProps>
  'reka-color-slider-thumb': Part<ColorSliderThumbProps>
  'reka-color-swatch': Part<ColorSwatchProps>
  'reka-color-swatch-picker-root': Part<ColorSwatchPickerRootProps, ColorSwatchPickerRootEmits>
  'reka-color-swatch-picker-item': Part<ColorSwatchPickerItemProps>
  'reka-color-swatch-picker-item-swatch': Part<ColorSwatchPickerItemSwatchProps>
  'reka-color-swatch-picker-item-indicator': Part<ColorSwatchPickerItemIndicatorProps>
  'reka-number-field-root': Part<NumberFieldRootProps, NumberFieldRootEmits>
  'reka-number-field-input': Part<NumberFieldInputProps>
  'reka-number-field-increment': Part<NumberFieldIncrementProps>
  'reka-number-field-decrement': Part<NumberFieldDecrementProps>
  'reka-pin-input-root': Part<PinInputRootProps, PinInputRootEmits>
  'reka-pin-input-input': Part<PinInputInputProps>
  'reka-slider-root': Part<SliderRootProps, SliderRootEmits>
  'reka-slider-track': Part<SliderTrackProps>
  'reka-slider-range': Part<SliderRangeProps>
  'reka-slider-thumb': Part<SliderThumbProps>
  'reka-rating-root': Part<RatingRootProps, RatingRootEmits>
  'reka-rating-item': Part<RatingItemProps>
  'reka-rating-item-indicator': Part<RatingItemIndicatorProps>
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
