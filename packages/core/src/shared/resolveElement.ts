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
    try {
      return document.querySelector<HTMLElement>(target)
    }
    catch {
      // malformed selector - treat as unresolved
      return null
    }
  }

  return target
}
