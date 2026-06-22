export {
  default as DrawerClose,
  type DrawerCloseProps,
} from './DrawerClose.vue'
export {
  default as DrawerContent,
  type DrawerContentEmits,
  type DrawerContentProps,
} from './DrawerContent.vue'
// Base UI alias: Drawer.Popup === DrawerContent
export {
  default as DrawerPopup,
  type DrawerContentEmits as DrawerPopupEmits,
  type DrawerContentProps as DrawerPopupProps,
} from './DrawerContent.vue'
export {
  default as DrawerDescription,
  type DrawerDescriptionProps,
} from './DrawerDescription.vue'
export {
  default as DrawerHandle,
  type DrawerHandleProps,
} from './DrawerHandle.vue'
export {
  default as DrawerIndent,
  type DrawerIndentProps,
} from './DrawerIndent.vue'
export {
  default as DrawerIndentBackground,
  type DrawerIndentBackgroundProps,
} from './DrawerIndentBackground.vue'
export {
  default as DrawerOverlay,
  type DrawerOverlayProps,
} from './DrawerOverlay.vue'
// Base UI alias: Drawer.Backdrop === DrawerOverlay
export {
  default as DrawerBackdrop,
  type DrawerOverlayProps as DrawerBackdropProps,
} from './DrawerOverlay.vue'
export {
  default as DrawerPortal,
  type DrawerPortalProps,
} from './DrawerPortal.vue'
export {
  default as DrawerProvider,
} from './DrawerProvider.vue'
export {
  type DrawerModal,
  type DrawerOpenChangeDetails,
  type DrawerOpenChangeReason,
  default as DrawerRoot,
  type DrawerRootEmits,
  type DrawerRootProps,
  // Public advanced-composition contract: lets consumers read the Drawer root
  // context to build custom parts (mirrors `injectDialogRootContext`).
  injectDrawerRootContext,
} from './DrawerRoot.vue'
export {
  default as DrawerSwipeArea,
  type DrawerSwipeAreaProps,
} from './DrawerSwipeArea.vue'
export {
  default as DrawerTitle,
  type DrawerTitleProps,
} from './DrawerTitle.vue'
export {
  default as DrawerTrigger,
  type DrawerTriggerProps,
} from './DrawerTrigger.vue'
export {
  default as DrawerViewport,
  type DrawerViewportProps,
} from './DrawerViewport.vue'
