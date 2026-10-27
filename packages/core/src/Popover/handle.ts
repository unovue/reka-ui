import { PopupHandle } from '@/shared/popupHandle'

/**
 * Controls a Popover imperatively and connects detached `PopoverTrigger`s
 * (rendered anywhere, outside the Root's subtree or a portal) to a
 * `PopoverRoot`. Create one with `createPopoverHandle()` and pass it to the
 * `handle` prop of the Root and of every Trigger (#2826).
 *
 * The handle holds no state of its own: the mounted Root does. Imperative
 * calls are ignored (with a dev warning) while no Root using it is mounted.
 */
export class PopoverHandle<Payload = unknown> extends PopupHandle<Payload> {
  declare protected readonly family: 'Popover'

  constructor() {
    super('Popover', true)
  }

  /**
   * Opens the popover anchored to the trigger with this `id`, with reason
   * `'imperative-action'` (cancellable through `beforeUpdate:open`). Throws
   * when no `PopoverTrigger` with that id uses this handle: a popover cannot
   * open without a trigger to anchor to.
   */
  open(triggerId: string): void {
    this.openByTrigger(triggerId)
  }
}

/**
 * Creates a handle that connects a `PopoverRoot` with detached
 * `PopoverTrigger`s. `Payload` types the Triggers' `payload` prop and the
 * `payload` the Root's default slot receives.
 */
export function createPopoverHandle<Payload = unknown>(): PopoverHandle<Payload> {
  return new PopoverHandle<Payload>()
}
