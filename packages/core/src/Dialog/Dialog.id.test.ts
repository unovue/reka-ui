import { render } from '@testing-library/vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { resetBodyScrollLock } from '@/shared/useBodyScrollLock'
import { DialogContent, DialogDescription, DialogRoot, DialogTitle, DialogTrigger } from '.'

function renderDialog() {
  const ids = {
    trigger: ref<string | undefined>('my-trigger'),
    content: ref<string | undefined>('my-content'),
    title: ref<string | undefined>('my-title'),
    description: ref<string | undefined>('my-description'),
  }
  const open = ref(true)
  const utils = render(defineComponent({
    components: { DialogRoot, DialogTrigger, DialogContent, DialogTitle, DialogDescription },
    setup: () => ({ ids, open }),
    template: `
      <DialogRoot v-model:open="open">
        <DialogTrigger :id="ids.trigger.value">Open</DialogTrigger>
        <DialogContent :id="ids.content.value">
          <DialogTitle :id="ids.title.value">Title</DialogTitle>
          <DialogDescription :id="ids.description.value">Description</DialogDescription>
        </DialogContent>
      </DialogRoot>`,
  }))
  return {
    ids,
    open,
    trigger: () => utils.getByText('Open'),
    content: () => utils.getByRole('dialog'),
    title: () => utils.getByText('Title'),
    description: () => utils.getByText('Description'),
  }
}

afterEach(() => {
  resetBodyScrollLock()
  vi.restoreAllMocks()
})

describe('dialog part ids', () => {
  it('renders the consumer ids and points the ARIA attributes at them', async () => {
    const { trigger, content, title, description } = renderDialog()
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
    const { ids, trigger, content, title, description } = renderDialog()
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

  it('falls back to the generated ids when the props are removed', async () => {
    const { ids, trigger, content, title, description } = renderDialog()
    await nextTick()
    ids.content.value = undefined
    ids.title.value = undefined
    ids.description.value = undefined
    await nextTick()
    expect(content().id).toMatch(/^reka-dialog-.*-content$/)
    expect(trigger().getAttribute('aria-controls')).toBe(content().id)
    expect(content().getAttribute('aria-labelledby')).toBe(title().id)
    expect(content().getAttribute('aria-describedby')).toBe(description().id)
  })

  it('keeps the consumer ids across a close and reopen', async () => {
    const { open, trigger, content } = renderDialog()
    await nextTick()
    open.value = false
    await nextTick()
    open.value = true
    await nextTick()
    expect(content().id).toBe('my-content')
    expect(trigger().getAttribute('aria-controls')).toBe('my-content')
    expect(content().getAttribute('aria-labelledby')).toBe('my-title')
  })

  it('finds a title with a consumer id (no missing-title warning)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    renderDialog()
    await nextTick()
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('requires a `DialogTitle`'))
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('Missing `Description`'))
  })
})
