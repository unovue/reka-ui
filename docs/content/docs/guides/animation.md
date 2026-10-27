---
title: Animation/Transition
description: Animate Reka UI with CSS transitions, CSS keyframes, native Vue Transition or JavaScript animation library of your choice.
---

# Animation

<Description>
Animate Reka UI with CSS transitions, CSS keyframes, native Vue Transition or JavaScript animation library of your choice.
</Description>

Adding animation to Reka UI should feel similar to any other component. Parts that mount and unmount (contents, overlays, indicators, toasts, …) are managed by [Presence](/docs/utilities/presence), which keeps the element in the DOM until its exit transition or animation has finished. There are three ways to animate them:

1. **CSS transitions** (recommended): style the enter and exit states with `data-starting-style` and `data-ending-style`.
2. **CSS keyframe animations** on `data-state="open"` / `data-state="closed"`.
3. **JavaScript animation libraries**, which take over mounting with `forceMount` and can listen to `update:openComplete`.

## Animating with CSS transitions

Presence stamps two attributes on the element it manages:

- `data-starting-style` is present for the first frame after the element is mounted (or shown again) by an open. Style the state the element enters *from*.
- `data-ending-style` is present from the close until every transition and animation on the element has finished. Style the state the element leaves *to*. The element unmounts once they have all finished.

A plain `transition` then animates both phases, including with Tailwind CSS `transition-*` utilities:

```css
.DialogOverlay,
.DialogContent {
  transition: opacity 200ms ease, transform 200ms ease;
}

.DialogOverlay[data-starting-style],
.DialogOverlay[data-ending-style] {
  opacity: 0;
}

.DialogContent[data-starting-style],
.DialogContent[data-ending-style] {
  opacity: 0;
  transform: scale(0.95);
}
```

```vue
<DialogContent
  class="transition duration-200 data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:scale-95"
>
  …
</DialogContent>
```

Because a transition starts from the element's current style, closing while the element is still opening (or reopening while it is closing) reverses the transition from wherever it is, without remounting.

Collapsible and Accordion content measure the panel into `--reka-collapsible-content-height` / `--reka-collapsible-content-width` (and the `--reka-accordion-content-*` aliases), so a height transition is written the same way:

```css
.CollapsibleContent {
  overflow: hidden;
  height: var(--reka-collapsible-content-height);
  transition: height 300ms ease;
}

.CollapsibleContent[data-starting-style],
.CollapsibleContent[data-ending-style] {
  height: 0;
}
```

