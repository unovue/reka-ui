import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '.'

function renderTabs() {
  const triggerId = ref<string | undefined>('my-tab')
  const contentId = ref<string | undefined>('my-panel')
  const utils = render(defineComponent({
    components: { TabsRoot, TabsList, TabsTrigger, TabsContent },
    setup: () => ({ triggerId, contentId }),
    template: `
      <TabsRoot default-value="one">
        <TabsList>
          <TabsTrigger value="one" :id="triggerId">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one" :id="contentId">Panel one</TabsContent>
        <TabsContent value="two">Panel two</TabsContent>
      </TabsRoot>`,
  }))
  const tab = (name: string) => utils.getByRole('tab', { name })
  const panel = () => utils.getByRole('tabpanel')
  return { triggerId, contentId, tab, panel }
}

describe('tabs part ids', () => {
  it('renders the consumer ids and links the tab and panel of a value through them', async () => {
    const { tab, panel } = renderTabs()
    await nextTick()
    expect(tab('One').id).toBe('my-tab')
    expect(panel().id).toBe('my-panel')
    expect(tab('One').getAttribute('aria-controls')).toBe('my-panel')
    expect(panel().getAttribute('aria-labelledby')).toBe('my-tab')
  })

  it('only overrides the part it is set on', async () => {
    const { tab } = renderTabs()
    await nextTick()
    expect(tab('Two').id).toMatch(/-trigger-two$/)
  })

  it('follows a prop change', async () => {
    const { triggerId, contentId, tab, panel } = renderTabs()
    await nextTick()
    triggerId.value = 'next-tab'
    contentId.value = 'next-panel'
    await nextTick()
    expect(tab('One').id).toBe('next-tab')
    expect(panel().id).toBe('next-panel')
    expect(tab('One').getAttribute('aria-controls')).toBe('next-panel')
    expect(panel().getAttribute('aria-labelledby')).toBe('next-tab')
  })

  it('falls back to the value-derived ids when the props are removed', async () => {
    const { triggerId, contentId, tab, panel } = renderTabs()
    await nextTick()
    triggerId.value = undefined
    contentId.value = undefined
    await nextTick()
    expect(tab('One').id).toMatch(/-trigger-one$/)
    expect(panel().id).toMatch(/-content-one$/)
    expect(tab('One').getAttribute('aria-controls')).toBe(panel().id)
    expect(panel().getAttribute('aria-labelledby')).toBe(tab('One').id)
  })
})
