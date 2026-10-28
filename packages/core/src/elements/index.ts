/**
 * `reka-ui/elements`: Reka UI parts as framework-agnostic custom elements.
 *
 * Importing this entry registers nothing. Call `defineRekaElements()` (or a
 * per-family `define*Elements()`) with the families you use.
 *
 * @experimental The element API (tags, attribute parsing, event names) may change
 * before v3 is stable. See the "Custom elements" guide.
 */
export { defineRekaElements } from './define'
export type { DefineRekaElementsOptions } from './define'
export { toEventType } from './events'
export type { ElementEventOptions, RekaElementEvent, RekaElementEventDetail } from './events'
export {
  accordionElements,
  checkboxElements,
  collapsibleElements,
  defineAccordionElements,
  defineAllRekaElements,
  defineCheckboxElements,
  defineCollapsibleElements,
  defineDialogElements,
  definePopoverElements,
  defineSwitchElements,
  defineTabsElements,
  defineToggleElements,
  dialogElements,
  popoverElements,
  rekaElementFamilies,
  switchElements,
  tabsElements,
  toggleElements,
} from './families'
export type { HostSemantics } from './host'
export type { AttributeKind, RekaElementFamily, RekaElementPartDefinition } from './meta'
export { RekaElement } from './RekaElement'
export type {
  RekaElementEventMap,
  RekaElementJSXProps,
  RekaElementProps,
  RekaElementTagNameMap,
  RekaEventType,
  RekaIntrinsicElements,
  RekaPartElement,
  UseKebabCaseEventProp,
} from './types'
