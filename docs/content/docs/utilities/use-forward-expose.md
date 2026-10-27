---
title: useForwardExpose
description: Deprecated. Expose a component's element with the element-first ref contract (useForwardElement and useMergedRefs) instead.
---

# useForwardExpose

<Description>
Deprecated. Expose a component's element with the element-first ref contract (useForwardElement and useMergedRefs) instead.
</Description>

<Callout type="warning" title="Deprecated">

`useForwardExpose` is deprecated in v3 and Reka UI's own parts no longer use it. It still works, with its v2 behavior, and logs a one-time warning in development. It will be removed in a future major version. Use [`useForwardElement`](#useforwardelement) for new code.

</Callout>

## The element-first ref contract

A template ref on any Reka UI part gives you the part's DOM element through two keys that read the same reactive ref:

```ts
defineExpose({ element, $el }) // $el reads `element`, see below
```

- `element` is the rendered DOM element, or `null` whenever the part renders no element (before mount, or a closed `DialogContent`). Reka UI resolves child components by this key, so a component that exposes it is targeted reliably, and a part with no element resolves to `null`.
- `$el` is the same ref under the name Vue developers expect. It overrides Vue's built-in `$el`, so it follows root swaps (`v-if`, `as` changes, `asChild` children) instead of keeping a stale value, and on a multi-root component it points at the element rather than at a fragment anchor. When the part renders no element, `$el` falls back to the placeholder comment node Vue renders in its place, as in v2, so `unrefElement` and `useEventListener` receive a node and never the component itself.

The component's expose proxy unwraps both refs, so you read `partRef.value.$el` or `partRef.value.element` without `.value`. VueUse's `unrefElement(partRef)` and floating-ui's Vue bindings resolve to the right element as they did before.

A part ref exposes `element`, `$el` and the methods listed in that part's API reference, and nothing else:

- **Props are not readable from the ref.** `partRef.value.disabled` is `undefined`; read the value from the state you pass in. In development, Reka UI logs a warning the first time a prop is read off a part ref.
- **Methods are not forwarded through `as` / `asChild`.** When a part renders your component through `as` or `asChild`, the methods your component exposes are not available on the part's ref. Put a ref on your own component to call them.

## useForwardElement

`useForwardElement` is the composable Reka UI parts use. Bind `forwardRef` on the element (or component) that should become the component's element, and pass `expose` to `defineExpose`:

```vue
<script setup lang="ts">
import { Primitive, useForwardElement } from 'reka-ui'

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <span>
    <!-- The div becomes this component's `element` / `$el`. -->
    <Primitive :ref="forwardRef" as="div">
      ...
    </Primitive>
  </span>
</template>
```

`currentElement` is a computed holding the resolved DOM element. If `forwardRef` receives a component, the element is resolved element-first: the component's exposed `element`, then its `$el`, and for a multi-root component the first element after its fragment anchor. When the bound component exposes `element`, `currentElement` follows that component's own root swaps.

To expose methods next to the element, use `mergeExpose`. It keeps the development warning for prop reads, which spreading `{ ...expose }` would drop:

```ts
import { mergeExpose, useForwardElement } from 'reka-ui'

const { forwardRef, currentElement, expose } = useForwardElement()

defineExpose(mergeExpose(expose, {
  /** Focuses the component's element. */
  focus: () => currentElement.value?.focus(),
}))
```

### Components passed to `asChild`

When you render your own component as the child of an `asChild` part, Reka UI targets it through the ref contract above. A component with a single root element works without changes. If your component has several root nodes, swaps its root with `v-if`, or should target an inner element, expose `element`. A multi-root component that does not expose it is resolved through the first element after its fragment anchor, read when the ref is set: after that first element is swapped (by `v-if` or a list change), the part can keep holding the removed, detached node. A multi-root component also has to bind the part's attributes itself:

```vue
<script setup lang="ts">
import { useForwardElement } from 'reka-ui'

defineOptions({ inheritAttrs: false })

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <Icon />
  <button :ref="forwardRef" v-bind="$attrs">
    <slot />
  </button>
</template>
```

## useMergedRefs

`useMergedRefs` merges object refs and callback refs into one callback ref that you bind with `:ref`. Every ref receives the resolved element, never a component instance. A callback ref may return a cleanup function, which runs when the element is detached or replaced instead of the callback being called with `null`. When every ref passed in is `null` or `undefined`, `useMergedRefs` returns `undefined`.

```vue
<script setup lang="ts">
import type { Ref } from 'vue'
import { useMergedRefs } from 'reka-ui'
import { ref } from 'vue'

const props = defineProps<{ elementRef?: Ref<HTMLElement | null> }>()
const local = ref<HTMLElement | null>(null)

const merged = useMergedRefs(local, props.elementRef, (el) => {
  const observer = new ResizeObserver(() => {})
  if (el)
    observer.observe(el)
  return () => observer.disconnect()
})
</script>

<template>
  <div :ref="merged" />
</template>
```

`resolveRefTarget(value)` is the resolution step on its own: it turns a template ref value (an element, a component instance, or `null`) into a DOM element or `null`.

## Migrating from useForwardExpose

Import `useForwardElement` from `reka-ui` instead of `useForwardExpose`, then:

```vue
<script setup lang="ts">
import { useForwardElement } from 'reka-ui'

const { forwardRef, currentElement } = useForwardExpose() // [!code --]
const { forwardRef, currentElement, expose } = useForwardElement() // [!code ++]
defineExpose(expose) // [!code ++]
</script>
```

- If the component already calls `defineExpose({ ... })`, wrap the object: `defineExpose(mergeExpose(expose, { ... }))`.
- `useForwardExpose` also put the component's props and the forwarded child's exposed methods on the ref. `useForwardElement` does neither, so expose explicitly what consumers should call.
- `useForwardExpose()` called without binding `forwardRef` exposed the component's root element. With `useForwardElement`, bind `forwardRef` on the root.
