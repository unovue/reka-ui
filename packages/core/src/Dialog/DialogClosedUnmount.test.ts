import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { DialogClose, DialogContent, DialogDescription, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from '.'

async function settle() {
  await nextTick()
  await new Promise(r => setTimeout(r, 10))
  await nextTick()
}

describe.each([true, false])('dialog kept mounted while closed, then unmounted (modal: %s)', (modal) => {
  const show = ref(true)
  const onCloseAutoFocus = vi.fn()
  let wrapper: ReturnType<typeof mount>

  function setup() {
    show.value = true
    onCloseAutoFocus.mockClear()
    const Comp = defineComponent({
      components: { DialogRoot, DialogTrigger, DialogPortal, DialogContent, DialogTitle, DialogDescription, DialogClose },
      setup: () => ({ show, modal, onCloseAutoFocus }),
      template: `<div>
  <input data-testid="other">
  <DialogRoot v-if="show" :modal="modal" :unmount-on-hide="false">
    <DialogTrigger data-testid="trigger">open</DialogTrigger>
    <DialogPortal>
      <DialogContent @close-auto-focus="onCloseAutoFocus">
        <DialogTitle>title</DialogTitle>
        <DialogDescription>description</DialogDescription>
        <DialogClose data-testid="close">close</DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</div>`,
    })
    wrapper = mount(Comp, { attachTo: document.body })
  }

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  it('never opened: does not fire closeAutoFocus or steal focus', async () => {
    setup()
    await settle()
    const other = wrapper.find('[data-testid=other]').element as HTMLInputElement
    other.focus()
    show.value = false
    await settle()
    expect(onCloseAutoFocus).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(other)
  })

  it('opened then closed: does not fire closeAutoFocus or steal focus on unmount', async () => {
    setup()
    await settle()
    await wrapper.find('[data-testid=trigger]').trigger('click')
    await settle()
    ;(document.querySelector('[data-testid=close]') as HTMLElement).click()
    await settle()
    onCloseAutoFocus.mockClear()
    const other = wrapper.find('[data-testid=other]').element as HTMLInputElement
    other.focus()
    show.value = false
    await settle()
    expect(onCloseAutoFocus).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(other)
  })

  it('unmounted while open still restores', async () => {
    setup()
    await settle()
    await wrapper.find('[data-testid=trigger]').trigger('click')
    await settle()
    show.value = false
    await settle()
    expect(onCloseAutoFocus).toHaveBeenCalledTimes(1)
  })
})
