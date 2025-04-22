import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import ToggleGroup from './story/_ToggleGroup.vue'

describe('given default Toggle Group', () => {
  let wrapper: VueWrapper<InstanceType<typeof ToggleGroup>>
  let triggers: DOMWrapper<HTMLButtonElement>[]

  beforeEach(() => {
    wrapper = mount(ToggleGroup, {
      attachTo: document.body,
      props: {
        defaultValue: 'center',
      },
    })
    triggers = wrapper.findAll('button')
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should have active toggle=center', () => {
    expect(triggers[0].attributes('data-state')).toBe('off')
    expect(triggers[1].attributes('data-state')).toBe('on')
    expect(triggers[2].attributes('data-state')).toBe('off')
  })

  describe('after toggling current active', () => {
    beforeEach(async () => {
      triggers[1].element.focus()
      triggers[1].element.click()
      await nextTick()
    })

    it('should deselect pre-existing value', () => {
      expect(triggers[0].attributes('data-state')).toBe('off')
      expect(triggers[1].attributes('data-state')).toBe('off')
      expect(triggers[2].attributes('data-state')).toBe('off')
    })
  })

  describe('after triggering ArrowRight', () => {
    beforeEach(async () => {
      triggers[1].element.focus()
      await triggers[1].trigger('keydown', { key: 'ArrowRight' })
    })

    it('should received focus for the next toggle', () => {
      expect(triggers[2].element).toBe(document.activeElement)
    })

    describe('after toggling', () => {
      beforeEach(() => {
        triggers[2].element.click()
      })

      it('should have next active value', () => {
        expect(triggers[0].attributes('data-state')).toBe('off')
        expect(triggers[1].attributes('data-state')).toBe('off')
        expect(triggers[2].attributes('data-state')).toBe('on')
      })

      describe('after triggering ArrowRight again', () => {
        beforeEach(async () => {
          await triggers[2].trigger('keydown', { key: 'ArrowRight' })
        })

        it('should received focus for the first toggle', () => {
          expect(triggers[0].element).toBe(document.activeElement)
        })
      })
    })
  })

  describe('after triggering ArrowLeft', () => {
    beforeEach(async () => {
      triggers[1].element.focus()
      await triggers[1].trigger('keydown', { key: 'ArrowLeft' })
    })

    it('should received focus for the next toggle', () => {
      expect(triggers[0].element).toBe(document.activeElement)
    })

    describe('after toggling', () => {
      beforeEach(() => {
        triggers[0].element.click()
      })

      it('should have next active value', () => {
        expect(triggers[0].attributes('data-state')).toBe('on')
        expect(triggers[1].attributes('data-state')).toBe('off')
        expect(triggers[2].attributes('data-state')).toBe('off')
      })
    })
  })
})

describe('given multiple value Toggle Group', () => {
  let wrapper: VueWrapper<InstanceType<typeof ToggleGroup>>
  let triggers: DOMWrapper<HTMLButtonElement>[]

  beforeEach(() => {
    wrapper = mount(ToggleGroup, {
      attachTo: document.body,
      props: {
        'modelValue': ['center', 'right'],
        'onUpdate:modelValue': (ev) => {
          wrapper.setProps({ modelValue: ev })
        },
        'type': 'multiple',
      },
    })
    triggers = wrapper.findAll('button')
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should have active toggle=center', () => {
    expect(triggers[0].attributes('data-state')).toBe('off')
    expect(triggers[1].attributes('data-state')).toBe('on')
    expect(triggers[2].attributes('data-state')).toBe('on')
  })

  describe('after triggering ArrowRight', () => {
    beforeEach(async () => {
      triggers[1].element.focus()
      await triggers[1].trigger('keydown', { key: 'ArrowRight' })
    })

    it('should received focus for the next toggle', () => {
      expect(triggers[2].element).toBe(document.activeElement)
    })

    describe('after toggling', () => {
      beforeEach(() => {
        triggers[2].element.click()
      })

      it('should have next active value', () => {
        expect(triggers[0].attributes('data-state')).toBe('off')
        expect(triggers[1].attributes('data-state')).toBe('on')
        expect(triggers[2].attributes('data-state')).toBe('off')
      })

      describe('after triggering ArrowRight again', () => {
        beforeEach(async () => {
          await triggers[2].trigger('keydown', { key: 'ArrowRight' })
        })

        it('should received focus for the first toggle', () => {
          expect(triggers[0].element).toBe(document.activeElement)
        })
      })
    })
  })

  describe('after triggering ArrowLeft', () => {
    beforeEach(async () => {
      triggers[1].element.focus()
      await triggers[1].trigger('keydown', { key: 'ArrowLeft' })
    })

    it('should received focus for the next toggle', () => {
      expect(triggers[0].element).toBe(document.activeElement)
    })

    describe('after toggling', () => {
      beforeEach(() => {
        triggers[0].element.click()
      })

      it('should have next active value', () => {
        expect(triggers[0].attributes('data-state')).toBe('on')
        expect(triggers[1].attributes('data-state')).toBe('on')
        expect(triggers[2].attributes('data-state')).toBe('on')
      })
    })
  })
})
