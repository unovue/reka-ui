import { mount } from '@vue/test-utils'
import { bench, describe } from 'vitest'
import { defineComponent, h } from 'vue'
import { DismissableLayer as DismissableLayerPrimitive } from '.'
import { resetLayerStack } from './layerStack'

// NOTE: jsdom benchmarks measure JS-only cost (no layout/paint) and are
// DIRECTIONAL. The definitive proof of the listener consolidation is the
// structural assertion in `DismissableLayer.listeners.test.ts` (one shared
// document listener + one `querySelectorAll` per event, independent of layer
// count). Render count is unchanged (parity), not reduced — under Vue >= 3.4
// an open layer does not re-render on sibling membership churn either way.
//
// Run: `pnpm --filter reka-ui bench`

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

  bench('mount 20 layers + one outside pointerdown + unmount', () => {
    resetLayerStack()
    const wrapper = mountLayers(20)
    const outside = document.createElement('div')
    document.body.appendChild(outside)
    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    outside.remove()
    wrapper.unmount()
  })

  bench('escape dispatch against 20 open layers', () => {
    resetLayerStack()
    const wrapper = mountLayers(20)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    wrapper.unmount()
  })
})
