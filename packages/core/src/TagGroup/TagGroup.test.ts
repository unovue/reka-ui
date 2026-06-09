import type { VueWrapper } from '@vue/test-utils'
import userEvent from '@testing-library/user-event'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, ref } from 'vue'
import { TagGroupItem, TagGroupItemDelete, TagGroupItemText, TagGroupRoot } from '..'

const TagGroupDemo = defineComponent({
  components: { TagGroupRoot, TagGroupItem, TagGroupItemText, TagGroupItemDelete },
  setup() {
    const tags = ref(['Vue', 'Reka UI', 'Accessibility'])
    return { tags }
  },
  template: `
    <TagGroupRoot v-model="tags" aria-label="Selected frameworks">
      <TagGroupItem v-for="tag in tags" :key="tag" :value="tag">
        <TagGroupItemText>{{ tag }}</TagGroupItemText>
        <TagGroupItemDelete :aria-label="'Remove ' + tag" />
      </TagGroupItem>
    </TagGroupRoot>
  `,
})

describe('given default TagGroup', () => {
  let wrapper: VueWrapper<InstanceType<typeof TagGroupDemo>>

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(TagGroupDemo, { attachTo: document.body })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should render tags as a list', () => {
    expect(wrapper.get('[role="list"]').attributes('aria-label')).toBe('Selected frameworks')
    expect(wrapper.findAll('[role="listitem"]').map(item => item.text())).toEqual([
      'Vue',
      'Reka UI',
      'Accessibility',
    ])
  })

  it('should remove a tag from model value when delete button is clicked', async () => {
    await wrapper.findAll('button[aria-label^="Remove"]')[1].trigger('click')

    expect(wrapper.vm.tags).toEqual(['Vue', 'Accessibility'])
    expect(wrapper.findAll('[role="listitem"]').map(item => item.text())).toEqual(['Vue', 'Accessibility'])
  })

  it('should remove the focused tag with Delete', async () => {
    const items = wrapper.findAll('[role="listitem"]')
    items[0].element.focus()

    await items[0].trigger('keydown', { key: 'Delete' })

    expect(wrapper.vm.tags).toEqual(['Reka UI', 'Accessibility'])
  })

  it('should remove the focused tag with Backspace', async () => {
    const items = wrapper.findAll('[role="listitem"]')
    items[2].element.focus()

    await items[2].trigger('keydown', { key: 'Backspace' })

    expect(wrapper.vm.tags).toEqual(['Vue', 'Reka UI'])
  })

  it('should not remove a disabled tag from keyboard or delete button', async () => {
    const DisabledTagGroupDemo = defineComponent({
      components: { TagGroupRoot, TagGroupItem, TagGroupItemText, TagGroupItemDelete },
      setup() {
        const tags = ref(['Vue', 'Reka UI'])
        return { tags }
      },
      template: `
        <TagGroupRoot v-model="tags" aria-label="Selected frameworks">
          <TagGroupItem v-for="tag in tags" :key="tag" :value="tag" :disabled="tag === 'Vue'">
            <TagGroupItemText>{{ tag }}</TagGroupItemText>
            <TagGroupItemDelete :aria-label="'Remove ' + tag" />
          </TagGroupItem>
        </TagGroupRoot>
      `,
    })

    const disabledWrapper = mount(DisabledTagGroupDemo, { attachTo: document.body })
    const disabledItem = disabledWrapper.findAll('[role="listitem"]')[0]

    expect(disabledItem.attributes('tabindex')).toBe('-1')
    expect(disabledItem.attributes('data-disabled')).toBe('')

    await disabledItem.trigger('keydown', { key: 'Delete' })
    await disabledWrapper.find('button[aria-label="Remove Vue"]').trigger('click')

    expect(disabledWrapper.vm.tags).toEqual(['Vue', 'Reka UI'])
  })

  it('should not remove a tag when a disabled delete control is rendered as a non-button element', async () => {
    const DisabledDeleteAsDivDemo = defineComponent({
      components: { TagGroupRoot, TagGroupItem, TagGroupItemText, TagGroupItemDelete },
      setup() {
        const tags = ref(['Vue', 'Reka UI'])
        return { tags }
      },
      template: `
        <TagGroupRoot v-model="tags" aria-label="Selected frameworks">
          <TagGroupItem v-for="tag in tags" :key="tag" :value="tag">
            <TagGroupItemText>{{ tag }}</TagGroupItemText>
            <TagGroupItemDelete
              as="div"
              :disabled="tag === 'Vue'"
              :aria-label="'Remove ' + tag"
            />
          </TagGroupItem>
        </TagGroupRoot>
      `,
    })

    const disabledWrapper = mount(DisabledDeleteAsDivDemo, { attachTo: document.body })
    const disabledDelete = disabledWrapper.find('[aria-label="Remove Vue"]')

    expect(disabledDelete.attributes('data-disabled')).toBe('')
    expect(disabledDelete.attributes('disabled')).toBeUndefined()

    await disabledDelete.trigger('click')

    expect(disabledWrapper.vm.tags).toEqual(['Vue', 'Reka UI'])
  })

  it('should reflect item selection state from the model value', () => {
    const items = wrapper.findAll('[role="listitem"]')

    expect(items.every(item => item.attributes('data-state') === 'checked')).toBe(true)
  })

  it('should move focus between enabled tags with arrow keys', async () => {
    const KeyboardTagGroupDemo = defineComponent({
      components: { TagGroupRoot, TagGroupItem, TagGroupItemText, TagGroupItemDelete },
      setup() {
        const tags = ref(['Vue', 'Reka UI', 'Accessibility', 'Radix'])
        return { tags }
      },
      template: `
        <TagGroupRoot v-model="tags" aria-label="Selected frameworks" loop>
          <TagGroupItem v-for="tag in tags" :key="tag" :value="tag" :disabled="tag === 'Accessibility'">
            <TagGroupItemText>{{ tag }}</TagGroupItemText>
            <TagGroupItemDelete :aria-label="'Remove ' + tag" />
          </TagGroupItem>
        </TagGroupRoot>
      `,
    })

    wrapper.unmount()
    document.body.innerHTML = ''

    const keyboardWrapper = mount(KeyboardTagGroupDemo, { attachTo: document.body })
    const items = () => keyboardWrapper.findAll('[role="listitem"]')

    await userEvent.tab()
    expect(document.activeElement).toBe(items()[0].element)

    await userEvent.keyboard('[ArrowRight]')
    expect(document.activeElement).toBe(items()[1].element)

    await userEvent.keyboard('[ArrowRight]')
    expect(document.activeElement).not.toBe(items()[2].element)
    expect(document.activeElement).toBe(items()[3].element)

    await userEvent.keyboard('[ArrowRight]')
    expect(document.activeElement).toBe(items()[0].element)

    await userEvent.keyboard('[End]')
    expect(document.activeElement).toBe(items()[3].element)

    await userEvent.keyboard('[Home]')
    expect(document.activeElement).toBe(items()[0].element)
  })
})
