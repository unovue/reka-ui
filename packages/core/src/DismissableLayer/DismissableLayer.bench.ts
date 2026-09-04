import { mount } from '@vue/test-utils'
import { bench, describe } from 'vitest'
import { defineComponent, h } from 'vue'
import { DismissableLayer as DismissableLayerPrimitive } from '.'
import { resetLayerStack } from './layerStack'

// NOTE: jsdom benchmarks measure JS-only cost (no layout/paint) and are
// DIRECTIONAL. The definitive proof of the listener consolidation is the
// structural assertion in `DismissableLayer.listeners.test.ts` (one shared
// document listener + one registry snapshot per event, independent of layer
// count). Render count is unchanged (parity), not reduced — under Vue >= 3.4
// an open layer does not re-render on sibling membership churn either way.
//
// What each bench measures:
// 1. mount + unmount of N layers — registration/teardown cost of the manager.
// 2. ONE outside `pointerdown` against N already-mounted, ARMED layers — the
//    shared dispatch path (`layerStack.handlePointerDown` → N subscribers).
//    Subscribers only arm a macrotask after registration
//    (`registerOutsideSubscriber`), so mounting + arming happens in `setup`
//    (once per warmup/run phase) and the measured body is the dispatch alone.
// 3. ONE bubbling Escape `keydown` from the top layer against N layers — the
//    shared `window` keydown listener routing to the top present layer.
//
// Absolute numbers are meaningless on their own: run the same file against the
// v2 baseline (per-layer listeners) and compare the RATIO per bench.
//
// Run: `pnpm --filter reka-ui exec vitest bench src/DismissableLayer`

function mountLayers(n: number) {
  return mount(defineComponent({
    setup() {
      return () => h('div', Array.from({ length: n }, (_, i) => h(DismissableLayerPrimitive, { key: i, present: true })))
    },
  }), { attachTo: document.body })
}

describe('dismissableLayer', () => {
  bench('mount + unmount 50 stacked layers', () => {
    resetLayerStack()
    const wrapper = mountLayers(50)
    wrapper.unmount()
  })

  let wrapper: ReturnType<typeof mountLayers>
  let outside: HTMLElement
  let topLayer: Element

  bench('one outside pointerdown against 20 armed layers', () => {
    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }))
  }, {
    async setup() {
      resetLayerStack()
      wrapper = mountLayers(20)
      outside = document.createElement('div')
      document.body.appendChild(outside)
      await new Promise(r => setTimeout(r, 0)) // let the subscribers arm
    },
    teardown() {
      outside.remove()
      wrapper.unmount()
      resetLayerStack()
    },
  })

  bench('one escape keydown against 20 open layers', () => {
    // Bubbles element → document → window, where the shared listener lives.
    // Dispatching a non-bubbling event on `document` never reaches it.
    topLayer.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  }, {
    setup() {
      resetLayerStack()
      wrapper = mountLayers(20)
      topLayer = wrapper.element.lastElementChild as Element
    },
    teardown() {
      wrapper.unmount()
      resetLayerStack()
    },
  })
})
