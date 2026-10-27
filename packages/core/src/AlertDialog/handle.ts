import { DialogHandle } from '@/Dialog/handle'

/**
 * Controls an AlertDialog imperatively and connects detached
 * `AlertDialogTrigger`s to an `AlertDialogRoot` (#2826). The same API as
 * `DialogHandle` (`open(triggerId?)`, `openWithPayload(payload)`, `close()`,
 * `isOpen`), branded separately as in Base UI, so a plain `DialogHandle`
 * cannot be passed to an AlertDialog part by mistake.
 */
export class AlertDialogHandle<Payload = unknown> extends DialogHandle<Payload> {
  declare private readonly __alertDialogBrand: never

  constructor() {
    super('AlertDialog')
  }
}

/**
 * Creates a handle that connects an `AlertDialogRoot` with detached
 * `AlertDialogTrigger`s. `Payload` types the Triggers' `payload` prop and the
 * `payload` the Root's default slot receives.
 */
export function createAlertDialogHandle<Payload = unknown>(): AlertDialogHandle<Payload> {
  return new AlertDialogHandle<Payload>()
}
