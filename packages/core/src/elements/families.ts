import type { DefineRekaElementsOptions } from './define'
import type { RekaElementFamily } from './meta'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from '@/Accordion'
import { AspectRatio } from '@/AspectRatio'
import { AvatarFallback, AvatarRoot } from '@/Avatar'
import { CheckboxGroupRoot, CheckboxIndicator, CheckboxRoot } from '@/Checkbox'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from '@/Collapsible'
import { ConfigProvider } from '@/ConfigProvider'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from '@/Dialog'
import { FieldDescription, FieldError, FieldLabel, FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
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
import { PopoverAnchor, PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'
import { ProgressIndicator, ProgressRoot } from '@/Progress'
import { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot } from '@/RadioGroup'
import { ScrollAreaCorner, ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from '@/ScrollArea'
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
import { Toggle } from '@/Toggle'
import { ToggleGroupItem, ToggleGroupRoot } from '@/ToggleGroup'
import { ToolbarButton, ToolbarRoot, ToolbarSeparator, ToolbarToggleGroup, ToolbarToggleItem } from '@/Toolbar'
import { VisuallyHidden } from '@/VisuallyHidden'
import { defineRekaElements } from './define'

// Each family is a plain object, so a bundler drops the ones an app never imports.

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

/** `<reka-popover-root>`, `-trigger`, `-anchor`, `-portal`, `-content`, `-close`. */
export const popoverElements: RekaElementFamily = {
  name: 'popover',
  parts: {
    PopoverRoot,
    PopoverTrigger,
    PopoverAnchor: { component: PopoverAnchor, attributes: { reference: 'property' } },
    PopoverPortal,
    PopoverContent: {
      component: PopoverContent,
      attributes: { reference: 'property', collisionBoundary: 'property' },
    },
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
 * `<reka-stepper-root>`, `-item`, `-trigger`, `-indicator`, `-title`,
 * `-description`, `-separator`.
 */
export const stepperElements: RekaElementFamily = {
  name: 'stepper',
  parts: {
    // Its "Step 2 of 4" live region goes inside the element.
    StepperRoot: { component: StepperRoot, siblings: 'append' },
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

/** Every family available as custom elements. Importing it bundles all of them. */
export const rekaElementFamilies: readonly RekaElementFamily[] = [
  accordionElements,
  aspectRatioElements,
  avatarElements,
  checkboxElements,
  collapsibleElements,
  configProviderElements,
  dialogElements,
  fieldElements,
  formElements,
  paginationElements,
  popoverElements,
  progressElements,
  radioGroupElements,
  scrollAreaElements,
  separatorElements,
  splitterElements,
  stepperElements,
  switchElements,
  tabsElements,
  toggleElements,
  toggleGroupElements,
  toolbarElements,
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

export function defineCheckboxElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([checkboxElements], options)
}

export function defineCollapsibleElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([collapsibleElements], options)
}

export function defineDialogElements(options?: DefineRekaElementsOptions) {
  return defineRekaElements([dialogElements], options)
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
