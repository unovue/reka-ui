import { beforeEach, describe, expect, it } from 'vitest'
import { useArrowNavigation } from './useArrowNavigation'

describe('useArrowNavigation', () => {
  let parentElement: HTMLElement
  let child1: HTMLElement
  let child2: HTMLElement
  let child3: HTMLElement

  beforeEach(() => {
    parentElement = document.createElement('div')
    child1 = document.createElement('div')
    child2 = document.createElement('div')
    child3 = document.createElement('div')

    child1.setAttribute('data-reka-collection-item', '')
    child2.setAttribute('data-reka-collection-item', '')
    child3.setAttribute('data-reka-collection-item', '')

    parentElement.appendChild(child1)
    parentElement.appendChild(child2)
    parentElement.appendChild(child3)
  })

  it('should navigate horizontally', () => {
    const e = new KeyboardEvent('keydown', { key: 'ArrowRight' })
    const nextElement = useArrowNavigation(e, child1, parentElement, {
      arrowKeyOptions: 'horizontal',
    })
    expect(nextElement).toStrictEqual(child2)
  })

  it('should navigate vertically', () => {
    const e = new KeyboardEvent('keydown', { key: 'ArrowDown' })
    const nextElement = useArrowNavigation(e, child1, parentElement, {
      arrowKeyOptions: 'vertical',
    })
    expect(nextElement).toStrictEqual(child2)
  })

  it('should not navigate with arrow keys when arrowKeyOptions is not set to both', () => {
    const nextElementHorizontal = useArrowNavigation(
      new KeyboardEvent('keydown', { key: 'ArrowDown' }),
      child1,
      parentElement,
      {
        arrowKeyOptions: 'horizontal',
      },
    )
    expect(nextElementHorizontal).toBeNull()
    const nextElementVertical = useArrowNavigation(
      new KeyboardEvent('keydown', { key: 'ArrowLeft' }),
      child1,
      parentElement,
      {
        arrowKeyOptions: 'vertical',
      },
    )
    expect(nextElementVertical).toBeNull()
  })

  it('should return null if there are no items in the collection', () => {
    const e = new KeyboardEvent('keydown', { key: 'ArrowRight' })
    const nextElement = useArrowNavigation(
      e,
      child1,
      document.createElement('div'),
    )
    expect(nextElement).toBeNull()
  })

  it('should loop through items if loop is set to true', () => {
    const e = new KeyboardEvent('keydown', { key: 'ArrowLeft' })
    const nextElement = useArrowNavigation(e, child3, parentElement, {
      loop: true,
    })
    expect(nextElement).toStrictEqual(child1)
  })

  it('should not loop through items if loop is set to false', () => {
    const e = new KeyboardEvent('keydown', { key: 'ArrowLeft' })
    const nextElement = useArrowNavigation(e, child1, parentElement, {
      loop: false,
    })
    expect(nextElement).toBeNull()
  })

  it('should skip disabled items', () => {
    child2.setAttribute('disabled', 'true')
    child3.setAttribute('disabled', 'true')
    const e = new KeyboardEvent('keydown', { key: 'ArrowRight' })
    const nextElement = useArrowNavigation(e, child1, parentElement)
    expect(nextElement).toBeNull()
  })

  it('should navigate correctly in rtl', () => {
    const e = new KeyboardEvent('keydown', { key: 'ArrowRight' })
    const nextElement = useArrowNavigation(e, child1, parentElement, {
      dir: 'rtl',
    })
    expect(nextElement).toStrictEqual(child3)
  })

  it('should navigate to the first item', () => {
    const e = new KeyboardEvent('keydown', { key: 'Home' })
    const nextElement = useArrowNavigation(e, child1, parentElement)
    expect(nextElement).toStrictEqual(child3)
  })

  it('should navigate to the last item', () => {
    const e = new KeyboardEvent('keydown', { key: 'End' })
    const nextElement = useArrowNavigation(e, child2, parentElement)
    expect(nextElement).toStrictEqual(child1)
  })
})
