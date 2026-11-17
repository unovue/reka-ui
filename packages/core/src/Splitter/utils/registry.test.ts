import { afterEach, describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { registerResizeHandle } from './registry'

function createHandle(left: number) {
  const element = document.createElement('div')
  element.getBoundingClientRect = () => ({ left, right: left + 10, top: 0, bottom: 10, width: 10, height: 10, x: left, y: 0, toJSON: () => ({}) })
  document.body.appendChild(element)
  return element
}

function register(element: HTMLElement) {
  return registerResizeHandle(
    `handle-${element.getBoundingClientRect().left}`,
    element,
    ref('horizontal'),
    { coarse: 0, fine: 0 },
    ref(undefined),
    () => {},
  )
}

describe('given a resize handle that unmounts while it is being dragged', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    document.head.querySelectorAll('style').forEach(style => style.remove())
  })

  it('should not keep driving the global cursor', () => {
    const dragged = createHandle(0)
    const other = createHandle(100)
    const unregisterDragged = register(dragged)
    const unregisterOther = register(other)

    document.body.dispatchEvent(new MouseEvent('mousedown', { clientX: 5, clientY: 5, bubbles: true }))
    unregisterDragged()
    document.body.dispatchEvent(new MouseEvent('mousemove', { clientX: 5, clientY: 5, bubbles: true }))

    expect(document.head.querySelectorAll('style')).toHaveLength(0)

    window.dispatchEvent(new MouseEvent('mouseup', { clientX: 5, clientY: 5 }))
    unregisterOther()
  })
})
