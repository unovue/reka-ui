import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { DrawerDescription, DrawerPopup, DrawerRoot, DrawerTitle, DrawerTrigger } from '.'

function renderDrawer() {
  const ids = {
    trigger: ref<string | undefined>('my-trigger'),
    content: ref<string | undefined>('my-content'),
    title: ref<string | undefined>('my-title'),
    description: ref<string | undefined>('my-description'),
  }
  const utils = render(defineComponent({
    components: { DrawerRoot, DrawerTrigger, DrawerPopup, DrawerTitle, DrawerDescription },
    setup: () => ({ ids }),
    template: `
      <DrawerRoot default-open :modal="false">
        <DrawerTrigger :id="ids.trigger.value">Open</DrawerTrigger>
        <DrawerPopup :id="ids.content.value">
          <DrawerTitle :id="ids.title.value">Title</DrawerTitle>
          <DrawerDescription :id="ids.description.value">Description</DrawerDescription>
        </DrawerPopup>
      </DrawerRoot>`,
  }))
  return {
    ids,
    trigger: () => utils.getByText('Open'),
    content: () => utils.getByRole('dialog'),
    title: () => utils.getByText('Title'),
    description: () => utils.getByText('Description'),
  }
}

describe('drawer part ids', () => {
  it('renders the consumer ids and points the ARIA attributes at them', async () => {
    const { trigger, content, title, description } = renderDrawer()
    await nextTick()
    expect(trigger().id).toBe('my-trigger')
    expect(content().id).toBe('my-content')
    expect(title().id).toBe('my-title')
    expect(description().id).toBe('my-description')
    expect(trigger().getAttribute('aria-controls')).toBe('my-content')
    expect(content().getAttribute('aria-labelledby')).toBe('my-title')
    expect(content().getAttribute('aria-describedby')).toBe('my-description')
  })

  it('follows a prop change', async () => {
    const { ids, trigger, content, title, description } = renderDrawer()
    await nextTick()
    ids.trigger.value = 'next-trigger'
    ids.content.value = 'next-content'
    ids.title.value = 'next-title'
    ids.description.value = 'next-description'
    await nextTick()
    expect(trigger().id).toBe('next-trigger')
    expect(content().id).toBe('next-content')
    expect(title().id).toBe('next-title')
    expect(description().id).toBe('next-description')
    expect(trigger().getAttribute('aria-controls')).toBe('next-content')
    expect(content().getAttribute('aria-labelledby')).toBe('next-title')
    expect(content().getAttribute('aria-describedby')).toBe('next-description')
  })
})
