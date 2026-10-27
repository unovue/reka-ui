export {
  default as DrawerClose,
  type DrawerCloseProps,
} from './DrawerClose.vue'
// `DrawerPopup` is the canonical name (Base UI `Drawer.Popup`). `DrawerContent`
// is a deprecated alias of it; Base UI's own `Drawer.Content` is a different,
// inner part that reka does not ship, so the alias goes in v4.
export {
  default as DrawerContent,
  type DrawerContentEmits,
  type DrawerContentProps,
  default as DrawerPopup,
  type DrawerPopupEmits,
  type DrawerPopupProps,
} from './DrawerContent.vue'
export {
  default as DrawerDescription,
  type DrawerDescriptionProps,
} from './DrawerDescription.vue'
// The visual grab bar. Was `DrawerHandle`; that name is kept free for the
// detached-trigger handle (Base UI `Drawer.Handle` / `createHandle`).
export {
  default as DrawerGrabber,
  type DrawerGrabberProps,
} from './DrawerGrabber.vue'
export {
  default as DrawerIndent,
  type DrawerIndentProps,
} from './DrawerIndent.vue'
export {
  default as DrawerIndentBackground,
  type DrawerIndentBackgroundProps,
} from './DrawerIndentBackground.vue'
// `DrawerBackdrop` is the canonical name (Base UI `Drawer.Backdrop`);
// `DrawerOverlay` is a deprecated alias of it.
export {
  default as DrawerBackdrop,
  type DrawerBackdropProps,
  default as DrawerOverlay,
  type DrawerOverlayProps,
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
  type DrawerSnapPointChangeReason,
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
export {
  default as DrawerVirtualKeyboardProvider,
} from './DrawerVirtualKeyboardProvider.vue'
export {
  type DrawerContentState,
  type DrawerGrabberState,
  type DrawerOverlayState,
  type DrawerSwipeAreaState,
  type DrawerTriggerState,
  type DrawerViewportState,
  useDrawer,
  useDrawerContent,
  useDrawerContentModality,
  type UseDrawerContentModalityOptions,
  type UseDrawerContentModalityReturn,
  type UseDrawerContentOptions,
  type UseDrawerContentReturn,
  type UseDrawerProps,
  type UseDrawerReturn,
  useDrawerSwipeArea,
  type UseDrawerSwipeAreaOptions,
  type UseDrawerSwipeAreaReturn,
} from './useDrawer'