Presence waits for the transitions and animations of the managed element itself (read with [`element.getAnimations()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getAnimations)), not for those of its descendants. Infinite animations are not waited for. When nothing is running, for example when a `prefers-reduced-motion` media query turns the transition off, the element unmounts right away.

Everything running on the element when it closes is waited for, as in Base UI:

- **Unrelated transitions count too.** A hover `transition: background-color 600ms` still running when the content closes delays the unmount until it ends. Scope such transitions to the hovered state, or list only the properties the enter and exit animate.
- **There is no timeout.** A paused animation (`animation-play-state: paused`) holds the element mounted until it resumes, and browsers throttle animations in background tabs, so a close in a hidden tab completes when the tab is visible again.

## Animating with CSS animation

You can also use CSS animation to animate both mount and unmount phases. The latter is possible because the Reka UI will suspend unmount while your animation plays out.

```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.DialogOverlay[data-state="open"],
.DialogContent[data-state="open"] {
  animation: fadeIn 300ms ease-out;
}

.DialogOverlay[data-state="closed"],
.DialogContent[data-state="closed"] {
  animation: fadeOut 300ms ease-in;
}
```

## Animating with Vue Transition

Other than using CSS animation, you might prefer to use the native Vue `<Transition>`. Great news! It should be as easy as wrapping component (that has `forceMount` prop), and you are done!

```vue line=11,13,14,19,25-33
<script setup lang="ts">
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger, } from 'reka-ui'
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger>
      Edit profile
    </DialogTrigger>
    <DialogPortal>
      <Transition name="fade">
        <DialogOverlay />
      </Transition>
      <Transition name="fade">
        <DialogContent>
          <h1>Hello from inside the Dialog!</h1>
          <DialogClose>Close</DialogClose>
        </DialogContent>
      </Transition>
    </DialogPortal>
  </DialogRoot>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

## ⭐️ Animating with Motion Vue

[Motion Vue](https://motion.dev/docs/vue) is the recommended animation library for Reka UI. This lightweight, powerful library integrates seamlessly with components and offers extensive flexibility for creating smooth, performant animations.

```vue line=3,12,14-18,22-26,29,31
<script setup lang="ts">
import { AnimatePresence, Motion } from 'motion-v'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger, } from 'reka-ui'
</script>

<template>
  <DialogRoot>
    <DialogTrigger>
      Edit profile
    </DialogTrigger>
    <DialogPortal>
      <AnimatePresence multiple>
        <DialogOverlay as-child>
          <Motion
            :initial="{ opacity: 0, scale: 0 }"
            :animate="{ opacity: 1, scale: 1 }"
            :exit="{ opacity: 0, scale: 0.6 }"
          />
        </DialogOverlay>

        <DialogContent as-child>
          <Motion
            :initial="{ opacity: 0, top: '0%' }"
            :animate="{ opacity: 1, top: '50%' }"
            :exit="{ opacity: 0, top: '30%' }"
          >
            <h1>Hello from inside the Dialog!</h1>
            <DialogClose>Close</DialogClose>
          </Motion>
        </DialogContent>
      </AnimatePresence>
    </DialogPortal>
  </DialogRoot>
</template>
```

<Callout type="tip">

Check out this [Stackblitz Demo](https://stackblitz.com/edit/x7y44ngl?file=src%2FApp.vue) 🤩

</Callout>

## Knowing when an animation finished

Every root with an `open` model (`DialogRoot`, `AlertDialogRoot`, `DrawerRoot`, `PopoverRoot`, `TooltipRoot`, `HoverCardRoot`, `DropdownMenuRoot`, `ContextMenuRoot`, `MenubarMenu`, the `*Sub` menus, `SelectRoot`, `ComboboxRoot`, `AutocompleteRoot`, `DatePickerRoot`, `DateRangePickerRoot`, `CollapsibleRoot`, `AccordionItem` and `ToastRoot`) emits `update:openComplete` once the content's open or close transitions and animations have finished: `true` after opening, `false` after closing (right before the content unmounts). An interrupted change is not reported: closing while still opening only emits `false`. `NavigationMenuRoot` emits it too, from its `NavigationMenuViewport`: when a viewport opens and closes, not when the open item switches. A menu without a viewport does not emit it.

```vue
<DialogRoot v-model:open="open" @update:open-complete="(open) => !open && resetForm()">
  …
</DialogRoot>
```

The composables take the same callback as `onOpenComplete` (for example `useDialog({ onOpenComplete })`).

## Delegating unmounting for JavaScript Animation

When many stateful Primitives are hidden from view, they are actually removed from the DOM. JavaScript animation libraries need control of the unmounting phase, so we provide the `forceMount` prop on many components to allow consumers to delegate the mounting and unmounting of children based on the animation state determined by those libraries.

For example, if you want to use [@vueuse/motion](https://motion.vueuse.org/) to animate a `Dialog`, you would do so by conditionally rendering the dialog `Overlay` and `Content` parts based on the animation state from one of its composable like `useSpring`:

```vue line=32,34,41
<script setup lang="ts">
import { useSpring } from '@vueuse/motion'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger, } from 'reka-ui'
import { reactive, ref, watch } from 'vue'

const stages = {
  initial: { opacity: 0, scale: 0, top: 0, },
  enter: { opacity: 1, scale: 1, top: 50, },
  leave: { opacity: 0, scale: 0.6, top: 30, },
}

const styles = reactive(stages.initial)
const { set } = useSpring(styles, {
  damping: 8,
  stiffness: 200,
})

const open = ref(false)
watch(open, () => {
  if (open.value)
    set(stages.enter)
  else
    set(stages.leave)
})
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger>
      Edit profile
    </DialogTrigger>
    <DialogPortal v-if="styles.opacity !== 0">
      <DialogOverlay
        force-mount
        :style="{
          opacity: styles.opacity,
          transform: `scale(${styles.scale})`,
        }"
      />
      <DialogContent
        force-mount
        :style="{
          opacity: styles.opacity,
          top: `${styles.top}%`,
        }"
      >
        <h1>Hello from inside the Dialog!</h1>
        <DialogClose>Close</DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
```

<Callout type="tip">

Check out this [Stackblitz Demo](https://stackblitz.com/edit/macsaz-xuwbw3im?file=src%2FApp.vue)

</Callout>
