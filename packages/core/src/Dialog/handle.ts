import { PopupHandle } from '@/shared/popupHandle'

/**
 * Controls a Dialog imperatively and connects detached `DialogTrigger`s
 * (rendered anywhere, outside the Root's subtree or a portal) to a
 * `DialogRoot` (or an `AlertDialogRoot`). Create one with
 * `createDialogHandle()` and pass it to the `handle` prop of the Root and of
 * every Trigger (#2826).
 *
 * The handle holds no state of its own: the mounted Root does. Imperative
 * calls are ignored (with a dev warning) while no Root using it is mounted.
 */
export class DialogHandle<Payload = unknown> extends PopupHandle<Payload> {
  declare protected readonly family: 'Dialog'

  constructor() {
    super('Dialog', false)
  }

  /**
   * Opens the dialog with reason `'imperative-action'` (cancellable through
   * `beforeUpdate:open`), associated with the trigger with this `id` (its
   * `payload`, focus return and `aria-expanded`). Without an id, or with an
   * id no trigger uses, the dialog opens without a trigger.
   */
  open(triggerId?: string | null): void {
    this.openByTrigger(triggerId)
  }

  /**
   * Opens the dialog without a trigger and with this `payload`, which the
   * Root's default slot receives.
   */
  openWithPayload(payload: Payload): void {
    this.openByTrigger(null, { value: payload })
  }
}

/**
 * Creates a handle that connects a `DialogRoot` with detached
 * `DialogTrigger`s. `Payload` types the Triggers' `payload` prop and the
 * `payload` the Root's default slot receives.
 */
export function createDialogHandle<Payload = unknown>(): DialogHandle<Payload> {
  return new DialogHandle<Payload>()
}
