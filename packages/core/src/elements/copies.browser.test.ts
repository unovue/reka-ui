// Two copies of `reka-ui/elements` on one page: this source and the built dist.
// CI downloads the build job's dist; locally it is skipped without a build
// (`pnpm --filter reka-ui build`).
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineRekaElements, rekaElementFamilies } from '.'
import { cleanup, query, render, settle } from './elements.test.helpers'

type Elements = typeof import('.')
const dist = import.meta.glob<Elements>('../../dist/elements.js')
const loadCopy = Object.values(dist)[0]

describe.skipIf(!loadCopy)('two copies of the library', () => {
  const SW = 'style="display:inline-block;width:40px;height:20px"'

  beforeAll(async () => {
    defineRekaElements(rekaElementFamilies)
    const copy = await loadCopy!()
    copy.defineRekaElements([copy.switchElements, copy.dialogElements], { prefix: 'cpb' })
  })
  afterEach(cleanup)

  it('a part of one copy inside a part of the other follows it', async () => {
    render(`
      <reka-collapsible-root default-open>
        <reka-collapsible-trigger>T</reka-collapsible-trigger>
        <reka-collapsible-content><cpb-switch-root aria-label="x" ${SW}></cpb-switch-root></reka-collapsible-content>
      </reka-collapsible-root>`)
    const el = query('cpb-switch-root')
    await vi.waitFor(() => expect(el.getAttribute('role')).toBe('switch'))
    await userEvent.click(query('reka-collapsible-trigger'))
    await vi.waitFor(() => expect(query('reka-collapsible-content').hasAttribute('data-reka-unmounted')).toBe(true))
    await settle()
    expect(el.hasAttribute('role')).toBe(false)
  })

  it('keeps ids unique across copies', async () => {
    render(`<reka-toggle aria-label="a">A</reka-toggle>
      <cpb-dialog-root default-open><cpb-dialog-portal><cpb-dialog-content><cpb-dialog-title>t</cpb-dialog-title></cpb-dialog-content></cpb-dialog-portal></cpb-dialog-root>
      <reka-dialog-root default-open><reka-dialog-portal><reka-dialog-content><reka-dialog-title>t</reka-dialog-title></reka-dialog-content></reka-dialog-portal></reka-dialog-root>`)
    await vi.waitFor(() => expect(document.querySelectorAll('[role=dialog]').length).toBe(2))
    const ids = Array.from(document.querySelectorAll('[id]'), el => el.id).filter(id => id.includes('rekael'))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('a part needing the other copy\'s context stays unrendered and warns, without throwing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(`<reka-dialog-root><cpb-dialog-trigger>Open</cpb-dialog-trigger></reka-dialog-root>`)
    await settle()
    await settle()
    expect(query('cpb-dialog-trigger').hasAttribute('data-reka-unmounted')).toBe(true)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('same copy'))
    expect(error).not.toHaveBeenCalled()
    warn.mockRestore()
    error.mockRestore()
  })
})
