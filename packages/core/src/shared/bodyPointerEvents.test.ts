import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { acquireBodyPointerEvents, releaseBodyPointerEvents } from './bodyPointerEvents'

describe('bodyPointerEvents', () => {
  afterEach(() => {
    document.body.style.pointerEvents = ''
  })

  it('should restore the original value only when the last owner releases', () => {
    document.body.style.pointerEvents = 'auto'
    const first = {}
    const second = {}

    acquireBodyPointerEvents(document, first)
    expect(document.body.style.pointerEvents).toBe('none')
    acquireBodyPointerEvents(document, second)

    releaseBodyPointerEvents(document, first)
    expect(document.body.style.pointerEvents).toBe('none')

    releaseBodyPointerEvents(document, second)
    expect(document.body.style.pointerEvents).toBe('auto')
  })

  it('should count an owner that acquires twice once', () => {
    const owner = {}
    acquireBodyPointerEvents(document, owner)
    acquireBodyPointerEvents(document, owner)

    releaseBodyPointerEvents(document, owner)
    expect(document.body.style.pointerEvents).toBe('')
  })

  it('should ignore a release from an owner that never acquired', () => {
    const owner = {}
    releaseBodyPointerEvents(document, owner)
    expect(document.body.style.pointerEvents).toBe('')

    acquireBodyPointerEvents(document, owner)
    releaseBodyPointerEvents(document, {})
    expect(document.body.style.pointerEvents).toBe('none')

    releaseBodyPointerEvents(document, owner)
    expect(document.body.style.pointerEvents).toBe('')
  })

  it('should save the original again after a full release', () => {
    const owner = {}
    acquireBodyPointerEvents(document, owner)
    releaseBodyPointerEvents(document, owner)

    document.body.style.pointerEvents = 'auto'
    acquireBodyPointerEvents(document, owner)
    releaseBodyPointerEvents(document, owner)
    expect(document.body.style.pointerEvents).toBe('auto')
  })

  it('should track each document separately', () => {
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    onTestFinished(() => iframe.remove())
    const iframeDocument = iframe.contentDocument!
    const owner = {}

    acquireBodyPointerEvents(document, owner)
    acquireBodyPointerEvents(iframeDocument, owner)

    releaseBodyPointerEvents(iframeDocument, owner)
    expect(iframeDocument.body.style.pointerEvents).toBe('')
    expect(document.body.style.pointerEvents).toBe('none')

    releaseBodyPointerEvents(document, owner)
    expect(document.body.style.pointerEvents).toBe('')
  })
})
