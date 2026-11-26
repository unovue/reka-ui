import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import Fixture from './fixtures/MenuTriggerPrevent.vue'
import { byId, exposed, mount } from './utils'

interface State { open: boolean, menubar: string }

describe('menu triggers with a consumer listener that prevents default (Vapor)', () => {
  it('dropdown menu: does not open on click or Enter', async () => {
    await mount(Fixture)
    await userEvent.click(byId('prevented-trigger'))
    expect(exposed<State>().open).toBe(false)
    byId('prevented-trigger').focus()
    await userEvent.keyboard('{Enter}')
    expect(exposed<State>().open).toBe(false)
  })

  it('menubar: does not open on pointerdown or Enter', async () => {
    await mount(Fixture)
    await userEvent.click(byId('prevented-menubar-trigger'))
    expect(exposed<State>().menubar).toBe('')
    byId('prevented-menubar-trigger').focus()
    await userEvent.keyboard('{Enter}')
    expect(exposed<State>().menubar).toBe('')
  })
})
