export function resolveElement(
  target: string | HTMLElement | null | undefined,
): HTMLElement | null | undefined {
  if (target === undefined) {
    return undefined
  }

  if (!target) {
    return null
  }

  if (typeof target === 'string') {
    return document.querySelector<HTMLElement>(target)
  }

  return target
}
