export function isTouchOrPen(event: PointerEvent) {
  return event.pointerType !== 'mouse'
}

/**
 * Touch and pen presses that a trigger has already started a long press for. The press bubbles
 * through the triggers around it, which must not start their own.
 */
export const claimedLongPressEvents = new WeakSet<Event>()
