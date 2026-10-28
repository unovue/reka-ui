const containers = new Set<HTMLElement>()

/** Renders plain HTML into a fresh container in `document.body`: no Vue app involved. */
export function render(html: string): HTMLElement {
  const container = document.createElement('div')
  container.innerHTML = html
  document.body.append(container)
  containers.add(container)
  return container
}

/** Lets disconnect callbacks and Vue's scheduler run. */
export function settle() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * Removes every rendered container. Elements tear down when removed, which also
 * takes their teleported parts out of `document.body`.
 */
export async function cleanup() {
  for (const container of containers)
    container.remove()
  containers.clear()
  await settle()
}

export function query<E extends Element = HTMLElement>(selector: string): E {
  const element = document.querySelector<E>(selector)
  if (!element)
    throw new Error(`No element matches ${selector}`)
  return element
}
