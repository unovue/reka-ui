import type { DefineRekaElementsOptions } from './define'
import type { AttributeKind, RekaElementFamily, RekaElementPartDefinition } from './meta'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from '@/Accordion'
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/AlertDialog'
import { AspectRatio } from '@/AspectRatio'
import { AutocompleteInput, AutocompleteRoot } from '@/Autocomplete'
import { AvatarFallback, AvatarRoot } from '@/Avatar'
import { CheckboxGroupRoot, CheckboxIndicator, CheckboxRoot } from '@/Checkbox'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from '@/Collapsible'
import {
  ComboboxAnchor,
  ComboboxArrow,
  ComboboxCancel,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxLabel,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxViewport,
} from '@/Combobox'
import { ConfigProvider } from '@/ConfigProvider'
import {
  ContextMenuArrow,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuItemIndicator,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/ContextMenu'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from '@/Dialog'
import {
  DrawerBackdrop,
  DrawerClose,
  DrawerDescription,
  DrawerGrabber,
  DrawerIndent,
  DrawerIndentBackground,
  DrawerPopup,
  DrawerPortal,
  DrawerProvider,
  DrawerRoot,
  DrawerSwipeArea,
  DrawerTitle,
  DrawerTrigger,
  DrawerViewport,
  DrawerVirtualKeyboardProvider,
} from '@/Drawer'
import {
  DropdownMenuArrow,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuFilter,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuItemIndicator,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/DropdownMenu'
import {
  EditableArea,
  EditableCancelTrigger,
  EditableEditTrigger,
  EditableInput,
  EditablePreview,
  EditableRoot,
  EditableSubmitTrigger,
  injectEditableRootContext,
} from '@/Editable'
import { FieldDescription, FieldError, FieldLabel, FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
import { HoverCardArrow, HoverCardContent, HoverCardPortal, HoverCardRoot, HoverCardTrigger } from '@/HoverCard'
import {
  ListboxContent,
  ListboxFilter,
  ListboxGroup,
  ListboxGroupLabel,
  ListboxItem,
  ListboxItemIndicator,
  ListboxRoot,
} from '@/Listbox'
import {
  MenubarArrow,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarItemIndicator,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarRoot,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/Menubar'
import {
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuRoot,
  NavigationMenuSub,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from '@/NavigationMenu'
import {
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
  PaginationRoot,
} from '@/Pagination'
import { PopoverAnchor, PopoverArrow, PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'
import { ProgressIndicator, ProgressRoot } from '@/Progress'
import { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot } from '@/RadioGroup'
import { ScrollAreaCorner, ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from '@/ScrollArea'
import {
  SelectArrow,
  SelectContent,
  SelectGroup,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from '@/Select'
import { Separator } from '@/Separator'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from '@/Splitter'
import {
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperRoot,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@/Stepper'
import { SwitchRoot, SwitchThumb } from '@/Switch'
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from '@/Tabs'
import { TagGroupItem, TagGroupItemDelete, TagGroupItemText, TagGroupRoot } from '@/TagGroup'
import {
  injectTagsInputItemContext,
  TagsInputClear,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
  TagsInputRoot,
} from '@/TagsInput'
import {
  ToastAction,
  ToastArrow,
  ToastClose,
  ToastDescription,
  ToastPortal,
  ToastPositioner,
  ToastRoot,
  ToastTitle,
  ToastViewport,
} from '@/Toast'
import { Toggle } from '@/Toggle'
import { ToggleGroupItem, ToggleGroupRoot } from '@/ToggleGroup'
import { ToolbarButton, ToolbarRoot, ToolbarSeparator, ToolbarToggleGroup, ToolbarToggleItem } from '@/Toolbar'
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from '@/Tooltip'
import { TreeItem, TreeRoot } from '@/Tree'
import { VisuallyHidden } from '@/VisuallyHidden'
import { defineRekaElements } from './define'
import { ToastProviderElement } from './toast'

// Each family is a plain object, so a bundler drops the ones an app never imports.

/** Positioned content: the reference and collision boundary are elements, not attributes. */
const POPPER_PROPERTIES: Record<string, AttributeKind> = { reference: 'property', collisionBoundary: 'property' }
/** A menu checkbox item's value can be `'indeterminate'`. */
const CHECKED_STATE: Record<string, AttributeKind> = { modelValue: 'booleanish' }

/** `<reka-alert-dialog-root>`, `-trigger`, `-portal`, `-overlay`, `-content`, `-title`, `-description`, `-cancel`, `-action`. */
export const alertDialogElements: RekaElementFamily = {
  name: 'alert-dialog',
  parts: {
    AlertDialogRoot,
    AlertDialogTrigger,
    AlertDialogPortal,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogCancel,
    AlertDialogAction,
  },
}

/** `<reka-accordion-root>`, `-item`, `-header`, `-trigger`, `-content`. */
export const accordionElements: RekaElementFamily = {
  name: 'accordion',
  parts: {
    AccordionRoot,
    AccordionItem,
    AccordionHeader,
    // Renders `CollapsibleTrigger`, a `<button>` by default.
    AccordionTrigger: { component: AccordionTrigger, semantics: 'button' },
    AccordionContent,
  },
}

/** `<reka-checkbox-root>`, `-indicator`, `<reka-checkbox-group-root>`. */
export const checkboxElements: RekaElementFamily = {
  name: 'checkbox',
  parts: {
    CheckboxRoot: { component: CheckboxRoot, attributes: { modelValue: 'booleanish', defaultValue: 'booleanish' } },
    CheckboxIndicator,
    CheckboxGroupRoot,
  },
}

/** `<reka-collapsible-root>`, `-trigger`, `-content`. */
export const collapsibleElements: RekaElementFamily = {
  name: 'collapsible',
  parts: {
    CollapsibleRoot,
    CollapsibleTrigger,
    CollapsibleContent,
  },
}

/**
 * `<reka-context-menu-root>`, `-trigger`, `-portal`, `-content`, `-arrow`, `-item`, `-group`,
 * `-label`, `-checkbox-item`, `-radio-group`, `-radio-item`, `-item-indicator`, `-separator`,
 * `-sub`, `-sub-trigger`, `-sub-content`.
 */
export const contextMenuElements: RekaElementFamily = {
  name: 'context-menu',
  parts: {
    ContextMenuRoot,
    ContextMenuTrigger,
    ContextMenuPortal,
    ContextMenuContent: { component: ContextMenuContent, attributes: POPPER_PROPERTIES },
    ContextMenuArrow,
    ContextMenuItem,
    ContextMenuGroup,
    ContextMenuLabel,
    ContextMenuCheckboxItem: { component: ContextMenuCheckboxItem, attributes: CHECKED_STATE },
    ContextMenuRadioGroup,
    ContextMenuRadioItem,
    ContextMenuItemIndicator,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubTrigger,
    ContextMenuSubContent: { component: ContextMenuSubContent, attributes: POPPER_PROPERTIES },
  },
}

/** `<reka-dialog-root>`, `-trigger`, `-portal`, `-overlay`, `-content`, `-title`, `-description`, `-close`. */
export const dialogElements: RekaElementFamily = {
  name: 'dialog',
  parts: {
    DialogRoot,
    DialogTrigger,
    DialogPortal,
    DialogOverlay,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogClose,
  },
}

/**
 * `<reka-drawer-root>`, `-trigger`, `-portal`, `-backdrop`, `-viewport`, `-popup`, `-title`,
 * `-description`, `-close`, `-grabber`, `-swipe-area`, `-provider`, `-indent`,
 * `-indent-background`, `-virtual-keyboard-provider`.
 */
export const drawerElements: RekaElementFamily = {
  name: 'drawer',
  parts: {
    DrawerRoot,
    DrawerTrigger,
    DrawerPortal,
    DrawerBackdrop,
    DrawerViewport,
    DrawerPopup,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
    DrawerGrabber,
    DrawerSwipeArea,
    DrawerProvider,
    DrawerIndent,
    DrawerIndentBackground,
    DrawerVirtualKeyboardProvider,
  },
}

/**
 * `<reka-dropdown-menu-root>`, `-trigger`, `-portal`, `-content`, `-filter`, `-arrow`, `-item`, `-group`,
 * `-label`, `-checkbox-item`, `-radio-group`, `-radio-item`, `-item-indicator`, `-separator`,
 * `-sub`, `-sub-trigger`, `-sub-content`.
 */
export const dropdownMenuElements: RekaElementFamily = {
  name: 'dropdown-menu',
  parts: {
    DropdownMenuRoot,
    DropdownMenuTrigger,
    DropdownMenuPortal,
    DropdownMenuContent: { component: DropdownMenuContent, attributes: POPPER_PROPERTIES },
    // A text field: the part renders onto the element's `<input>` child.
    DropdownMenuFilter: { component: DropdownMenuFilter, target: 'input' },
    DropdownMenuArrow,
    DropdownMenuItem,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuCheckboxItem: { component: DropdownMenuCheckboxItem, attributes: CHECKED_STATE },
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuItemIndicator,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent: { component: DropdownMenuSubContent, attributes: POPPER_PROPERTIES },
  },
}

/** `<reka-hover-card-root>`, `-trigger`, `-portal`, `-content`, `-arrow`. */
export const hoverCardElements: RekaElementFamily = {
  name: 'hover-card',
  parts: {
    HoverCardRoot,
    HoverCardTrigger: { component: HoverCardTrigger, attributes: { reference: 'property' } },
    HoverCardPortal,
    HoverCardContent: { component: HoverCardContent, attributes: POPPER_PROPERTIES },
    HoverCardArrow,
  },
}

/**
 * `<reka-menubar-root>`, `-menu`, `-trigger`, `-portal`, `-content`, `-arrow`, `-item`, `-group`,
 * `-label`, `-checkbox-item`, `-radio-group`, `-radio-item`, `-item-indicator`, `-separator`,
 * `-sub`, `-sub-trigger`, `-sub-content`.
 */
export const menubarElements: RekaElementFamily = {
  name: 'menubar',
  parts: {
    MenubarRoot,
    MenubarMenu,
    MenubarTrigger,
    MenubarPortal,
    MenubarContent: { component: MenubarContent, attributes: POPPER_PROPERTIES },
    MenubarArrow,
    MenubarItem,
    MenubarGroup,
    MenubarLabel,
    MenubarCheckboxItem: { component: MenubarCheckboxItem, attributes: CHECKED_STATE },
    MenubarRadioGroup,
    MenubarRadioItem,
    MenubarItemIndicator,
    MenubarSeparator,
    MenubarSub,
    MenubarSubTrigger,
    MenubarSubContent: { component: MenubarSubContent, attributes: POPPER_PROPERTIES },
  },
}

/**
 * `<reka-navigation-menu-root>`, `-sub`, `-list`, `-item`, `-trigger`, `-content`, `-link`,
 * `-indicator`, `-viewport`.
 */
export const navigationMenuElements: RekaElementFamily = {
  name: 'navigation-menu',
  parts: {
    NavigationMenuRoot,
    NavigationMenuSub,
    NavigationMenuList,
    NavigationMenuItem,
    // While open with a viewport, it renders a focus proxy (Tab moves into the
    // content) and an `aria-owns` element next to itself.
    NavigationMenuTrigger: { component: NavigationMenuTrigger, siblings: 'after' },
    NavigationMenuContent,
    NavigationMenuLink,
    NavigationMenuIndicator,
    NavigationMenuViewport,
  },
}

/** `<reka-popover-root>`, `-trigger`, `-anchor`, `-portal`, `-content`, `-arrow`, `-close`. */
export const popoverElements: RekaElementFamily = {
  name: 'popover',
  parts: {
    PopoverRoot,
    PopoverTrigger,
    PopoverAnchor: { component: PopoverAnchor, attributes: { reference: 'property' } },
    PopoverPortal,
    PopoverContent: { component: PopoverContent, attributes: POPPER_PROPERTIES },
    PopoverArrow,
    PopoverClose,
  },
}

/** `<reka-switch-root>`, `-thumb`. */
export const switchElements: RekaElementFamily = {
  name: 'switch',
  parts: {
    SwitchRoot: { component: SwitchRoot, attributes: { modelValue: 'booleanish', defaultValue: 'booleanish' } },
    SwitchThumb,
  },
}

/** `<reka-tabs-root>`, `-list`, `-trigger`, `-content`, `-indicator`. */
export const tabsElements: RekaElementFamily = {
  name: 'tabs',
  parts: {
    TabsRoot,
    TabsList,
    TabsTrigger,
    TabsContent,
    TabsIndicator,
  },
}

/**
 * `<reka-toast-provider>`, `-viewport`, `-root`, `-title`, `-description`, `-action`, `-close`,
 * `-portal`, `-positioner`, `-arrow`.
 */
export const toastElements: RekaElementFamily = {
  name: 'toast',
  parts: {
    ToastProvider: ToastProviderElement,
    ToastViewport,
    // Its live-region announcement renders next to it (the toast itself moves
    // into the viewport).
    ToastRoot: { component: ToastRoot, siblings: 'after' },
    ToastTitle,
    ToastDescription,
    ToastAction,
    ToastClose,
    ToastPortal,
    ToastPositioner: {
      component: ToastPositioner,
      attributes: { anchor: 'property', collisionBoundary: 'property' },
    },
    ToastArrow,
  },
}

/** `<reka-toggle>`. */
export const toggleElements: RekaElementFamily = {
  name: 'toggle',
  parts: {
    Toggle,
  },
}

/** `<reka-aspect-ratio>`. */
export const aspectRatioElements: RekaElementFamily = {
  name: 'aspect-ratio',
  parts: {
    // Renders a sizing wrapper around itself, which takes the element's place.
    AspectRatio,
  },
}

/** `<reka-tooltip-provider>`, `<reka-tooltip-root>`, `-trigger`, `-portal`, `-content`, `-arrow`. */
export const tooltipElements: RekaElementFamily = {
  name: 'tooltip',
  parts: {
    TooltipProvider,
    TooltipRoot,
    TooltipTrigger: { component: TooltipTrigger, attributes: { reference: 'property' } },
    TooltipPortal,
    TooltipContent: { component: TooltipContent, attributes: { collisionBoundary: 'property' } },
    TooltipArrow,
  },
}

// Collections. Values can be of any type: an attribute sets a string, the
// property any value (objects are compared with `by`). Functions (`filter`,
// `displayValue`, `getKey`) and elements (`reference`) are properties only.

/**
 * `<reka-listbox-root>`, `-content`, `-filter`, `-item`, `-item-indicator`, `-group`,
 * `-group-label`. Not `ListboxVirtualizer`: it renders its items from a scoped slot.
 */
export const listboxElements: RekaElementFamily = {
  name: 'listbox',
  parts: {
    ListboxRoot: { component: ListboxRoot, attributes: { filter: 'property' } },
    ListboxContent,
    // A text field: the part renders onto the element's `<input>` child.
    ListboxFilter: { component: ListboxFilter, target: 'input' },
    ListboxItem,
    ListboxItemIndicator,
    ListboxGroup,
    ListboxGroupLabel,
  },
}

// (Families are written out in full: a call or a spread at module level would
// keep every family in a bundle that imports one.)

/** Shows its value while it has no children, like the Vue component's fallback. */
const COMBOBOX_ITEM: RekaElementPartDefinition = { component: ComboboxItem, text: (_slotProps, props) => props.value }

/**
 * `<reka-combobox-root>`, `-input`, `-anchor`, `-trigger`, `-cancel`, `-portal`,
 * `-content`, `-viewport`, `-empty`, `-item`, `-item-indicator`, `-group`, `-label`,
 * `-separator`, `-arrow`. Not `ComboboxVirtualizer` (a scoped slot).
 */
export const comboboxElements: RekaElementFamily = {
  name: 'combobox',
  parts: {
    ComboboxRoot: { component: ComboboxRoot, attributes: { filter: 'property' } },
    ComboboxInput: { component: ComboboxInput, target: 'input' },
    ComboboxAnchor: { component: ComboboxAnchor, attributes: POPPER_PROPERTIES },
    ComboboxTrigger,
    ComboboxCancel,
    ComboboxPortal,
    ComboboxContent: { component: ComboboxContent, attributes: POPPER_PROPERTIES },
    ComboboxViewport,
    ComboboxEmpty,
    ComboboxItem: COMBOBOX_ITEM,
    ComboboxItemIndicator,
    ComboboxGroup,
    ComboboxLabel,
    ComboboxSeparator,
    ComboboxArrow,
  },
}

/**
 * `<reka-avatar-root>`, `-fallback`. `AvatarImage` is not available: a custom
 * element cannot be an `<img>`.
 */
export const avatarElements: RekaElementFamily = {
  name: 'avatar',
  parts: {
    AvatarRoot,
    AvatarFallback,
  },
}

/**
 * `<reka-autocomplete-root>`, `-input`, and the Combobox parts under the
 * Autocomplete name (`-anchor`, `-content`, `-item`, …), as in Vue.
 */
export const autocompleteElements: RekaElementFamily = {
  name: 'autocomplete',
  parts: {
    AutocompleteRoot: { component: AutocompleteRoot, attributes: { filter: 'property' } },
    AutocompleteInput: { component: AutocompleteInput, target: 'input' },
    AutocompleteAnchor: { component: ComboboxAnchor, attributes: POPPER_PROPERTIES },
    AutocompleteTrigger: ComboboxTrigger,
    AutocompleteCancel: ComboboxCancel,
    AutocompletePortal: ComboboxPortal,
    AutocompleteContent: { component: ComboboxContent, attributes: POPPER_PROPERTIES },
    AutocompleteViewport: ComboboxViewport,
    AutocompleteEmpty: ComboboxEmpty,
    AutocompleteItem: COMBOBOX_ITEM,
    AutocompleteItemIndicator: ComboboxItemIndicator,
    AutocompleteGroup: ComboboxGroup,
    AutocompleteLabel: ComboboxLabel,
    AutocompleteSeparator: ComboboxSeparator,
  },
}

/**
 * `<reka-config-provider>`: provides `dir`, `locale`, `nonce`, `scroll-body` and
 * `teleport-to` to the Reka elements inside it, as `ConfigProvider` does in Vue.
 */
export const configProviderElements: RekaElementFamily = {
  name: 'config-provider',
  parts: {
    ConfigProvider,
  },
}

/**
 * `<reka-field-root>`, `-label`, `-description`, `-error`. `FieldControl` (an
 * `<input>`) and `FieldValidity` (a scoped slot) are not available: use a Reka
 * element control, such as `<reka-checkbox-root>`.
 */
export const fieldElements: RekaElementFamily = {
  name: 'field',
  parts: {
    FieldRoot,
    // Never a native `<label>`: labels its control through `aria-labelledby`, and
    // focuses it on click.
    FieldLabel: { component: FieldLabel, fixedProps: { nativeLabel: false, for: undefined } },
    FieldDescription,
    // `match` is a flag or a `ValidityState` key: `match`, `match="valueMissing"`.
    FieldError: { component: FieldError, attributes: { match: 'booleanish' } },
  },
}

/** `<reka-form-root>`, around a native `<form novalidate>`. */
export const formElements: RekaElementFamily = {
  name: 'form',
  parts: {
    FormRoot: {
      component: FormRoot,
      // Listening to `form-submit` prevents the native submission.
      listenedEmits: ['formSubmit'],
    },
  },
}

/**
 * `<reka-select-root>`, `-trigger`, `-value`, `-icon`, `-portal`, `-content`,
 * `-viewport`, `-scroll-up-button`, `-scroll-down-button`, `-item`, `-item-text`,
 * `-item-indicator`, `-group`, `-label`, `-separator`, `-arrow`. Not
 * `SelectVirtualizer` (a scoped slot).
 */
export const selectElements: RekaElementFamily = {
  name: 'select',
  parts: {
    SelectRoot,
    SelectTrigger: { component: SelectTrigger, attributes: { reference: 'property' } },
    SelectValue: {
      component: SelectValue,
      // The selected labels, or the placeholder.
      text: ({ selectedLabels }, props) => selectedLabels?.length ? selectedLabels.join(', ') : props.placeholder,
    },
    SelectIcon,
    SelectPortal,
    SelectContent: { component: SelectContent, attributes: POPPER_PROPERTIES },
    SelectViewport,
    SelectScrollUpButton,
    SelectScrollDownButton,
    SelectItem,
    SelectItemText,
    SelectItemIndicator,
    SelectGroup,
    SelectLabel,
    SelectSeparator,
    SelectArrow,
  },
}

/**
 * `<reka-pagination-root>`, `-list`, `-list-item`, `-first`, `-prev`, `-next`,
 * `-last`, `-ellipsis`.
 */
export const paginationElements: RekaElementFamily = {
  name: 'pagination',
  parts: {
    PaginationRoot,
    PaginationList,
    PaginationListItem,
    PaginationFirst,
    PaginationPrev,
    PaginationNext,
    PaginationLast,
    PaginationEllipsis,
  },
}

/** `<reka-progress-root>`, `-indicator`. */
export const progressElements: RekaElementFamily = {
  name: 'progress',
  parts: {
    ProgressRoot,
    ProgressIndicator,
  },
}

/** `<reka-radio-group-root>`, `-item`, `-indicator`. */
export const radioGroupElements: RekaElementFamily = {
  name: 'radio-group',
  parts: {
    RadioGroupRoot,
    RadioGroupItem,
    RadioGroupIndicator,
  },
}

/** `<reka-scroll-area-root>`, `-viewport`, `-scrollbar`, `-thumb`, `-corner`. */
export const scrollAreaElements: RekaElementFamily = {
  name: 'scroll-area',
  parts: {
    ScrollAreaRoot,
    // The element is the content: the scrolling viewport is a wrapper around it.
    ScrollAreaViewport,
    ScrollAreaScrollbar,
    ScrollAreaThumb,
    ScrollAreaCorner,
  },
}

/** `<reka-separator>`. */
export const separatorElements: RekaElementFamily = {
  name: 'separator',
  parts: {
    Separator,
  },
}

/** `<reka-splitter-group>`, `-panel`, `-resize-handle`. */
export const splitterElements: RekaElementFamily = {
  name: 'splitter',
  parts: {
    SplitterGroup,
    SplitterPanel,
    SplitterResizeHandle,
  },
}

/**
 * `<reka-tree-root>`, `<reka-tree-item>`. In Vue the root hands its flattened items
 * to a scoped slot; as elements you render the items (see the guide). Not
 * `TreeVirtualizer` (a scoped slot).
 */
export const treeElements: RekaElementFamily = {
  name: 'tree',
  parts: {
    // Items are objects.
    TreeRoot: { component: TreeRoot, attributes: { modelValue: 'property', defaultValue: 'property' } },
    TreeItem: { component: TreeItem, attributes: { value: 'property' } },
  },
}

/** `<reka-tags-input-root>`, `-input`, `-item`, `-item-text`, `-item-delete`, `-clear`. */
export const tagsInputElements: RekaElementFamily = {
  name: 'tags-input',
  parts: {
    TagsInputRoot,
    TagsInputInput: { component: TagsInputInput, target: 'input' },
    TagsInputItem,
    // Shows the tag's `displayValue` while it has no children.
    TagsInputItemText: { component: TagsInputItemText, text: () => injectTagsInputItemContext().displayValue.value },
    TagsInputItemDelete,
    TagsInputClear,
  },
}

/** `<reka-tag-group-root>`, `-item`, `-item-text`, `-item-delete`. */
export const tagGroupElements: RekaElementFamily = {
  name: 'tag-group',
  parts: {
    TagGroupRoot,
    TagGroupItem,
    TagGroupItemText,
    TagGroupItemDelete,
  },
}

/**
 * `<reka-stepper-root>`, `-item`, `-trigger`, `-indicator`, `-title`,
 * `-description`, `-separator`.
 */
export const stepperElements: RekaElementFamily = {
  name: 'stepper',
  parts: {
    // Its "Step 2 of 4" live region goes inside the element.
    StepperRoot: { component: StepperRoot, siblings: 'inside' },
    StepperItem,
    StepperTrigger,
    StepperIndicator,
    StepperTitle,
    StepperDescription,
    StepperSeparator,
  },
}

/** `<reka-toggle-group-root>`, `-item`. */
export const toggleGroupElements: RekaElementFamily = {
  name: 'toggle-group',
  parts: {
    ToggleGroupRoot,
    ToggleGroupItem,
  },
}

/**
 * `<reka-toolbar-root>`, `-button`, `-separator`, `-toggle-group`, `-toggle-item`.
 * `ToolbarLink` is not available: a custom element cannot be a link.
 */
export const toolbarElements: RekaElementFamily = {
  name: 'toolbar',
  parts: {
    ToolbarRoot,
    ToolbarButton,
    ToolbarSeparator,
    ToolbarToggleGroup,
    // Renders `ToggleGroupItem`, a `<button>` by default.
    ToolbarToggleItem: { component: ToolbarToggleItem, semantics: 'button' },
  },
}

/** `<reka-visually-hidden>`. */
export const visuallyHiddenElements: RekaElementFamily = {
  name: 'visually-hidden',
  parts: {
    VisuallyHidden,
  },
}

/**
 * `<reka-editable-root>`, `-area`, `-input`, `-preview`, `-edit-trigger`,
 * `-submit-trigger`, `-cancel-trigger`.
 */
export const editableElements: RekaElementFamily = {
  name: 'editable',
  parts: {
    EditableRoot,
    EditableArea,
    EditableInput: { component: EditableInput, target: 'input' },
    EditablePreview: {
      component: EditablePreview,
      // The value, or the preview placeholder.
      text: () => {
        const context = injectEditableRootContext()
        return context.modelValue.value || context.placeholder.value?.preview
      },
    },
    EditableEditTrigger,
    EditableSubmitTrigger,
    EditableCancelTrigger,
  },
}

/** Every family available as custom elements. Importing it bundles all of them. */
export const rekaElementFamilies: readonly RekaElementFamily[] = [
  accordionElements,
  alertDialogElements,
  aspectRatioElements,
  autocompleteElements,
  avatarElements,
  checkboxElements,
  collapsibleElements,
  comboboxElements,
  configProviderElements,
  contextMenuElements,
  dialogElements,
  drawerElements,
  dropdownMenuElements,
  editableElements,
  fieldElements,
  formElements,
  hoverCardElements,
  listboxElements,
  menubarElements,
  navigationMenuElements,
  paginationElements,
  popoverElements,
  progressElements,
  radioGroupElements,
  scrollAreaElements,
  selectElements,
  separatorElements,
  splitterElements,
  stepperElements,
  switchElements,
  tabsElements,
  tagGroupElements,
  tagsInputElements,
  toastElements,
  toggleElements,
  toggleGroupElements,
  toolbarElements,
  tooltipElements,
  treeElements,
  visuallyHiddenElements,
]

/**
 * Registers every supported family: a single call for a page that uses many of
 * them (or a CDN build). Importing it bundles all of them; prefer the per-family
 * helpers otherwise.
 */
export function defineAllRekaElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements(rekaElementFamilies, options)
}

export function defineAccordionElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([accordionElements], options)
}

export function defineAlertDialogElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([alertDialogElements], options)
}

export function defineCheckboxElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([checkboxElements], options)
}

export function defineCollapsibleElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([collapsibleElements], options)
}

export function defineContextMenuElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([contextMenuElements], options)
}

export function defineDialogElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([dialogElements], options)
}

export function defineDrawerElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([drawerElements], options)
}

export function defineDropdownMenuElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([dropdownMenuElements], options)
}

