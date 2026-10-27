import { CalendarDate } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { mountInShadowRoot } from '@/shared/test/shadowDom'
import DateField from './story/_DateField.vue'

describe('given a DateField inside a shadow root, in a real browser', () => {
  it('moves between segments with the arrow keys and edits them', async () => {
    const { get, activeElement } = mountInShadowRoot(DateField, {
      props: { dateFieldProps: { defaultValue: new CalendarDate(2024, 1, 20), locale: 'en-US' } },
    })

    get('month')!.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(activeElement()).toBe(get('day'))
    await userEvent.keyboard('{ArrowRight}')
    expect(activeElement()).toBe(get('year'))
    await userEvent.keyboard('{ArrowLeft}')
    expect(activeElement()).toBe(get('day'))

    await userEvent.keyboard('{ArrowUp}')
    await expect.poll(() => get('value')!.textContent).toBe('2024-01-21')

    // Typing a full segment advances to the next one.
    get('month')!.focus()
    await userEvent.keyboard('12')
    await expect.poll(activeElement).toBe(get('day'))
    await expect.poll(() => get('value')!.textContent).toBe('2024-12-21')
  })

  it('focuses the first segment from its label', async () => {
    const { get, activeElement } = mountInShadowRoot(DateField, {
      props: { dateFieldProps: { locale: 'en-US' } },
    })

    await userEvent.click(get('label')!)
    await expect.poll(activeElement).toBe(get('month'))
  })
})
