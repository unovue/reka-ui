// Vapor `portalGate`. Swapped in for `src/Teleport/portalGate.ts` by `vapor/plugins.mjs`.
//
// The VDOM gate skips rendering a closed popup's portal by inspecting the slot's VNodes (only gated
// content parts, no `forceMount`). A Vapor slot renders DOM when it is called, so there is nothing to
// inspect without rendering it: the Vapor portal always renders, as before the gate existed. The
// content parts still render nothing while closed, and an open still starts from `present: false`,
// so the first open animates like every later one.
import type { Slot } from 'vue'

export function isPortalOpening(_context: object | null | undefined): boolean {
  return false
}

export function hasOnlyGatedContent(_children: unknown, _parts: readonly object[]): boolean {
  return false
}

export function createPortalGate(
  _context: object | null | undefined,
  _present: () => boolean,
  _parts: readonly object[],
): (forceMount: boolean | undefined, slot: Slot | undefined) => boolean {
  return () => true
}
