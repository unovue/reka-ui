import type { SetResizeHandlerState } from './registry'
import { afterEach, describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { registerResizeHandle } from './registry'

function createHandle(left: number) {
  const element = document.createElement('div')
  element.getBoundingClientRect = () => ({ left, right: left + 10, top: 0, bottom: 10, width: 10, height: 10, x: left, y: 0, toJSON: () => ({}) })
  document.body.appendChild(element)
  return element
}

const registered = new Set<() => void>()

function register(element: HTMLElement, setResizeHandlerState: SetResizeHandlerState = () => {}) {
  const unregister = registerResizeHandle(
    `handle-${element.getBoundingClientRect().left}`,
    element,
    ref('horizontal'),
    { coarse: 0, fine: 0 },
    ref(undefined),
    setResizeHandlerState,
  )
  const cleanup = () => {
    if (registered.delete(cleanup))
      unregister()
  }
  registered.add(cleanup)
  return cleanup
}

describe('given a resize handle that unmounts while it is being dragged', () => {
  // Runs even when an assertion fails, so a leftover handle or pointer session can't leak into later tests
  afterEach(() => {
    window.dispatchEvent(new MouseEvent('mouseup', { clientX: 5, clientY: 5 }))
    registered.forEach(cleanup => cleanup())
    document.body.innerHTML = ''
    document.head.querySelectorAll('style').forEach(style => style.remove())
  })

  it('should not keep driving the global cursor', () => {
    const dragged = createHandle(0)
    const other = createHandle(100)
    const unregisterDragged = register(dragged)
    register(other)

    document.body.dispatchEvent(new MouseEvent('mousedown', { clientX: 5, clientY: 5, bubbles: true }))
    unregisterDragged()
    document.body.dispatchEvent(new MouseEvent('mousemove', { clientX: 5, clientY: 5, bubbles: true }))

    expect(document.head.querySelectorAll('style')).toHaveLength(0)
  })

  it('should let the next handle start a drag on its first mousedown when it was the only one', () => {
    const unregisterDragged = register(createHandle(0))

    document.body.dispatchEvent(new MouseEvent('mousedown', { clientX: 5, clientY: 5, bubbles: true }))
    unregisterDragged()

    const states: string[] = []
    register(createHandle(0), (action, isActive) => {
      states.push(`${action}:${isActive}`)
    })

    document.body.dispatchEvent(new MouseEvent('mousedown', { clientX: 5, clientY: 5, bubbles: true }))

    expect(states).toContain('down:true')
  })
})
