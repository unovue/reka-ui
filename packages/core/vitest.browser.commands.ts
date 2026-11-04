// Adds `page`, `iframe` and `frame()` to the command context.
import type {} from '@vitest/browser-playwright'
import type { BrowserCommand } from 'vitest/node'

/**
 * A real (trusted) mouse wheel at a point of the test page's viewport, in every
 * engine. `userEvent.wheel` aims at an element's centre (scrolling it into view
 * first), and CDP's `Input.dispatchMouseEvent` exists in Chromium only.
 */
export const wheelAt: BrowserCommand<[x: number, y: number, deltaY: number]> = async (context, x, y, deltaY) => {
  if (context.provider.name !== 'playwright')
    throw new Error(`wheelAt needs the playwright provider, not ${context.provider.name}`)
  const { page, iframe } = context
  // The test page runs in an iframe of the orchestrator page.
  const box = await iframe.owner().boundingBox()
  if (!box)
    throw new Error('wheelAt: the test iframe has no box')
  await page.mouse.move(box.x + x, box.y + y)
  await page.mouse.wheel(0, deltaY)
}
