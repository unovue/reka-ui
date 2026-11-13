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

/**
 * A real (trusted) left-button drag between two points of the test page's
 * viewport: pressed on the first point and released on the second, so
 * `mousedown` and `mouseup` land on different elements and no `click` fires.
 * `userEvent` only offers whole clicks. `steps` splits the move into that many
 * `mousemove`s, for gestures that start after a few pixels (a toast swipe) or
 * read their speed (a carousel drag). `holdMs` waits before releasing, for a
 * release without speed.
 */
export const mouseDrag: BrowserCommand<[fromX: number, fromY: number, toX: number, toY: number, steps?: number, holdMs?: number]> = async (context, fromX, fromY, toX, toY, steps = 1, holdMs = 0) => {
  if (context.provider.name !== 'playwright')
    throw new Error(`mouseDrag needs the playwright provider, not ${context.provider.name}`)
  const { page, iframe } = context
  const box = await iframe.owner().boundingBox()
  if (!box)
    throw new Error('mouseDrag: the test iframe has no box')
  await page.mouse.move(box.x + fromX, box.y + fromY)
  await page.mouse.down()
  await page.mouse.move(box.x + toX, box.y + toY, { steps })
  if (holdMs)
    await page.waitForTimeout(holdMs)
  await page.mouse.up()
}