export function defineHoverCardElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([hoverCardElements], options)
}

export function defineMenubarElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([menubarElements], options)
}

export function defineNavigationMenuElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([navigationMenuElements], options)
}

export function definePopoverElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([popoverElements], options)
}

export function defineSwitchElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([switchElements], options)
}

export function defineTabsElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([tabsElements], options)
}

export function defineToastElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([toastElements], options)
}

export function defineToggleElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([toggleElements], options)
}

export function defineAspectRatioElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([aspectRatioElements], options)
}

export function defineAvatarElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([avatarElements], options)
}

export function defineConfigProviderElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([configProviderElements], options)
}

export function defineFieldElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([fieldElements], options)
}

export function defineFormElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([formElements], options)
}

export function definePaginationElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([paginationElements], options)
}

export function defineProgressElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([progressElements], options)
}

export function defineRadioGroupElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([radioGroupElements], options)
}

export function defineScrollAreaElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([scrollAreaElements], options)
}

export function defineSeparatorElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([separatorElements], options)
}

export function defineSplitterElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([splitterElements], options)
}

export function defineStepperElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([stepperElements], options)
}

export function defineToggleGroupElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([toggleGroupElements], options)
}

export function defineToolbarElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([toolbarElements], options)
}

export function defineVisuallyHiddenElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([visuallyHiddenElements], options)
}

export function defineTooltipElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([tooltipElements], options)
}

export function defineAutocompleteElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([autocompleteElements], options)
}

export function defineComboboxElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([comboboxElements], options)
}

export function defineEditableElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([editableElements], options)
}

export function defineListboxElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([listboxElements], options)
}

export function defineSelectElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([selectElements], options)
}

export function defineTagGroupElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([tagGroupElements], options)
}

export function defineTagsInputElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([tagsInputElements], options)
}

export function defineTreeElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([treeElements], options)
}
