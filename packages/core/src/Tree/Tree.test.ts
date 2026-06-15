import type { FileTree } from '@pierre/trees'
import type { VueWrapper } from '@vue/test-utils'
import { prepareFileTreeInput } from '@pierre/trees'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { TreeRoot } from '.'

const paths = [
  'README.md',
  'src/index.ts',
  'src/components/Button.vue',
]

function getTree(wrapper: VueWrapper): FileTree {
  const exposed = wrapper.vm as any
  return exposed.fileTree instanceof Object && 'value' in exposed.fileTree
    ? exposed.fileTree.value
    : exposed.fileTree
}

async function mountTree(props: Record<string, any> = {}) {
  const wrapper = mount(TreeRoot, {
    props: {
      paths,
      ...props,
    },
    attachTo: document.body,
  })

  await flushPromises()
  return wrapper
}

describe('given a Pierre-backed Tree', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('should pass axe accessibility tests', async () => {
    const wrapper = await mountTree()

    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should render a Pierre file tree', async () => {
    const wrapper = await mountTree()

    expect(wrapper.find('file-tree-container').exists()).toBe(true)
    expect(wrapper.find('file-tree-container').attributes('data-file-tree-virtualized')).toBe('true')
  })

  it('should emit selected path updates', async () => {
    const wrapper = await mountTree()

    getTree(wrapper).getItem('README.md')?.select()
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')).toEqual([[['README.md']]])
  })

  it('should sync controlled selected paths into Pierre', async () => {
    const wrapper = await mountTree({
      modelValue: ['README.md'],
    })

    expect(getTree(wrapper).getSelectedPaths()).toEqual(['README.md'])

    await wrapper.setProps({ modelValue: ['src/index.ts'] })
    await flushPromises()

    expect(getTree(wrapper).getSelectedPaths()).toEqual(['src/index.ts'])
  })

  it('should convert item trees to canonical paths', async () => {
    const wrapper = await mountTree({
      paths: undefined,
      items: [
        {
          title: 'src',
          children: [
            { title: 'index.ts' },
          ],
        },
      ],
      getKey: (item: any) => item.title,
    })

    expect(getTree(wrapper).getItem('src/index.ts')).not.toBeNull()
  })

  it('should render prepared input without requiring paths', async () => {
    const wrapper = await mountTree({
      paths: undefined,
      preparedInput: prepareFileTreeInput(['src/index.ts']),
    })

    expect(getTree(wrapper).getItem('src/index.ts')).not.toBeNull()
  })

  it('should reset the Pierre tree when paths change', async () => {
    const wrapper = await mountTree()

    await wrapper.setProps({ paths: ['package.json'] })
    await flushPromises()

    expect(getTree(wrapper).getItem('README.md')).toBeNull()
    expect(getTree(wrapper).getItem('package.json')).not.toBeNull()
  })
})
