import { DialogHandle } from '@/Dialog/handle'

/**
 * Controls an AlertDialog imperatively and connects detached
 * `AlertDialogTrigger`s to an `AlertDialogRoot` (#2826). The same handle as
 * `DialogHandle`: `open(triggerId?)`, `openWithPayload(payload)`, `close()`
 * and `isOpen`.
 */
export type AlertDialogHandle<Payload = unknown> = DialogHandle<Payload>

/**
 * Creates a handle that connects an `AlertDialogRoot` with detached
 * `AlertDialogTrigger`s. `Payload` types the Triggers' `payload` prop and the
 * `payload` the Root's default slot receives.
 */
export function createAlertDialogHandle<Payload = unknown>(): AlertDialogHandle<Payload> {
  return new DialogHandle<Payload>()
}
