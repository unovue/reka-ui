import type { Ref } from 'vue'
import type { DialogContentState, DialogOpenChangeReason, UseDialogProps, UseDialogReturn } from '@/Dialog'
import type { DialogRootContext } from '@/Dialog/DialogRoot.vue'
import type { PartSurface } from '@/shared'
import { nextTick, ref } from 'vue'
import { getDialogCloseSurface, getDialogContentSurface, useDialog } from '@/Dialog/useDialog'
import { createPartSurface } from '@/shared'

// =============================================================================
// Headless composable for the AlertDialog family — issue #2723.
//
// AlertDialog is a thin layer over Dialog: always modal, `role="alertdialog"`,
// outside presses never dismiss, and opening focuses the Cancel button. So the
// composable COMPOSES `useDialog()` (one open model, one context, one set of
// ids) and only adds the alert-specific surfaces; the parts keep rendering the
// Dialog parts, which inject the same `DialogRootContext`.
// =============================================================================

/**
 * Why the alert dialog's `open` state changed. The same union as Dialog: the
 * shell prevents outside presses, so in practice it reports `trigger-press`,
 * `close-press` (Action / Cancel) and `escape-key`.
 */
export type AlertDialogOpenChangeReason = DialogOpenChangeReason

/** Semantic state of the content part; `state` → `data-state="open|closed"`. */
export type AlertDialogContentState = DialogContentState

/** Standalone `useAlertDialog()` calls without a `baseId` draw `reka-alert-dialog-<n>` from here. */
let alertDialogCount = 0

/** The content surface: Dialog's content surface with `role="alertdialog"`. */
export function getAlertDialogContentSurface(
  context: Pick<DialogRootContext, 'open' | 'contentId' | 'titleId' | 'descriptionId'>,
): PartSurface<AlertDialogContentState> {
  const dialogContent = getDialogContentSurface(context)
  return createPartSurface<AlertDialogContentState>(
    () => ({ ...dialogContent.props.value, role: 'alertdialog' }),
    dialogContent.state,
  )
}

export interface UseAlertDialogProps extends Omit<UseDialogProps, 'modal'> {}

export interface UseAlertDialogReturn extends UseDialogReturn {
  /** `role="alertdialog"` content surface (replaces Dialog's `role="dialog"`). */
  content: PartSurface<AlertDialogContentState>
  /** The Action button: closes with `close-press`. */
  action: PartSurface<Record<string, never>>
  /** The Cancel button: closes with `close-press`; it receives focus on open. */
  cancel: PartSurface<Record<string, never>>
}

/**
 * Headless AlertDialog logic: `useDialog()` with `modal` forced to `true`, plus
 * the `role="alertdialog"` content and the Action / Cancel surfaces. The shells
 * provide `context` as the `DialogRootContext`, so every Dialog part works
 * inside an AlertDialog unchanged.
 *
 * Like `useDialog()`, a standalone consumer still needs `Presence`,
 * `FocusScope` and `DismissableLayer` (or equivalents) for mount/unmount,
 * focus trapping and Escape; `useAlertDialogContent()` supplies the
 * outside-press guard and the focus-Cancel-on-open handler.
 *
 * SSR-safe and callable outside `setup()`.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useAlertDialog(props: UseAlertDialogProps = {}): UseAlertDialogReturn {
  const dialog = useDialog({
    ...props,
    modal: true,
    baseId: props.baseId ?? `reka-alert-dialog-${++alertDialogCount}`,
  })
  return {
    ...dialog,
    content: getAlertDialogContentSurface(dialog.context),
    action: getDialogCloseSurface(dialog.context),
    cancel: getDialogCloseSurface(dialog.context),
  }
}

export interface AlertDialogContentContext {
  onCancelElementChange: (el: HTMLElement | undefined) => void
}

export interface UseAlertDialogContentReturn {
  /** The element `AlertDialogCancel` registered; focused when the content opens. */
  cancelElement: Ref<HTMLElement | undefined>
  /** The value `AlertDialogContent` provides to `AlertDialogCancel`. */
  contentContext: AlertDialogContentContext
  /** `openAutoFocus` handler: focuses the Cancel button on the next tick. */
  onOpenAutoFocus: () => void
  /** `pointerDownOutside` handler: an outside press never dismisses an alert dialog. */
  onPointerDownOutside: (event: Event) => void
  /** `interactOutside` handler: an outside interaction never dismisses an alert dialog. */
  onInteractOutside: (event: Event) => void
}

/**
 * The alert-specific content behaviour, layered on Dialog's content: outside
 * presses are prevented and the registered Cancel element receives focus on
 * open. Owns no lifecycle hooks.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useAlertDialogContent(): UseAlertDialogContentReturn {
  const cancelElement = ref<HTMLElement | undefined>()
  return {
    cancelElement,
    contentContext: {
      onCancelElementChange: (el) => {
        cancelElement.value = el
      },
    },
    onOpenAutoFocus: () => {
      nextTick(() => {
        cancelElement.value?.focus({ preventScroll: true })
      })
    },
    onPointerDownOutside: event => event.preventDefault(),
    onInteractOutside: event => event.preventDefault(),
  }
}
