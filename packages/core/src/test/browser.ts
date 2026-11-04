import { userEvent } from 'vitest/browser'

/**
 * Hovers `el` with the real mouse and returns that pointer's `pointerId`, for
 * synthetic `PointerEvent`s that call `setPointerCapture`: it throws
 * `NotFoundError` for an id no active pointer has, and the mouse's id differs by
 * engine (1 in Chromium and WebKit, 0 in Firefox). Browser tests only.
 */
export async function hoverForMousePointerId(el: Element): Promise<number> {
  let pointerId: number | undefined
  const read = (event: PointerEvent) => {
    if (event.isTrusted && event.pointerType === 'mouse')
      pointerId ??= event.pointerId
  }
  el.addEventListener('pointerover', read)
  el.addEventListener('pointermove', read)
  try {
    await userEvent.hover(el)
  }
  finally {
    el.removeEventListener('pointerover', read)
    el.removeEventListener('pointermove', read)
  }
  if (pointerId === undefined)
    throw new Error('hoverForMousePointerId: the hover sent no mouse pointer event')
  return pointerId
}
