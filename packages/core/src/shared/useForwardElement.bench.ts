import type { Component } from 'vue'
import { describe, it } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'
import { useForwardElement } from './useForwardElement'
import { useForwardExpose } from './useForwardExpose'

// #2808 — the bare ref/expose machinery of a part, isolated (same methodology
// as the #2722 `useRender` bench): 200 parts per tree, three part flavours, in
// jsdom. Absolute hz are meaningless; compare each flavour's RATIO to the
// no-machinery baseline. A real part does much more shared work, so the
// whole-app gain is a fraction of these ratios.
//
// - `useForwardExpose` (legacy): `defineProperty` loops over props + `$el`,
//   `instance.exposed` mutation, and an `onUpdated` resync on every re-render.
// - `useForwardElement` + `expose(api.expose)`: a shallowRef + computed, plain
//   `expose()`; nothing on update. Measured with the dev-only prop-read proxy
//   (what vitest runs) and without it (what production ships).
// - baseline: the same element, no ref machinery at all.
//
// Run: `pnpm --filter reka-ui exec vitest bench src/shared/useForwardElement.bench.ts`

const PARTS = 200
const tick = ref(0)

// The legacy composable warns once about its deprecation; keep the output clean.
console.warn = () => {}

const partProps = {
  as: { type: String, default: 'div' },
  asChild: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
}

const LegacyPart = defineComponent({
  props: partProps,
  setup(props) {
    const { forwardRef } = useForwardExpose()
    return () => h(props.as, { 'ref': forwardRef, 'data-tick': tick.value })
  },
})

const ElementPart = defineComponent({
  props: partProps,
  setup(props, { expose }) {
    const { forwardRef, expose: elementExpose } = useForwardElement()
    expose(elementExpose)
    return () => h(props.as, { 'ref': forwardRef, 'data-tick': tick.value })
  },
})

const BaselinePart = defineComponent({
  props: partProps,
  setup(props) {
    return () => h(props.as, { 'data-tick': tick.value })
  },
})

function mountTree(Part: Component) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const app = createApp(() => h('div', Array.from({ length: PARTS }, (_, i) => h(Part, { key: i }))))
  app.mount(el)
  return () => {
    app.unmount()
    el.remove()
  }
}

/** Runs `fn` with the dev-only prop-read proxy disabled (production behaviour). */
function asProduction<T>(fn: () => T): T {
  const env = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'
  try {
    return fn()
  }
  finally {
    process.env.NODE_ENV = env
  }
}

type Flavour = [name: string, Part: Component, production: boolean]
const FLAVOURS: Flavour[] = [
  ['useForwardExpose (legacy)', LegacyPart, false],
  ['useForwardElement (dev proxy)', ElementPart, false],
  ['useForwardElement (production)', ElementPart, true],
  ['baseline (no machinery)', BaselinePart, false],
]

/** Logs each flavour's mean latency as a ratio of the baseline's. */
function logRatios(title: string, result: { get: (name: string) => { latency: { mean: number } } | undefined }) {
  const base = result.get('baseline (no machinery)')!.latency.mean
  const rows = FLAVOURS.map(([name]) => `  ${name}: ${(result.get(name)!.latency.mean / base).toFixed(3)}x baseline`)
  // eslint-disable-next-line no-console
  console.log(`${title}\n${rows.join('\n')}`)
}

describe('ref/expose machinery (#2808)', () => {
  it(`mount + unmount ${PARTS} parts`, async ({ bench: b }) => {
    const result = await b.compare(
      ...FLAVOURS.map(([name, Part, production]) => b(name, () => {
        const unmount = production ? asProduction(() => mountTree(Part)) : mountTree(Part)
        unmount()
      })),
    )
    logRatios(`mount + unmount ${PARTS} parts`, result as any)
  })

  it(`update pass: every one of ${PARTS} parts re-renders`, async ({ bench: b }) => {
    let unmount: () => void = () => {}
    const result = await b.compare(
      ...FLAVOURS.map(([name, Part, production]) => b(name, {
        beforeAll() {
          unmount = production ? asProduction(() => mountTree(Part)) : mountTree(Part)
        },
        afterAll() {
          unmount()
        },
      }, async () => {
        tick.value++
        await nextTick()
      })),
    )
    logRatios(`update pass ${PARTS} parts`, result as any)
  })
})
