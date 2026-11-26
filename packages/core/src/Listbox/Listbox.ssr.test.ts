// @vitest-environment node
import { renderToString } from '@vue/server-renderer'
import { expect, it } from 'vitest'
import { createSSRApp, defineComponent, reactive } from 'vue'
import { ListboxContent, ListboxItem, ListboxRoot } from '.'

// App-level state (a store shared by requests) read by a server-rendered list: once the render is
// done, nothing of that render may still be subscribed to the state.
it('a server-rendered listbox does not stay subscribed to the model', async () => {
  let reads = 0
  const entry = {
    get id() {
      reads++
      return 1
    },
  }
  const model = reactive<any[]>([entry])
  const html = await renderToString(createSSRApp(defineComponent({
    components: { ListboxRoot, ListboxContent, ListboxItem },
    setup: () => ({ model }),
    template: `<ListboxRoot multiple by="id" :model-value="model">
      <ListboxContent>
        <ListboxItem v-for="v in [1, 2]" :key="v" :value="{ id: v }">{{ v }}</ListboxItem>
      </ListboxContent>
    </ListboxRoot>`,
  })))
  expect(html).toContain('data-state="checked"')
  expect(html).toContain('data-state="unchecked"')

  reads = 0
  model.push({ id: 2 })
  model.push({ id: 3 })
  expect(reads).toBe(0)
})
