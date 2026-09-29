import type { TagGroupSelectionMode } from '.'
import userEvent from '@testing-library/user-event'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, nextTick, ref } from 'vue'
import { FieldDescription, FieldLabel, FieldRoot } from '@/Field'
import { TagGroupItem, TagGroupItemDelete, TagGroupItemText, TagGroupRoot } from '.'

interface DemoOptions {
  selectionMode?: TagGroupSelectionMode
  defaultValue?: string | string[]
  disallowEmptySelection?: boolean
  removable?: boolean
  disabled?: boolean
  disabledTags?: string[]
  tags?: string[]
}

function mountTagGroup(options: DemoOptions = {}) {
  const Demo = defineComponent({
    components: { TagGroupRoot, TagGroupItem, TagGroupItemText, TagGroupItemDelete },
    setup() {
      const tags = ref(options.tags ?? ['Vue', 'Reka UI', 'Accessibility', 'Nuxt'])
      const selected = ref<string | string[] | undefined>(options.defaultValue)
      const removed = ref<string[][]>([])
      function onRemove(values: string[]) {
        removed.value.push(values)
        tags.value = tags.value.filter(tag => !values.includes(tag))
      }
      return { tags, selected, removed, onRemove, options }
    },
    template: `
      <TagGroupRoot
        v-model="selected"
        aria-label="Frameworks"
        :selection-mode="options.selectionMode"
        :disallow-empty-selection="options.disallowEmptySelection"
        :disabled="options.disabled"
        v-on="options.removable === false ? {} : { remove: onRemove }"
      >
        <TagGroupItem
          v-for="tag in tags"
          :key="tag"
          :value="tag"
          :disabled="options.disabledTags?.includes(tag)"
        >
          <TagGroupItemText>{{ tag }}</TagGroupItemText>
          <TagGroupItemDelete>x</TagGroupItemDelete>
        </TagGroupItem>
        <span v-if="!tags.length">No tags</span>
      </TagGroupRoot>
    `,
  })

  const wrapper = mount(Demo, { attachTo: document.body })
  const root = () => wrapper.get('[aria-label="Frameworks"]')
  const rows = () => wrapper.findAll('[role="row"]')
  const row = (name: string) => rows().find(r => r.text().startsWith(name))!
  const deleteButton = (name: string) => row(name).get('button')
  return { wrapper, root, rows, row, deleteButton }
}

