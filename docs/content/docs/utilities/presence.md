---
title: Presence
description: Manages mounting and unmounting of element with transition support.
---

# Presence

<Description>
Manages mounting and unmounting of element with transition support.
</Description>

<Callout type="info" title="Question">

How is this component different from [Vue Transition](https://vuejs.org/guide/built-ins/transition.html#transition)?

A: The biggest difference is it waits for whatever CSS transition or animation the element itself runs, without transition classes, and controls the visibility of the element.

</Callout>

Presence component provides enhanced control over element mounting/unmounting. It ensures animations and transitions complete before removing elements from the DOM, making it perfect for animated UI components.

It renders two attributes on its child element, so CSS transitions can animate both phases:

- `data-starting-style` for the first frame after the element is mounted (or shown again) by `present` turning `true`.
- `data-ending-style` from `present` turning `false` until every transition and animation of the element has finished (read with `element.getAnimations()`); the element then unmounts.

When nothing is running (no transition or animation, or `prefers-reduced-motion` styles that remove them), the element unmounts right away. Infinite animations and animations of descendants are not waited for. In environments without Web Animations (jsdom), no attribute is rendered and changes settle right away.

## API Reference

<PropsTable :data="[
  {
    'name': 'present',
    'description': '<p>Conditional to mount or unmount the child element. Similar to <code>v-if</code></p>\n',
    'type': 'boolean',
    'required': true,
  },
  {
    'name': 'forceMount',
    'description': '<p>Force the element to render all the time.\n\nUseful for programmatically render grandchild component with the exposed <code>present</code></p>\n',
    'type': 'boolean',
    'required': false,
    'default': false
  },
  {
    'name': 'appear',
    'description': '<p>Treat an initial <code>present</code> of <code>true</code> as an open: render the child with <code>data-starting-style</code> on its first frame, like Vue <code>Transition</code> with <code>appear</code>. Without it only a later change to <code>present</code> does.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': false
  },
]" />

<EmitsTable :data="[
  {
    'name': 'complete',
    'description': '<p>Emitted once the enter (<code>true</code>) or exit (<code>false</code>) transitions and animations of the child element have finished; on exit, right before the element unmounts. A change interrupted by another one is not reported.</p>\n',
    'type': '[present: boolean]'
  },
  {
    'name': 'enter',
    'description': '<p>Event handler called when the enter animation has started</p>\n',
    'type': 'CustomEvent'
  },
  {
    'name': 'after-enter',
    'description': '<p>Event handler called when the enter animation has finished</p>\n',
    'type': 'CustomEvent'
  },
  {
    'name': 'leave',
    'description': '<p>Event handler called when the leave animation has started</p>\n',
    'type': 'CustomEvent'
  },
  {
    'name': 'after-leave',
    'description': '<p>Event handler called when the leave animation has finished</p>\n',
    'type': 'CustomEvent'
  },
]" />

<Callout type="tip">

Read our [Animation Guide](/docs/guides/animation) to learn more about implementing animations with Presence component.

</Callout>

## Example

```vue line=2,4
<template>
  <Presence :present="isVisible">
    <div
      class="transition-opacity duration-200 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0"
    >
      <slot />
    </div>
  </Presence>
</template>
```

Keyframe animations work too:

```vue line=2,4,5
<template>
  <Presence :present="isVisible">
    <div
      :data-state="isVisible ? 'open' : 'closed'"
      class="data-[state=open]:animate-fadeIn data-[state=closed]:animate-fadeOut"
    >
      <slot />
    </div>
  </Presence>
</template>
```

### Force Mount

When you need to ensure content is always rendered regardless of the present state:

```vue
<template>
  <Presence v-slot="{ present }" :present="isVisible" :force-mount="true">
    <div>
      This content will always be rendered

      <div v-if="present">
        This content is hidden
      </div>
    </div>
  </Presence>
</template>
```
