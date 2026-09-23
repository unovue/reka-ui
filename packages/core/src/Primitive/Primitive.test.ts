import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, markRaw, nextTick, ref } from 'vue'
import { Primitive } from '.'

describe('test Primitive functionalities', () => {
  it('should render div element correctly', () => {
    const wrapper = mount(Primitive)
    expect(wrapper.find('div').exists()).toBe(true)
  })

  it('should render button element correctly', () => {
    const wrapper = mount(Primitive, {
      props: {
        as: 'button',
      },
    })
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('should by pass the comment tag', () => {
    const wrapper = mount(Primitive, {
      props: {
        as: 'template',
      },
      attrs: {
        'data-parent-attr': '',
      },
      slots: {
        default: `
        <!-- this is a comment -->
        <div data-child-attr>Child class</div>
        `,
      },
    })

    const element = wrapper.find('div')
    expect(element.attributes('data-parent-attr')).toBe('')
    expect(element.attributes('data-child-attr')).toBe('')
  })

  it('should renders div element with custom attribute', () => {
    const wrapper = mount(Primitive, {
      attrs: {
        type: 'button',
      },
    })

    const element = wrapper.find('div')

    expect(element.attributes('type')).toBe('button')
  })

  it('should renders multiple child elements', () => {
    const wrapper = mount(Primitive, {
      slots: {
        default: '<div>1</div><div>2</div><div>3</div>',
      },
    })

    const element = wrapper.find('div')
    expect(element.findAll('div').length).toBe(3)
  })

  // ref: https://vitest.dev/api/expect.html#tothrowerror
  describe('render as template (asChild)', () => {
    it('should not throw error when multiple child elements exists', () => {
      const wrapper = () => mount(Primitive, {
        props: {
          as: 'template',
        },
        slots: {
          default: '<div>1</div><div>2</div><div>3</div>',
        },
      })

      expect(wrapper().findAll('div').length).toBe(3)
      expect(() => wrapper()).not.toThrowError(/invalid children/)
    })

    it('should pass custom attribute to first element', () => {
      const wrapper = mount(Primitive, {
        props: {
          as: 'template',
          type: 'button',
        },
        slots: {
          default: '<div>1</div><div>2</div><div>3</div>',
        },
      })

      const element = wrapper.findAll('div')
      expect(element[0].attributes('type')).toBe('button')
      expect(element[1].attributes('type')).toBeUndefined()
      expect(element[2].attributes('type')).toBeUndefined()
    })

    it('should merge child\'s class together', () => {
      const wrapper = mount(Primitive, {
        props: {
          as: 'template',
        },
        attrs: {
          class: 'parent-class',
        },
        slots: {
          default:
            '<div class="child-class more-child-class">Child class</div>',
        },
      })

      const element = wrapper.find('div')
      expect(element.attributes('class')).toBe(
        'parent-class child-class more-child-class',
      )
    })

    it('should merge child\'s class after update', async () => {
      const Container = defineComponent({
        components: { Primitive },
        template: `
          <Primitive as="template" class="parent-class">
            <slot />
          </Primitive>
        `,
      })
      const TestComponent = defineComponent({
        components: { Container },
        setup() {
          const isActive = ref(true)
          const toggleActive = () => isActive.value = !isActive.value
          return { isActive, toggleActive }
        },
        template: `
          <section :data-active="isActive" @click="toggleActive">
            <Container>
              <div class="child-class more-child-class">
                <slot>Slot Fallback</slot>
              </div>
            </Container>
          </section>
        `,
      })

      const wrapper = mount(TestComponent)
      const element = wrapper.find('div')

      expect(element.attributes('class')).toBe('parent-class child-class more-child-class')

      await element.trigger('click')
      await nextTick()
      expect(element.attributes('class')).toBe('parent-class child-class more-child-class')

      await element.trigger('click')
      await nextTick()
      expect(element.attributes('class')).toBe('parent-class child-class more-child-class')
    })

    it('should render the Component that passed in as', () => {
      const Button = markRaw(defineComponent({
        setup(props, { slots }) {
          return () => h('button', { id: 'custom-button' }, slots)
        },
      }))

      const wrapper = mount(Primitive, {
        props: {
          as: Button,
        },
        attrs: {
          class: 'parent-class',
        },
      })

      expect(wrapper.html()).toBe(
        '<button id="custom-button" class="parent-class"></button>',
      )
    })

    it('should render the child class element tag', () => {
      const wrapper = mount(Primitive, {
        props: {
          as: 'template',
        },

        slots: {
          default: '<a>Child class</a>',
        },
      })

      const element = wrapper.find('a')
      expect(element.exists()).toBeTruthy()
    })

    it('should render the child component', () => {
      const ChildComponent = {
        template: '<div id="child">Hello world</div>',
      }
      const RootComponent = {
        components: { ChildComponent, Primitive },
        template: '<Primitive><ChildComponent /></Primitive>',
      }

      const wrapper = mount(RootComponent, {
        props: {
          as: 'template',
        },
      })

      const element = wrapper.find('div')
      expect(element.html()).toBe('<div id="child">Hello world</div>')
    })

    it('should inherit parent attributes and the child attributes', () => {
      const wrapper = mount(Primitive, {
        props: {
          as: 'template',
        },
        attrs: {
          'data-parent-attr': '',
        },
        slots: {
          default: '<div data-child-attr>Child class</div>',
        },
      })

      const element = wrapper.find('div')
      expect(element.attributes('data-parent-attr')).toBe('')
      expect(element.attributes('data-child-attr')).toBe('')
    })

    it('should replace parent attributes with child\'s attributes', () => {
      const wrapper = mount(Primitive, {
        props: {
          as: 'template',
        },
        attrs: {
          'id': 'parent',
          'data-type': 'button',
        },
        slots: {
          default: '<div id="child" data-type="primary">Child class</div>',
        },
      })

      const element = wrapper.find('div')
      expect(element.attributes('data-type')).toBe('primary')
      expect(element.attributes('id')).toBe('child')
    })

    it('\'asChild=true\' should work the same as \'as=template\'', () => {
      const wrapper = mount(Primitive, {
        props: {
          asChild: true,
        },
        attrs: {
          class: 'parent-class',
        },
        slots: {
          default: '<button class="child-class">Child element</button>',
        },
      })

      const element = wrapper.find('button')
      expect(element.exists()).toBe(true)
      expect(element.attributes('class')).toBe('parent-class child-class')
    })
  })
})
