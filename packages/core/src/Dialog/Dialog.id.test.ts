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

  it('keeps a title\'s id when an id-less title that set up before it unmounts', async () => {
    // A placeholder title (no id) is replaced by the real one (custom id). The
    // real title comes first in the template, so it mounts before the
    // placeholder unmounts; the placeholder must not restore the generated id.
    const ready = ref(false)
    const utils = render(defineComponent({
      components: { DialogRoot, DialogContent, DialogTitle, DialogDescription },
      setup: () => ({ ready }),
      template: `
        <DialogRoot :open="true">
          <DialogContent>
            <DialogTitle v-if="ready" id="real-title">Real</DialogTitle>
            <DialogTitle v-if="!ready">Loading</DialogTitle>
            <DialogDescription>d</DialogDescription>
          </DialogContent>
        </DialogRoot>`,
    }))
    await nextTick()
    ready.value = true
    await nextTick()
    await nextTick()
    expect(utils.getByText('Real').id).toBe('real-title')
    expect(utils.getByRole('dialog').getAttribute('aria-labelledby')).toBe('real-title')
  })

  it('renders each part\'s own id when two parts of a kind have one', async () => {
    const utils = render(defineComponent({
      components: { DialogRoot, DialogContent, DialogTitle, DialogDescription },
      template: `
        <DialogRoot :open="true">
          <DialogContent>
            <DialogTitle>T</DialogTitle>
            <DialogDescription id="d1">One</DialogDescription>
            <DialogDescription id="d2">Two</DialogDescription>
          </DialogContent>
        </DialogRoot>`,
    }))
    await nextTick()
    expect(utils.getByText('One').id).toBe('d1')
    expect(utils.getByText('Two').id).toBe('d2')
  })
})
