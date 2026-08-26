export {
  default as AccordionContent,
  type AccordionContentProps,
} from './AccordionContent.vue'
export {
  default as AccordionHeader,
  type AccordionHeaderProps,
} from './AccordionHeader.vue'
export {
  default as AccordionItem,
  type AccordionItemProps,
  injectAccordionItemContext,
} from './AccordionItem.vue'
export {
  default as AccordionRoot,
  type AccordionRootEmits,
  type AccordionRootProps,
  injectAccordionRootContext,
} from './AccordionRoot.vue'
export {
  default as AccordionTrigger,
  type AccordionTriggerProps,
} from './AccordionTrigger.vue'
export {
  type AccordionItemSurfaceContext,
  type AccordionItemSurfaceOptions,
  type AccordionItemSurfaceReturn,
  type AccordionPartState,
  getAccordionContentSurface,
  getAccordionHeaderSurface,
  getAccordionItemSurface,
  getAccordionTriggerSurface,
  useAccordion,
  type UseAccordionProps,
  type UseAccordionReturn,
} from './useAccordion'
