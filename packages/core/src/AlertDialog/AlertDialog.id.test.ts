import { render } from '@testing-library/vue'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { resetBodyScrollLock } from '@/shared/useBodyScrollLock'
import { AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogRoot, AlertDialogTitle, AlertDialogTrigger } from '.'

function renderAlertDialog() {
  const ids = {
    trigger: ref<string | undefined>('my-trigger'),
    content: ref<string | undefined>('my-content'),
    title: ref<string | undefined>('my-title'),
    description: ref<string | undefined>('my-description'),
  }
  const utils = render(defineComponent({
    components: { AlertDialogRoot, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel },
    setup: () => ({ ids }),
    template: `
      <AlertDialogRoot default-open>
        <AlertDialogTrigger :id="ids.trigger.value">Open</AlertDialogTrigger>
        <AlertDialogContent :id="ids.content.value">
          <AlertDialogTitle :id="ids.title.value">Title</AlertDialogTitle>
          <AlertDialogDescription :id="ids.description.value">Description</AlertDialogDescription>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialogRoot>`,
  }))
  return {
    ids,
    trigger: () => utils.getByText('Open'),
    content: () => utils.getByRole('alertdialog'),
    title: () => utils.getByText('Title'),
    description: () => utils.getByText('Description'),
  }
}

afterEach(() => {
  resetBodyScrollLock()
})

describe('alert dialog part ids (inherited from Dialog)', () => {
  it('renders the consumer ids and points the ARIA attributes at them', async () => {
    const { trigger, content, title, description } = renderAlertDialog()
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
    const { ids, trigger, content, title, description } = renderAlertDialog()
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
