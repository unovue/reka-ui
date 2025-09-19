export const components = {
  accordion: [
    'AccordionContent',
    'AccordionHeader',
    'AccordionItem',
    'AccordionRoot',
    'AccordionTrigger',
  ] as const,

  alertDialog: [
    'AlertDialogRoot',
    'AlertDialogTrigger',
    'AlertDialogPortal',
    'AlertDialogContent',
    'AlertDialogOverlay',
    'AlertDialogCancel',
    'AlertDialogTitle',
    'AlertDialogDescription',
    'AlertDialogAction',
  ] as const,

  aspectRatio: [
    'AspectRatio',
  ] as const,

  avatar: [
    'AvatarRoot',
    'AvatarFallback',
    'AvatarImage',
  ] as const,

  calendar: [
    'CalendarRoot',
    'CalendarHeader',
    'CalendarHeading',
    'CalendarGrid',
    'CalendarCell',
    'CalendarHeadCell',
    'CalendarNext',
    'CalendarPrev',
    'CalendarGridHead',
    'CalendarGridBody',
    'CalendarGridRow',
    'CalendarCellTrigger',
  ] as const,

  checkbox: [
    'CheckboxGroupRoot',
    'CheckboxRoot',
    'CheckboxIndicator',
  ] as const,

  collapsible: [
    'CollapsibleRoot',
    'CollapsibleTrigger',
    'CollapsibleContent',
  ] as const,

  combobox: [
    'ComboboxRoot',
    'ComboboxInput',
    'ComboboxAnchor',
    'ComboboxEmpty',
    'ComboboxTrigger',
    'ComboboxCancel',
    'ComboboxGroup',
    'ComboboxLabel',
    'ComboboxContent',
    'ComboboxViewport',
    'ComboboxVirtualizer',
    'ComboboxItem',
    'ComboboxItemIndicator',
    'ComboboxSeparator',
    'ComboboxArrow',
    'ComboboxPortal',
  ] as const,

  contextMenu: [
    'ContextMenuRoot',
    'ContextMenuTrigger',
    'ContextMenuPortal',
    'ContextMenuContent',
    'ContextMenuArrow',
    'ContextMenuItem',
    'ContextMenuGroup',
    'ContextMenuSeparator',
    'ContextMenuCheckboxItem',
    'ContextMenuItemIndicator',
    'ContextMenuLabel',
    'ContextMenuRadioGroup',
    'ContextMenuRadioItem',
    'ContextMenuSub',
    'ContextMenuSubContent',
    'ContextMenuSubTrigger',
  ] as const,

  dateField: [
    'DateFieldRoot',
    'DateFieldInput',
  ] as const,

  datePicker: [
    'DatePickerRoot',
    'DatePickerHeader',
    'DatePickerHeading',
    'DatePickerGrid',
    'DatePickerCell',
    'DatePickerHeadCell',
    'DatePickerNext',
    'DatePickerPrev',
    'DatePickerGridHead',
    'DatePickerGridBody',
    'DatePickerGridRow',
    'DatePickerCellTrigger',
    'DatePickerInput',
    'DatePickerCalendar',
    'DatePickerField',
    'DatePickerAnchor',
    'DatePickerArrow',
    'DatePickerClose',
    'DatePickerTrigger',
    'DatePickerContent',
  ] as const,

  dateRangePicker: [
    'DateRangePickerRoot',
    'DateRangePickerHeader',
    'DateRangePickerHeading',
    'DateRangePickerGrid',
    'DateRangePickerCell',
    'DateRangePickerHeadCell',
    'DateRangePickerNext',
    'DateRangePickerPrev',
    'DateRangePickerGridHead',
    'DateRangePickerGridBody',
    'DateRangePickerGridRow',
    'DateRangePickerCellTrigger',
    'DateRangePickerInput',
    'DateRangePickerCalendar',
    'DateRangePickerField',
    'DateRangePickerAnchor',
    'DateRangePickerArrow',
    'DateRangePickerClose',
    'DateRangePickerTrigger',
    'DateRangePickerContent',
  ] as const,

  dateRangeField: [
    'DateRangeFieldRoot',
    'DateRangeFieldInput',
  ] as const,

  dialog: [
    'DialogRoot',
    'DialogTrigger',
    'DialogPortal',
    'DialogContent',
    'DialogOverlay',
    'DialogClose',
    'DialogTitle',
    'DialogDescription',
  ] as const,

  dropdownMenu: [
    'DropdownMenuRoot',
    'DropdownMenuTrigger',
    'DropdownMenuPortal',
    'DropdownMenuContent',
    'DropdownMenuArrow',
    'DropdownMenuItem',
    'DropdownMenuGroup',
    'DropdownMenuSeparator',
    'DropdownMenuCheckboxItem',
    'DropdownMenuItemIndicator',
    'DropdownMenuLabel',
    'DropdownMenuRadioGroup',
    'DropdownMenuRadioItem',
    'DropdownMenuSub',
    'DropdownMenuSubContent',
    'DropdownMenuSubTrigger',
  ] as const,
  editable: [
    'EditableRoot',
    'EditableArea',
    'EditableInput',
    'EditablePreview',
    'EditableSubmitTrigger',
    'EditableCancelTrigger',
    'EditableEditTrigger',
  ] as const,

  hoverCard: [
    'HoverCardRoot',
    'HoverCardTrigger',
    'HoverCardPortal',
    'HoverCardContent',
    'HoverCardArrow',
  ] as const,

  label: [
    'Label',
  ] as const,

  listbox: [
    'ListboxRoot',
    'ListboxContent',
    'ListboxFilter',
    'ListboxItem',
    'ListboxItemIndicator',
    'ListboxVirtualizer',
    'ListboxGroup',
    'ListboxGroupLabel',
  ] as const,

  menubar: [
    'MenubarRoot',
    'MenubarTrigger',
    'MenubarPortal',
    'MenubarContent',
    'MenubarArrow',
    'MenubarItem',
    'MenubarGroup',
    'MenubarSeparator',
    'MenubarCheckboxItem',
    'MenubarItemIndicator',
    'MenubarLabel',
    'MenubarRadioGroup',
    'MenubarRadioItem',
    'MenubarSub',
    'MenubarSubContent',
    'MenubarSubTrigger',
    'MenubarMenu',
  ] as const,

  navigationMenu: [
    'NavigationMenuRoot',
    'NavigationMenuContent',
    'NavigationMenuIndicator',
    'NavigationMenuItem',
    'NavigationMenuLink',
    'NavigationMenuList',
    'NavigationMenuSub',
    'NavigationMenuTrigger',
    'NavigationMenuViewport',
  ] as const,

  numberField: [
    'NumberFieldRoot',
    'NumberFieldInput',
    'NumberFieldIncrement',
    'NumberFieldDecrement',
  ] as const,

  pagination: [
    'PaginationRoot',
    'PaginationEllipsis',
    'PaginationFirst',
    'PaginationLast',
    'PaginationList',
    'PaginationListItem',
    'PaginationNext',
    'PaginationPrev',
  ] as const,

  pinInput: [
    'PinInputRoot',
    'PinInputInput',
  ] as const,

  popover: [
    'PopoverRoot',
    'PopoverTrigger',
    'PopoverPortal',
    'PopoverContent',
    'PopoverArrow',
    'PopoverClose',
    'PopoverAnchor',
  ] as const,

  progress: [
    'ProgressRoot',
    'ProgressIndicator',
  ] as const,

  radioGroup: [
    'RadioGroupRoot',
    'RadioGroupItem',
    'RadioGroupIndicator',
  ] as const,

  rangeCalendar: [
    'RangeCalendarRoot',
    'RangeCalendarHeader',
    'RangeCalendarHeading',
    'RangeCalendarGrid',
    'RangeCalendarCell',
    'RangeCalendarHeadCell',
    'RangeCalendarNext',
    'RangeCalendarPrev',
    'RangeCalendarGridHead',
    'RangeCalendarGridBody',
    'RangeCalendarGridRow',
    'RangeCalendarCellTrigger',
  ] as const,

  scrollArea: [
    'ScrollAreaRoot',
    'ScrollAreaViewport',
    'ScrollAreaScrollbar',
    'ScrollAreaThumb',
    'ScrollAreaCorner',
  ] as const,

  select: [
    'SelectRoot',
    'SelectTrigger',
    'SelectPortal',
    'SelectContent',
    'SelectArrow',
    'SelectSeparator',
    'SelectItemIndicator',
    'SelectLabel',
    'SelectGroup',
    'SelectItem',
    'SelectItemText',
    'SelectViewport',
    'SelectScrollUpButton',
    'SelectScrollDownButton',
    'SelectValue',
    'SelectIcon',
  ] as const,

  separator: [
    'Separator',
  ] as const,

  slider: [
    'SliderRoot',
    'SliderThumb',
    'SliderTrack',
    'SliderRange',
  ] as const,

  splitter: [
    'SplitterGroup',
    'SplitterPanel',
    'SplitterResizeHandle',
  ] as const,

  stepper: [
    'StepperRoot',
    'StepperItem',
    'StepperTrigger',
    'StepperDescription',
    'StepperTitle',
    'StepperIndicator',
    'StepperSeparator',
  ] as const,

  switch: [
    'SwitchRoot',
    'SwitchThumb',
  ] as const,

  tabs: [
    'TabsRoot',
    'TabsList',
    'TabsContent',
    'TabsTrigger',
    'TabsIndicator',
  ] as const,

  tagsInput: [
    'TagsInputRoot',
    'TagsInputInput',
    'TagsInputItem',
    'TagsInputItemText',
    'TagsInputItemDelete',
    'TagsInputClear',
  ] as const,

  timeField: [
    'TimeFieldInput',
    'TimeFieldRoot',
  ] as const,

  toast: [
    'ToastProvider',
    'ToastRoot',
    'ToastPortal',
    'ToastAction',
    'ToastClose',
    'ToastViewport',
    'ToastTitle',
    'ToastDescription',
  ] as const,

  toggle: [
    'Toggle',
  ] as const,

  toggleGroup: [
    'ToggleGroupRoot',
    'ToggleGroupItem',
  ] as const,

  toolbar: [
    'ToolbarRoot',
    'ToolbarButton',
    'ToolbarLink',
    'ToolbarToggleGroup',
    'ToolbarToggleItem',
    'ToolbarSeparator',
  ] as const,

  tooltip: [
    'TooltipRoot',
    'TooltipTrigger',
    'TooltipContent',
    'TooltipArrow',
    'TooltipPortal',
    'TooltipProvider',
  ] as const,

  tree: [
    'TreeRoot',
    'TreeItem',
    'TreeVirtualizer',
  ] as const,

  viewport: [
    'Viewport',
  ] as const,

  // Utility component
  configProvider: [
    'ConfigProvider',
  ] as const,

  focusScope: [
    'FocusScope',
  ] as const,

  rovingFocus: [
    'RovingFocusGroup',
    'RovingFocusItem',
  ] as const,

  presence: [
    'Presence',
  ] as const,

  primitive: [
    'Primitive',
    'Slot',
  ] as const,

  visuallyHidden: [
    'VisuallyHidden',
  ] as const,
}

export const utilities = {
  utilities: [
    'useEmitAsProps',
    'useFilter',
    'useForwardProps',
    'useForwardPropsEmits',
    'useForwardExpose',
    'useId',
    'useStateMachine',
    'useBodyScrollLock',
    'useDateFormatter',
    'withDefault',
    'createContext',
  ] as const,
}

export type Components = typeof components
