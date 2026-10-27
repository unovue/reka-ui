import type { DefineRekaElementsOptions } from './define'
import type { RekaElementFamily } from './meta'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from '@/Accordion'
import { CheckboxGroupRoot, CheckboxIndicator, CheckboxRoot } from '@/Checkbox'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from '@/Collapsible'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from '@/Dialog'
import { PopoverAnchor, PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'
import { SwitchRoot, SwitchThumb } from '@/Switch'
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from '@/Tabs'
import { Toggle } from '@/Toggle'
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

/** Every family available as custom elements. Importing it bundles all of them. */
export const rekaElementFamilies: readonly RekaElementFamily[] = [
  accordionElements,
  checkboxElements,
  collapsibleElements,
  dialogElements,
  popoverElements,
  switchElements,
  tabsElements,
  toggleElements,
]

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