function rowNames(rows: ReturnType<typeof mountTagGroup>['rows']) {
  return rows().map(r => r.get('span').text())
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('tagGroup', () => {
  it('passes axe accessibility tests', async () => {
    const { wrapper } = mountTagGroup({ selectionMode: 'multiple', defaultValue: ['Vue'] })
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('renders a grid of rows with gridcells', () => {
    const { root, rows } = mountTagGroup()
    expect(root().attributes('role')).toBe('grid')
    expect(rows()).toHaveLength(4)
    expect(rows()[0].get('[role="gridcell"]').text()).toContain('Vue')
  })

  it('labels each delete button with its tag', () => {
    const { row, deleteButton } = mountTagGroup()
    const button = deleteButton('Vue')
    expect(button.attributes('aria-label')).toBe('Remove')
    expect(button.attributes('aria-labelledby')).toBe(`${button.attributes('id')} ${row('Vue').attributes('id')}`)
  })

  describe('keyboard navigation', () => {
    it('moves focus with arrow keys in both axes and wraps around', async () => {
      const user = userEvent.setup()
      const { rows } = mountTagGroup()

      await user.tab()
      expect(document.activeElement).toBe(rows()[0].element)
      await user.keyboard('{ArrowRight}')
      expect(document.activeElement).toBe(rows()[1].element)
      await user.keyboard('{ArrowDown}')
      expect(document.activeElement).toBe(rows()[2].element)
      await user.keyboard('{ArrowUp}')
      expect(document.activeElement).toBe(rows()[1].element)
      await user.keyboard('{End}')
      expect(document.activeElement).toBe(rows()[3].element)
      await user.keyboard('{ArrowRight}')
      expect(document.activeElement).toBe(rows()[0].element)
    })

    it('tabs from a tag to its delete button, then out of the group', async () => {
      const user = userEvent.setup()
      const { rows, deleteButton, wrapper } = mountTagGroup()
      const after = document.createElement('button')
      wrapper.element.after(after)

      await user.tab()
      await user.keyboard('{ArrowRight}')
      expect(document.activeElement).toBe(rows()[1].element)
      await user.tab()
      expect(document.activeElement).toBe(deleteButton('Reka UI').element)
      await user.tab()
      expect(document.activeElement).toBe(after)
    })

    it('focuses the matching tag on typeahead', async () => {
      const user = userEvent.setup()
      const { row } = mountTagGroup()

      await user.tab()
      await user.keyboard('n')
      expect(document.activeElement).toBe(row('Nuxt').element)
    })

    it('skips disabled tags', async () => {
      const user = userEvent.setup()
      const { row } = mountTagGroup({ disabledTags: ['Reka UI'] })

      await user.tab()
      await user.keyboard('{ArrowRight}')
      expect(document.activeElement).toBe(row('Accessibility').element)
    })
  })

  describe('removal', () => {
    it('emits `remove` once when pressing Backspace on a tag', async () => {
      const user = userEvent.setup()
      const { wrapper, rows } = mountTagGroup()

      await user.tab()
      await user.keyboard('{ArrowRight}{Backspace}')
      expect(wrapper.vm.removed).toEqual([['Reka UI']])
      expect(rowNames(rows)).toEqual(['Vue', 'Accessibility', 'Nuxt'])
    })

    it('emits `remove` when pressing Delete on a tag', async () => {
      const user = userEvent.setup()
      const { wrapper } = mountTagGroup()

      await user.tab()
      await user.keyboard('{Delete}')
      expect(wrapper.vm.removed).toEqual([['Vue']])
    })

    it('removes only its tag from the delete button', async () => {
      const user = userEvent.setup()
      const { wrapper, deleteButton } = mountTagGroup({ selectionMode: 'multiple', defaultValue: ['Vue', 'Nuxt'] })

      await user.click(deleteButton('Vue').element)
      expect(wrapper.vm.removed).toEqual([['Vue']])
      expect(wrapper.vm.selected).toEqual(['Nuxt'])
    })

    it('removes all selected tags when removing a selected tag with the keyboard', async () => {
      const user = userEvent.setup()
      const { wrapper, rows } = mountTagGroup({ selectionMode: 'multiple', defaultValue: ['Vue', 'Nuxt'] })

      await user.tab()
      await user.keyboard('{Backspace}')
      expect(wrapper.vm.removed).toEqual([['Vue', 'Nuxt']])
      expect(wrapper.vm.selected).toEqual([])
      expect(rowNames(rows)).toEqual(['Reka UI', 'Accessibility'])
    })

    it('keeps disabled tags when removing the selection with the keyboard', async () => {
      const user = userEvent.setup()
      const { wrapper, rows } = mountTagGroup({ selectionMode: 'multiple', defaultValue: ['Vue', 'Reka UI', 'Nuxt'], disabledTags: ['Reka UI'] })

      await user.tab()
      await user.keyboard('{Backspace}')
      expect(wrapper.vm.removed).toEqual([['Vue', 'Nuxt']])
      expect(wrapper.vm.selected).toEqual(['Reka UI'])
      expect(rowNames(rows)).toEqual(['Reka UI', 'Accessibility'])
    })

    it('moves focus to the next tag after removing the focused tag', async () => {
      const user = userEvent.setup()
      const { row } = mountTagGroup()

      await user.tab()
      await user.keyboard('{ArrowRight}{Delete}')
      await nextTick()
      expect(document.activeElement).toBe(row('Accessibility').element)
    })

    it('moves focus to the previous tag after removing the last tag', async () => {
      const user = userEvent.setup()
      const { row } = mountTagGroup()

      await user.tab()
      await user.keyboard('{End}{Delete}')
      await nextTick()
      expect(document.activeElement).toBe(row('Accessibility').element)
    })

    it('moves focus to the next tag after removing with the delete button', async () => {
      const user = userEvent.setup()
      const { row, deleteButton } = mountTagGroup()

      await user.click(deleteButton('Reka UI').element)
      await nextTick()
      expect(document.activeElement).toBe(row('Accessibility').element)
    })

    it('focuses the group once the last tag is removed', async () => {
      const user = userEvent.setup()
      const { root } = mountTagGroup({ tags: ['Vue'] })

      await user.tab()
      await user.keyboard('{Delete}')
      await nextTick()
      expect(document.activeElement).toBe(root().element)
      expect(root().attributes('role')).toBe('group')
      expect(root().attributes('data-empty')).toBe('')
      expect(root().attributes('tabindex')).toBe('0')
    })

    it('does not remove tags without a `remove` listener', async () => {
      const user = userEvent.setup()
      const { rows, deleteButton } = mountTagGroup({ removable: false })

      await user.tab()
      await user.keyboard('{Delete}')
      await user.click(deleteButton('Nuxt').element)
      expect(rows()).toHaveLength(4)
    })

    it('does not remove disabled tags', async () => {
      const user = userEvent.setup()
      const { wrapper, deleteButton } = mountTagGroup({ disabledTags: ['Vue'] })

      expect(deleteButton('Vue').attributes('disabled')).toBeDefined()
      await user.click(deleteButton('Vue').element)
      expect(wrapper.vm.removed).toEqual([])
    })

    it('does not remove anything when the group is disabled', async () => {
      const user = userEvent.setup()
      const { wrapper, root, deleteButton } = mountTagGroup({ disabled: true })

      expect(root().attributes('data-disabled')).toBe('')
      await user.click(deleteButton('Vue').element)
      expect(wrapper.vm.removed).toEqual([])
    })
  })

  describe('selection', () => {
    it('is not selectable by default', async () => {
      const user = userEvent.setup()
      const { wrapper, row } = mountTagGroup()

      await user.click(row('Vue').element)
      expect(wrapper.vm.selected).toBeUndefined()
      expect(row('Vue').attributes('aria-selected')).toBeUndefined()
      expect(row('Vue').attributes('data-state')).toBeUndefined()
    })

    it('toggles a single tag on click, Space and Enter', async () => {
      const user = userEvent.setup()
      const { wrapper, root, row } = mountTagGroup({ selectionMode: 'single' })

      expect(root().attributes('aria-multiselectable')).toBeUndefined()
      await user.click(row('Vue').element)
      expect(wrapper.vm.selected).toBe('Vue')
      expect(row('Vue').attributes('aria-selected')).toBe('true')
      expect(row('Vue').attributes('data-state')).toBe('checked')

      await user.keyboard('{ArrowRight}{ }')
      expect(wrapper.vm.selected).toBe('Reka UI')
      await user.keyboard('{Enter}')
      expect(wrapper.vm.selected).toBeUndefined()
    })

    it('toggles multiple tags', async () => {
      const user = userEvent.setup()
      const { wrapper, root, row } = mountTagGroup({ selectionMode: 'multiple' })

      expect(root().attributes('aria-multiselectable')).toBe('true')
      await user.click(row('Vue').element)
      await user.click(row('Nuxt').element)
      expect(wrapper.vm.selected).toEqual(['Vue', 'Nuxt'])
      await user.click(row('Vue').element)
      expect(wrapper.vm.selected).toEqual(['Nuxt'])
    })

    it('does not select from the delete button', async () => {
      const user = userEvent.setup()
      const { wrapper, deleteButton } = mountTagGroup({ selectionMode: 'multiple', removable: false })

      await user.click(deleteButton('Vue').element)
      expect(wrapper.vm.selected).toBeUndefined()
    })

    it('clears the selection on Escape', async () => {
      const user = userEvent.setup()
      const { wrapper } = mountTagGroup({ selectionMode: 'multiple', defaultValue: ['Vue', 'Nuxt'] })

      await user.tab()
      await user.keyboard('{Escape}')
      expect(wrapper.vm.selected).toEqual([])
    })

    it('keeps the last selected tag with `disallowEmptySelection`', async () => {
      const user = userEvent.setup()
      const { wrapper, row } = mountTagGroup({ selectionMode: 'multiple', defaultValue: ['Vue'], disallowEmptySelection: true })

      await user.click(row('Vue').element)
      await user.keyboard('{Escape}')
      expect(wrapper.vm.selected).toEqual(['Vue'])
    })
  })

  it('is labelled and described by an ancestor Field', async () => {
    const wrapper = mount(defineComponent({
      components: { FieldRoot, FieldLabel, FieldDescription, TagGroupRoot, TagGroupItem },
      template: `
        <FieldRoot>
          <FieldLabel :native-label="false">Frameworks</FieldLabel>
          <TagGroupRoot>
            <TagGroupItem value="Vue">Vue</TagGroupItem>
          </TagGroupRoot>
          <FieldDescription>Your stack</FieldDescription>
        </FieldRoot>
      `,
    }), { attachTo: document.body })
    await nextTick()

    const grid = wrapper.get('[role="grid"]')
    expect(document.getElementById(grid.attributes('aria-labelledby')!)?.textContent).toBe('Frameworks')
    expect(document.getElementById(grid.attributes('aria-describedby')!)?.textContent).toBe('Your stack')
  })
})
