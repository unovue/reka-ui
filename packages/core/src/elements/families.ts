import type { DefineRekaElementsOptions } from './define'
import type { AttributeKind, RekaElementFamily } from './meta'
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
import { CheckboxGroupRoot, CheckboxIndicator, CheckboxRoot } from '@/Checkbox'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from '@/Collapsible'
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
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from '@/Dialog'
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
import { HoverCardArrow, HoverCardContent, HoverCardPortal, HoverCardRoot, HoverCardTrigger } from '@/HoverCard'
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
import { PopoverAnchor, PopoverArrow, PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'
import { SwitchRoot, SwitchThumb } from '@/Switch'
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from '@/Tabs'
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
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from '@/Tooltip'
import { defineRekaElements } from './define'
import { ToastProviderElement } from './toast'

// Each family is a plain object, so a bundler drops the ones an app never imports.

/** Positioned content: the reference and collision boundary are elements, not attributes. */
const FLOATING: Record<string, AttributeKind> = { reference: 'property', collisionBoundary: 'property' }
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
    ContextMenuContent: { component: ContextMenuContent, attributes: FLOATING },
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
    ContextMenuSubContent: { component: ContextMenuSubContent, attributes: FLOATING },
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
 * `<reka-dropdown-menu-root>`, `-trigger`, `-portal`, `-content`, `-arrow`, `-item`, `-group`,
 * `-label`, `-checkbox-item`, `-radio-group`, `-radio-item`, `-item-indicator`, `-separator`,
 * `-sub`, `-sub-trigger`, `-sub-content`.
 */
export const dropdownMenuElements: RekaElementFamily = {
  name: 'dropdown-menu',
  parts: {
    DropdownMenuRoot,
    DropdownMenuTrigger,
    DropdownMenuPortal,
    DropdownMenuContent: { component: DropdownMenuContent, attributes: FLOATING },
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
    DropdownMenuSubContent: { component: DropdownMenuSubContent, attributes: FLOATING },
  },
}

/** `<reka-hover-card-root>`, `-trigger`, `-portal`, `-content`, `-arrow`. */
export const hoverCardElements: RekaElementFamily = {
  name: 'hover-card',
  parts: {
    HoverCardRoot,
    HoverCardTrigger: { component: HoverCardTrigger, attributes: { reference: 'property' } },
    HoverCardPortal,
    HoverCardContent: { component: HoverCardContent, attributes: FLOATING },
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
    MenubarContent: { component: MenubarContent, attributes: FLOATING },
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
    MenubarSubContent: { component: MenubarSubContent, attributes: FLOATING },
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
    NavigationMenuTrigger: { component: NavigationMenuTrigger, siblings: true },
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
    PopoverContent: { component: PopoverContent, attributes: FLOATING },
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
    ToastRoot: { component: ToastRoot, siblings: true },
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

/** Every family available as custom elements. Importing it bundles all of them. */
export const rekaElementFamilies: readonly RekaElementFamily[] = [
  accordionElements,
  alertDialogElements,
  checkboxElements,
  collapsibleElements,
  contextMenuElements,
  dialogElements,
  drawerElements,
  dropdownMenuElements,
  hoverCardElements,
  menubarElements,
  navigationMenuElements,
  popoverElements,
  switchElements,
  tabsElements,
  toastElements,
  toggleElements,
  tooltipElements,
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

export function defineTooltipElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([tooltipElements], options)
}
