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
  HoverCardArrowProps,
  HoverCardContentProps,
  HoverCardPortalProps,
  HoverCardRootEmits,
  HoverCardRootProps,
  HoverCardTriggerProps,
} from '@/HoverCard'
import type { HoverCardContentEmits } from '@/HoverCard/HoverCardContent.vue'
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
  'reka-alert-dialog-root': Part<AlertDialogProps, AlertDialogEmits>
  'reka-alert-dialog-trigger': Part<AlertDialogTriggerProps>
  'reka-alert-dialog-portal': Part<AlertDialogPortalProps>
  'reka-alert-dialog-overlay': Part<AlertDialogOverlayProps>
  'reka-alert-dialog-content': Part<AlertDialogContentProps, AlertDialogContentEmits>
  'reka-alert-dialog-title': Part<AlertDialogTitleProps>
  'reka-alert-dialog-description': Part<AlertDialogDescriptionProps>
  'reka-alert-dialog-cancel': Part<AlertDialogCancelProps>
  'reka-alert-dialog-action': Part<AlertDialogActionProps>
  'reka-checkbox-root': Part<CheckboxRootProps, CheckboxRootEmits>
  'reka-checkbox-indicator': Part<CheckboxIndicatorProps>
  'reka-checkbox-group-root': Part<CheckboxGroupRootProps, CheckboxGroupRootEmits>
  'reka-collapsible-root': Part<CollapsibleRootProps, CollapsibleRootEmits>
  'reka-collapsible-trigger': Part<CollapsibleTriggerProps>
  'reka-collapsible-content': Part<CollapsibleContentProps, CollapsibleContentEmits>
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
  'reka-dialog-root': Part<DialogRootProps, DialogRootEmits>
  'reka-dialog-trigger': Part<DialogTriggerProps>
  'reka-dialog-portal': Part<DialogPortalProps>
  'reka-dialog-overlay': Part<DialogOverlayProps>
  'reka-dialog-content': Part<DialogContentProps, DialogContentEmits>
  'reka-dialog-title': Part<DialogTitleProps>
  'reka-dialog-description': Part<DialogDescriptionProps>
  'reka-dialog-close': Part<DialogCloseProps>
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
  'reka-popover-root': Part<PopoverRootProps, PopoverRootEmits>
  'reka-popover-trigger': Part<PopoverTriggerProps>
  'reka-popover-anchor': Part<PopoverAnchorProps>
  'reka-popover-portal': Part<PopoverPortalProps>
  'reka-popover-content': Part<PopoverContentProps, PopoverContentEmits>
  'reka-popover-arrow': Part<PopoverArrowProps>
  'reka-popover-close': Part<PopoverCloseProps>
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
  'reka-tooltip-provider': Part<TooltipProviderProps>
  'reka-tooltip-root': Part<TooltipRootProps, TooltipRootEmits>
  'reka-tooltip-trigger': Part<TooltipTriggerProps>
  'reka-tooltip-portal': Part<TooltipPortalProps>
  'reka-tooltip-content': Part<TooltipContentProps, TooltipContentEmits>
  'reka-tooltip-arrow': Part<TooltipArrowProps>
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
