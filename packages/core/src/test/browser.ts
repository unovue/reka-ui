import { server, userEvent } from 'vitest/browser'

/**
 * WebKit on macOS keeps Safari's defaults: Tab moves between text fields only,
 * skipping buttons and links, and a click doesn't focus a button. Playwright
 * can't change either. WebKit on Linux, which CI runs, does both like Chromium
 * and Firefox, so a test that needs them is skipped on macOS WebKit only.
 */
export const isMacWebKit = server.browser === 'webkit' && server.platform === 'darwin'

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
