import { PopupHandle } from '@/shared/popupHandle'

/**
 * Controls a DropdownMenu imperatively and connects detached
 * `DropdownMenuTrigger`s (rendered anywhere, outside the Root's subtree or a
 * portal) to a `DropdownMenuRoot`. Create one with
 * `createDropdownMenuHandle()` and pass it to the `handle` prop of the Root and
 * of every Trigger (#2826). Base UI calls this `Menu.createHandle()`.
 *
 * The handle holds no state of its own: the mounted Root does. Imperative
 * calls are ignored (with a dev warning) while no Root using it is mounted.
 */
export class DropdownMenuHandle<Payload = unknown> extends PopupHandle<Payload> {
  declare protected readonly family: 'DropdownMenu'

  constructor() {
    super('DropdownMenu', true)
  }

  /**
   * Opens the menu anchored to the trigger with this `id`, with reason
   * `'imperative-action'` (cancellable through `beforeUpdate:open`). Throws
   * when no `DropdownMenuTrigger` with that id uses this handle: a menu cannot
   * open without a trigger to anchor to.
   */
  open(triggerId: string): void {
    this.openByTrigger(triggerId)
  }
}

/**
 * Creates a handle that connects a `DropdownMenuRoot` with detached
 * `DropdownMenuTrigger`s. `Payload` types the Triggers' `payload` prop and the
 * `payload` the Root's default slot receives.
 */
export function createDropdownMenuHandle<Payload = unknown>(): DropdownMenuHandle<Payload> {
  return new DropdownMenuHandle<Payload>()
}
