import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { renderToString } from '@vue/server-renderer'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import ToggleGroup from './story/_ToggleGroup.vue'
import ToggleGroupItem from './ToggleGroupItem.vue'
import ToggleGroupRoot from './ToggleGroupRoot.vue'

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
    expect(triggers[0].attributes('data-state')).toBe('unchecked')
    expect(triggers[1].attributes('data-state')).toBe('checked')
    expect(triggers[2].attributes('data-state')).toBe('unchecked')
  })

  describe('after toggling current active', () => {
    beforeEach(async () => {
      triggers[1].element.focus()
      triggers[1].element.click()
      await nextTick()
    })

    it('should deselect pre-existing value', () => {
      expect(triggers[0].attributes('data-state')).toBe('unchecked')
      expect(triggers[1].attributes('data-state')).toBe('unchecked')
      expect(triggers[2].attributes('data-state')).toBe('unchecked')
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
        expect(triggers[0].attributes('data-state')).toBe('unchecked')
        expect(triggers[1].attributes('data-state')).toBe('unchecked')
        expect(triggers[2].attributes('data-state')).toBe('checked')
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
        expect(triggers[0].attributes('data-state')).toBe('checked')
        expect(triggers[1].attributes('data-state')).toBe('unchecked')
        expect(triggers[2].attributes('data-state')).toBe('unchecked')
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
    expect(triggers[0].attributes('data-state')).toBe('unchecked')
    expect(triggers[1].attributes('data-state')).toBe('checked')
    expect(triggers[2].attributes('data-state')).toBe('checked')
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
        expect(triggers[0].attributes('data-state')).toBe('unchecked')
        expect(triggers[1].attributes('data-state')).toBe('checked')
        expect(triggers[2].attributes('data-state')).toBe('unchecked')
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
        expect(triggers[0].attributes('data-state')).toBe('checked')
        expect(triggers[1].attributes('data-state')).toBe('checked')
        expect(triggers[2].attributes('data-state')).toBe('checked')
      })
    })
  })
})

describe('given Toggle Group in a form', () => {
  const template = (attrs = '') => `<form><ToggleGroupRoot name="align" default-value="center" ${attrs}><ToggleGroupItem value="left" aria-label="Left" /><ToggleGroupItem value="center" aria-label="Center" /></ToggleGroupRoot></form>`

  it('submits its value', () => {
    const wrapper = mount({ components: { ToggleGroupRoot, ToggleGroupItem }, template: template() })
    expect([...new FormData(wrapper.find('form').element)]).toEqual([['align', 'center']])
    wrapper.unmount()
  })

  it('does not submit while disabled', () => {
    const wrapper = mount({ components: { ToggleGroupRoot, ToggleGroupItem }, template: template('disabled') })
    expect([...new FormData(wrapper.find('form').element)]).toEqual([])
    wrapper.unmount()
  })
})

describe('ssr: pre-mount tab stop', () => {
  const Fixture = defineComponent({
    setup() {
      return () => h(ToggleGroupRoot, { type: 'multiple', defaultValue: ['b', 'c'] }, () => [
        h(ToggleGroupItem, { value: 'a' }, () => 'A'),
        h(ToggleGroupItem, { value: 'b' }, () => 'B'),
        h(ToggleGroupItem, { value: 'c' }, () => 'C'),
      ])
    },
  })

  // TODO(v3-port): #3362 pre-mount RovingFocus tab stop (RovingFocus resolved to v3)
  it.skip('makes only the first pressed item the tab stop when several are pressed', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Fixture))
    document.body.innerHTML = ''
    document.body.append(container)

    const tabindexes = () => Array.from(container.querySelectorAll('button'), button => button.getAttribute('tabindex'))
    expect(tabindexes()).toEqual(['-1', '0', '-1'])

    createSSRApp(Fixture).mount(container)
    await nextTick()

    expect(tabindexes()).toEqual(['-1', '-1', '-1'])
    expect(warn.mock.calls.flat().join('\n')).not.toContain('Hydration attribute mismatch')
    expect(error.mock.calls.flat().join('\n')).not.toContain('Hydration completed but contains mismatches')
    warn.mockRestore()
    error.mockRestore()
  })
})
