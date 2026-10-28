import { mount } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/Tabs'

// `onNextFrame` keeps a module-level `scheduled` flag. A frame requested while
// rAF is faked (and never run) leaves it `true` forever, so every later
// TabsContent / CollapsibleContent mount in the same module graph never gets
// its frame callback: `animation-duration: 0s` sticks.
const Comp = defineComponent({
  components: { TabsRoot, TabsList, TabsTrigger, TabsContent },
  template: `
    <TabsRoot default-value="a">
      <TabsList><TabsTrigger value="a">A</TabsTrigger></TabsList>
      <TabsContent value="a">A content</TabsContent>
    </TabsRoot>`,
})

function frame() {
  return new Promise(resolve => requestAnimationFrame(() => resolve(undefined)))
}

it('a frame lost under fake timers does not block later onNextFrame callbacks', async () => {
  vi.useFakeTimers()
  const first = mount(Comp, { attachTo: document.body })
  first.unmount()
  vi.useRealTimers()

  const second = mount(Comp, { attachTo: document.body })
  await frame()
  await frame()
  await nextTick()
  const panel = second.find('[role="tabpanel"]').element as HTMLElement
  expect(panel.style.animationDuration).not.toBe('0s')
  second.unmount()
})
