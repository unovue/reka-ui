import { renderToString } from '@vue/server-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, ref } from 'vue'
import { sleep } from '@/test'
import { DialogContent, DialogOverlay, DialogRoot, DialogTitle } from '.'

let isServer = false

// On a real server the scroll lock is inert; in jsdom it would engage and its
// never-unmounted holder would keep the shared lock stack held for the client.
vi.mock('@/shared/useBodyScrollLock', async (importOriginal) => {
  const mod: typeof import('@/shared/useBodyScrollLock') = await importOriginal()

  return {
    ...mod,
    useBodyScrollLock: ((...args) => isServer ? ref(false) : mod.useBodyScrollLock(...args)) as typeof mod.useBodyScrollLock,
  }
})

/** A modal Dialog (overlay + content) whose `open` state the test controls. */
function createDialogFixture(open = ref(true)) {
  return defineComponent({
    setup() {
      return () => h(DialogRoot, {
        'open': open.value,
        'onUpdate:open': (value: boolean) => { open.value = value },
      }, () => [
        h(DialogOverlay),
        h(DialogContent, { 'aria-describedby': undefined }, () => h(DialogTitle, () => 'Title')),
      ])
    },
  })
}

afterEach(() => {
  isServer = false
  document.body.innerHTML = ''
  document.body.style.pointerEvents = ''
  document.body.style.overflow = ''
})

// Hydration runs outside a scheduler flush, so the overlay's scroll lock locks
// the body before the content's `DismissableLayer` registers (#2867).
describe('given a modal Dialog that is open in the SSR render', () => {
  it('should restore body pointer-events after the hydrated dialog closes', async () => {
    isServer = true
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(createDialogFixture()))
    isServer = false
    document.body.append(container)

    const open = ref(true)
    const app = createSSRApp(createDialogFixture(open))
    app.mount(container)
    await sleep(1)
    expect(container.querySelector('[role="dialog"]')).not.toBeNull()
    expect(document.body.style.pointerEvents).toBe('none')

    open.value = false
    await sleep(1)
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(document.body.style.pointerEvents).toBe('')

    app.unmount()
  })
})
