import type { VueWrapper } from '@vue/test-utils'
import { findByRole, queryByRole } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import ContextMenu from './story/_ContextMenu.vue'
import ControlledContextMenu from './story/_ControlledContextMenu.vue'

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('given default ContextMenu', () => {
  let wrapper: VueWrapper<InstanceType<typeof ContextMenu>>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(ContextMenu, { attachTo: document.body })
  })

  it('should render trigger area', () => {
    expect(wrapper.html()).toContain('Right click here')
  })

  describe('when RightClick', () => {
    beforeEach(async () => {
      await wrapper.find('span').trigger('click.right')
    })

    it('should pass axe accessibility tests', async () => {
      expect(await axe(document.body)).toHaveNoViolations()
    })

    it('should render the menu', async () => {
      expect(await findByRole(document.body, 'menu')).toBeTruthy()
    })
  })
})

describe('given controlled ContextMenu', () => {
  let wrapper: VueWrapper<InstanceType<typeof ControlledContextMenu>>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(ControlledContextMenu, { attachTo: document.body })
  })

  describe('when open state is changed programmatically', () => {
    it('should render the menu', async () => {
      await wrapper.find('#open-button').trigger('click')

      expect(await findByRole(document.body, 'menu')).toBeTruthy()
    })

    it('should close the menu', async () => {
      await wrapper.find('#open-button').trigger('click')

      expect(await findByRole(document.body, 'menu')).toBeTruthy()

      await wrapper.find('#close-button').trigger('click')

      expect(queryByRole(document.body, 'menu')).toBeNull()
    })
  })
})
