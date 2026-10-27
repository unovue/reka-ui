import type { Components } from 'reka-ui/constant'

const UPPERCASE = /[A-Z]/g

/**
 * The module a component of `group` is imported from: its family entry point
 * (`alertDialog` → `reka-ui/alert-dialog`), or the package root when `subpaths` is off.
 *
 * Every group in `reka-ui/constant` is named after its component family, and every
 * family has an entry point; `packages/core/src/subpaths.test.ts` checks both.
 */
export function getComponentSource(group: keyof Components, subpaths: boolean): string {
  if (!subpaths)
    return 'reka-ui'
  return `reka-ui/${group.replace(UPPERCASE, char => `-${char.toLowerCase()}`)}`
}
