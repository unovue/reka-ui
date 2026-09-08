import { isClient } from '@vueuse/core'

export type DOMTarget = HTMLElement | string | null

export function resolveDOMTarget(target: undefined): undefined
export function resolveDOMTarget(target: DOMTarget): HTMLElement | null
export function resolveDOMTarget(target: DOMTarget | undefined): HTMLElement | null | undefined

export function resolveDOMTarget(target: DOMTarget | undefined): HTMLElement | null | undefined {
  if (target === undefined)
    return undefined
  if (target === null)
    return null
  if (!isClient)
    return null
  if (typeof target === 'string') {
    try {
      return document.querySelector<HTMLElement>(target)
    }
    catch {
      // for invalid selector
      return null
    }
  }
  return target
}
