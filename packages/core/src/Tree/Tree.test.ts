import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import { useKbd } from '@/shared'
import Tree from './story/_Tree.vue'

const kbd = useKbd()

describe('given default Tree', () => {
  // const kbd = useKbd()
  let wrapper: VueWrapper<InstanceType<typeof Tree>>
  let content: DOMWrapper<Element>
  let items: DOMWrapper<Element>[]

  const updateItems = () => {
    items = wrapper.findAll('[role=treeitem]')
  }

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Tree, { attachTo: document.body, props: { selectionBehavior: 'toggle' } })
    content = wrapper.find('[role=tree]')
    updateItems()
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should render snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('should select and deselect item', async () => {
    const item = items[0]
    await item.trigger('click')
    expect(item.attributes('aria-selected')).toBe('true')
    await item.trigger('click')
    expect(item.attributes('aria-selected')).toBe('false')
  })

  describe('when expand item by press ArrowRight', async () => {
    beforeEach(async () => {
      await items[1].trigger('keydown', { key: kbd.ARROW_RIGHT });
      (items[1].element as HTMLElement).focus()
      updateItems()
    })

    it('should pass axe accessibility tests', async () => {
      expect(await axe(wrapper.element)).toHaveNoViolations()
    })

    it('should expand the item, revealing it\'s item', () => {
      expect(items[2].text()).toBe('tree')
    })

    it('should close when press ArrowLeft', async () => {
      await items[1].trigger('keydown', { key: kbd.ARROW_LEFT })
      updateItems()
      expect(items[2].text()).toBe('routes')
      expect(items[2].text()).not.toBe('tree')
    })

    it('should focus on parent when press ArrowLeft on child item', async () => {
      await items[2].trigger('keydown', { key: kbd.ARROW_DOWN })
      await items[3].trigger('keydown', { key: kbd.ARROW_LEFT })
      expect(document.activeElement).toBe(items[1].element)
    })

    it('should focus on child item when press ArriwRight', async () => {
      await items[1].trigger('keydown', { key: kbd.ARROW_RIGHT })
      expect(document.activeElement).toBe(items[2].element)
    })

    describe('when expand nested item', async () => {
      beforeEach(async () => {
        await items[2].trigger('keydown', { key: kbd.ARROW_RIGHT })
        updateItems()
      })

      it('should pass axe accessibility tests', async () => {
        expect(await axe(wrapper.element)).toHaveNoViolations()
      })

      it('should expand the nested item, revealing it\'s item ', () => {
        expect(items[3].text()).toBe('Tree.vue')
      })
    })
  })

  // Test: useTypeAhead
  describe('when typing letter', async () => {
    it('should highlight text starting with l', async () => {
      await content.trigger('keydown', { key: 'l' })
      const item = items.find(i => i.text().startsWith('l'))
      expect(document.activeElement).toBe(item?.element)
    })
  })

  describe('when selection behavior `replace`', () => {
    beforeEach(async () => {
      await wrapper.setProps({ selectionBehavior: 'replace' })
      await nextTick()
    })

    it('should not toggle off the selected value', async () => {
      const item = items[0]
      await item.trigger('click')
      await item.trigger('click')
      expect(item.attributes('aria-selected')).toBe('true')
    })

    it('should select and replace another item', async () => {
      const item = items[0]
      const newItem = items[1]
      await item.trigger('click')
      expect(item.attributes('aria-selected')).toBe('true')
      await newItem.trigger('click')
      expect(item.attributes('aria-selected')).toBe('false')
      expect(newItem.attributes('aria-selected')).toBe('true')
    })
  })
})

describe('given multiple `true` Tree', () => {
  let wrapper: VueWrapper<InstanceType<typeof Tree>>
  // let content: DOMWrapper<Element>
  let items: DOMWrapper<Element>[]

  beforeEach(async () => {
    document.body.innerHTML = ''
    wrapper = mount(Tree, { props: { multiple: true, selectionBehavior: 'toggle' }, attachTo: document.body })
    await nextTick()
    // content = wrapper.find('[role=tree]')
    items = wrapper.findAll('[role=treeitem]')
  })

  it('should select multiple items', async () => {
    await items[0].trigger('keydown', { key: kbd.ENTER })
    await items[0].trigger('keydown', { key: kbd.ARROW_DOWN })
    await items[1].trigger('keydown', { key: kbd.ARROW_DOWN })
    await items[2].trigger('keydown', { key: kbd.ENTER })

    expect(items[0].attributes('aria-selected')).toBe('true')
    expect(items[1].attributes('aria-selected')).toBe('false')
    expect(items[2].attributes('aria-selected')).toBe('true')
  })

  describe('when selection behavior `replace`', () => {
    beforeEach(async () => {
      wrapper.setProps({ selectionBehavior: 'replace' })
      await nextTick()
      await items[0].trigger('click');
      (items[0].element as HTMLElement).focus()
    })

    it('should not toggle off the selected value', async () => {
      const item = items[0]
      await item.trigger('click')
      await item.trigger('click')
      expect(item.attributes('aria-selected')).toBe('true')
    })

    it('should select and replace another item', async () => {
      const item = items[0]
      const newItem = items[1]
      expect(item.attributes('aria-selected')).toBe('true')
      await newItem.trigger('click')
      expect(item.attributes('aria-selected')).toBe('false')
      expect(newItem.attributes('aria-selected')).toBe('true')
    })

    describe('when keypress Shift + ArrowDown', () => {
      it('should select the next item', async () => {
        await items[0].trigger('keydown.shift', { key: kbd.ARROW_DOWN })
        expect(items[0].attributes('aria-selected')).toBe('true')
        expect(items[1].attributes('aria-selected')).toBe('true')
        expect(items[2].attributes('aria-selected')).toBe('false')

        await items[1].trigger('keydown.shift', { key: kbd.ARROW_DOWN })
        expect(items[0].attributes('aria-selected')).toBe('true')
        expect(items[1].attributes('aria-selected')).toBe('true')
        expect(items[2].attributes('aria-selected')).toBe('true')
      })
    })
  })
})

