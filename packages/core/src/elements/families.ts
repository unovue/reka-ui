import type { DefineRekaElementsOptions } from './define'
import type { RekaElementFamily, RekaElementPartDefinition } from './meta'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from '@/Accordion'
import { AutocompleteInput, AutocompleteRoot } from '@/Autocomplete'
import { CheckboxGroupRoot, CheckboxIndicator, CheckboxRoot } from '@/Checkbox'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from '@/Collapsible'
import {
  ComboboxAnchor,
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
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from '@/Dialog'
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
import {
  ListboxContent,
  ListboxFilter,
  ListboxGroup,
  ListboxGroupLabel,
  ListboxItem,
  ListboxItemIndicator,
  ListboxRoot,
} from '@/Listbox'
import { PopoverAnchor, PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@/Popover'
import {
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
import { Toggle } from '@/Toggle'
import { TreeItem, TreeRoot } from '@/Tree'
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

// Collections. Values can be of any type: an attribute sets a string, the
// property any value (objects are compared with `by`). Functions (`filter`,
// `displayValue`, `getKey`) and elements (`reference`) are properties only.

const POPPER_PROPERTIES = { reference: 'property', collisionBoundary: 'property' } as const

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
 * `-separator`. Not `ComboboxArrow` (an SVG, like `PopoverArrow`) or
 * `ComboboxVirtualizer` (a scoped slot).
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
 * `<reka-select-root>`, `-trigger`, `-value`, `-icon`, `-portal`, `-content`,
 * `-viewport`, `-scroll-up-button`, `-scroll-down-button`, `-item`, `-item-text`,
 * `-item-indicator`, `-group`, `-label`, `-separator`. Not `SelectArrow` (an SVG)
 * or `SelectVirtualizer` (a scoped slot).
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
  autocompleteElements,
  checkboxElements,
  collapsibleElements,
  comboboxElements,
  dialogElements,
  editableElements,
  listboxElements,
  popoverElements,
  selectElements,
  switchElements,
  tabsElements,
  tagGroupElements,
  tagsInputElements,
  toggleElements,
  treeElements,
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
