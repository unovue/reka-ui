export function handleAndDispatchCustomEvent<
  E extends CustomEvent,
  OriginalEvent extends Event,
>(
  name: string,
  handler: ((event: E) => void) | undefined,
  detail: { originalEvent: OriginalEvent } & (E extends CustomEvent<infer D>
    ? D
    : never),
  // The event target to dispatch on. Defaults to the original event's target,
  // but callers should pass the synchronously-captured composed target
  // (`composedPath()[0]`): for shadow-origin events the original target is
  // nulled/retargeted after dispatch in real browsers, which would throw here.
  target: EventTarget | null = detail.originalEvent.target,
) {
  const event = new CustomEvent(name, {
    bubbles: false,
    cancelable: true,
    detail,
  })
  if (handler && target)
    target.addEventListener(name, handler as EventListener, { once: true })

  target?.dispatchEvent(event)
}