describe('given a Tree with a custom children structure', () => {
  const customItems = [
    { title: 'index.vue', icon: 'vue' },
    {
      title: 'lib',
      icon: 'folder',
      directories: [
        {
          title: 'tree',
          icon: 'folder',
          files: [
            {
              title: 'Tree.vue',
              icon: 'vue',
            },
            {
              title: 'TreeView.vue',
              icon: 'vue',
            },
          ],
        },
        {
          title: 'icons',
          icon: 'folder',
          files: [
            { title: 'JS.vue', icon: 'vue' },
            { title: 'vue.vue', icon: 'vue' },
          ],
        },
      ],
      files: [
        {
          title: 'index.js',
          icon: 'js',
        },
      ],
    },
    {
      title: 'routes',
      icon: 'folder',
      directories: [
        {
          title: 'contents',
          icon: 'folder',
          files: [
            {
              title: '+layout.vue',
              icon: 'vue',
            },
            {
              title: '+page.vue',
              icon: 'vue',
            },
          ],
        },
      ],
    },
  ]

  let wrapper: VueWrapper<InstanceType<typeof Tree>>
  // let content: DOMWrapper<Element>
  let items: DOMWrapper<Element>[]

  beforeEach(async () => {
    document.body.innerHTML = ''
    wrapper = mount(Tree, { props: { items: customItems, multiple: true, selectionBehavior: 'toggle', getChildren: val => (!val.files) ? val.directories : (!val.directories) ? val.files : [...val.directories, ...val.files] }, attachTo: document.body })
    await nextTick()
    // content = wrapper.find('[role=tree]')
    items = wrapper.findAll('[role=treeitem]')
  })

  const updateItems = () => {
    items = wrapper.findAll('[role=treeitem]')
  }

  describe('when expand item', async () => {
    beforeEach(async () => {
      await items[1].trigger('keydown', { key: kbd.ARROW_RIGHT });
      (items[1].element as HTMLElement).focus()
      updateItems()
    })

    it('should expand the item, revealing it\'s item', () => {
      expect(items[2].text()).toBe('tree')
    })

    describe('when expand nested item', async () => {
      beforeEach(async () => {
        await items[2].trigger('keydown', { key: kbd.ARROW_RIGHT })
        updateItems()
      })

      it('should expand the nested item, revealing it\'s item ', () => {
        expect(items[3].text()).toBe('Tree.vue')
      })
    })
  })
})

describe('given a Tree with bubbleSelect and propagateSelect', () => {
  const customItems = [
    {
      title: 'components',
      children: [
        {
          title: 'Home',
          children: [
            { title: 'Card.vue' },
            { title: 'Button.vue' },
          ],
        },
      ],
    },
  ]

  let wrapper: VueWrapper<InstanceType<typeof Tree>>
  let items: DOMWrapper<Element>[]

  beforeEach(async () => {
    document.body.innerHTML = ''
    wrapper = mount(Tree, { props: { items: customItems, expanded: ['components', 'Home'], multiple: true, propagateSelect: true, bubbleSelect: true } })
    await nextTick()
    items = wrapper.findAll('[role=treeitem]')
  })

  it('propagates changes down the tree', async () => {
    expect(items.map(i => i.attributes('aria-selected'))).toStrictEqual(['false', 'false', 'false', 'false'])
    await items[0].trigger('click')
    expect(items.map(i => i.attributes('aria-selected'))).toStrictEqual(['true', 'true', 'true', 'true'])
    await items[0].trigger('click')
    expect(items.map(i => i.attributes('aria-selected'))).toStrictEqual(['false', 'false', 'false', 'false'])
  })

  it('bubbles change up the tree', async () => {
    expect(items.map(i => i.attributes('aria-selected'))).toStrictEqual(['false', 'false', 'false', 'false'])
    await items[2].trigger('click')
    expect(items.map(i => i.attributes('aria-selected'))).toStrictEqual(['false', 'false', 'true', 'false'])
    await items[3].trigger('click')
    expect(items.map(i => i.attributes('aria-selected'))).toStrictEqual(['true', 'true', 'true', 'true'])
    await items[2].trigger('click')
    expect(items.map(i => i.attributes('aria-selected'))).toStrictEqual(['false', 'false', 'false', 'true'])
    await items[3].trigger('click')
    expect(items.map(i => i.attributes('aria-selected'))).toStrictEqual(['false', 'false', 'false', 'false'])
  })
})
