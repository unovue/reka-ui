---
title: 动画/过渡
description: 使用 CSS 关键帧、原生 Vue 过渡或您选择的 JavaScript 动画库为 Reka UI 制作动画。
---

# 动画

<Description>
使用 CSS 关键帧、原生 Vue 过渡或您选择的 JavaScript 动画库为 Reka UI 制作动画。
</Description>

向 Reka UI 添加动画感觉应该与任何其他组件类似，但这里有一些一些关于使用 JS 动画库退出动画的注意事项。

## 使用 CSS 动画制作动画

为 Primitives 制作动画的最简单方法是使用 CSS。

您可以使用 CSS 动画为装载和卸载阶段添加动画效果。后者是可能的，因为 Reka UI 将在动画播放时暂停卸载。

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

## 使用 Vue Transition 制作动画

除了使用 CSS 动画之外，您可能更喜欢使用原生的 Vue `<Transition>`。好消息！它应该像包装组件（具有 `forceMount` 属性）一样简单，然后你就完成了！

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

## ⭐️ 使用 Motion Vue 制作动画

[Motion Vue](https://motion.unovue.com/) 是 Reka UI 的推荐动画库。这个轻量级、强大的库与组件无缝集成，并为创建流畅、高性能的动画提供了广泛的灵活性。

```vue line=3,12,14-18,22-26,29,31
<script setup lang="ts">
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger, } from 'reka-ui'
import { AnimatePresence, Motion } from 'motion-v'
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

看看这个 [Stackblitz 演示](https://stackblitz.com/edit/x7y44ngl?file=src%2FApp.vue) 🤩

</Callout>

## 委派 JavaScript 动画的卸载

当许多有状态的 Primitive 被隐藏在视图中时，它们实际上会从 DOM 中删除。JavaScript 动画库需要控制卸载阶段，因此我们在许多组件上提供了 `forceMount` 属性，以允许用户根据这些库确定的动画状态来委托子级的挂载和卸载。

例如，如果您想使用 [@vueuse/motion](https://motion.vueuse.org/) 为 `Dialog` 添加动画效果，则可以根据对话框的组合式函数之一（如 `useSpring`）的动画状态有条件地渲染对话框的 `Overlay` 和 `Content` 部件：

```vue line=32,34,41
<script setup lang="ts">
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger, } from 'reka-ui'
import { reactive, ref, watch } from 'vue'
import { useSpring } from '@vueuse/motion'

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

看看这个[Stackblitz 演示](https://stackblitz.com/edit/macsaz-xuwbw3im?file=src%2FApp.vue)

</Callout>
