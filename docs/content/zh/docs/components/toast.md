---
title: Toast
description: 临时显示的简洁消息。
name: toast
aria: https://www.w3.org/TR/wai-aria/#aria-live
---

# Toast

<Description>
临时显示的简洁消息。
</Description>

<ComponentPreview name="Toast" />

<Highlights
  :features="[
    '自动关闭',
    '在悬停、焦点和窗口失焦时暂停关闭',
    '支持热键跳转到 toast 视口',
    '支持通过滑动手势关闭',
    '暴露滑动手势动画的 CSS 变量',
    '可以是受控的或非受控的',
  ]"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入组件。

```vue
<script setup lang="ts">
import { ToastAction, ToastClose, ToastDescription, ToastProvider, ToastRoot, ToastTitle, ToastViewport } from 'reka-ui'
</script>

<template>
  <ToastProvider>
    <ToastRoot>
      <ToastTitle />
      <ToastDescription />
      <ToastAction />
      <ToastClose />
    </ToastRoot>

    <ToastViewport />
  </ToastProvider>
</template>
```

## API 参考

### Provider

包装 toast 和 toast 视区的提供程序。它通常包着应用程序。

<!-- @include: @/zh/meta/ToastProvider.md -->

### Viewport

显示 toasts 的固定区域。用户可以通过按热键跳转到视区。由您来确保键盘用户可发现热键。

<!-- @include: @/zh/meta/ToastViewport.md -->

### Root

自动关闭的 toast。它不应保持打开状态以[获取用户响应](/zh/docs/components/toast#action)。

<PresenceCallout />

<!-- @include: @/zh/meta/ToastRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
    {
      attribute: '[data-swipe]',
      values: ['start', 'move', 'cancel', 'end'],
    },
    {
      attribute: '[data-swipe-direction]',
      values: ['up', 'down', 'left', 'right'],
    },
  ]"
/>

<CssVariablesTable
  :data="[
    {
      cssVariable: '--reka-toast-swipe-move-x',
      description: '水平滑动时 toast 的偏移位置',
    },
    {
      cssVariable: '--reka-toast-swipe-move-y',
      description: '垂直滑动时 toast 的偏移位置',
    },
    {
      cssVariable: '--reka-toast-swipe-end-x',
      description:
        '水平滑动后 toast 的偏移结束位置',
    },
    {
      cssVariable: '--reka-toast-swipe-end-y',
      description:
        '垂直滑动后 toast 的偏移结束位置',
    },
  ]"
/>

### Portal

使用时，将内容部分传送到 `body` 中。

<!-- @include: @/zh/meta/ToastPortal.md -->

### Title

toast 的可选标题。

<!-- @include: @/zh/meta/ToastTitle.md -->

### Description

toast 消息。

<!-- @include: @/zh/meta/ToastDescription.md -->

### Action

可以安全地忽略的动作，以确保用户不会因[时间限制](https://www.w3.org/TR/UNDERSTANDING-WCAG20/time-limits-required-behaviors.html)而完成具有意外副作用的任务。

当需要获取用户响应时，请改为将样式设置为 toast 的 [“AlertDialog”](/zh/docs/components/alert-dialog) 传送到视区中。

<!-- @include: @/zh/meta/ToastAction.md -->

### Close

一个按钮，允许用户在 toast 持续时间结束之前关闭 toast。

<!-- @include: @/zh/meta/ToastClose.md -->

## 示例

### 自定义热键

使用 [keycode.info](https://keycode.info/) 中每个键的 `event.code` 值覆盖默认热键。

```html line=3
<ToastProvider>
  ...
  <ToastViewport :hotkey="['altKey', 'KeyT']" />
</ToastProvider>
```

### 自定义持续时间

自定义 toast 的持续时间以覆盖 provider 值。

```vue line=1
<ToastRoot :duration="3000">
  <ToastDescription>Saved!</ToastDescription>
</ToastRoot>
```

### 重复的 Toast

如果每次用户单击按钮时都必须显示 Toast，请使用 state 渲染同一 Toast 的多个实例（请参阅下文）。或者，您可以抽象这些部分以创建自己的[命令式 API](/zh/docs/components/toast#imperative-api)。

```html line=2,7
<div>
  <form @submit="count++">
    ...
    <button>save</button>
  </form>

  <ToastRoot v-for="(_, index) in count" :key="index">
    <ToastDescription>Saved!</ToastDescription>
  </ToastRoot>
</div>
```

### 为滑动手势添加动画效果

将 `--reka-toast-swipe-move-[x|y]` 和 `--reka-toast-swipe-end-[x|y]` CSS 变量与 `data-swipe="[start|move|cancel|end]"` 属性结合使用，以动画形式呈现滑动关闭手势。下面是一个示例：

```html line=2
<ToastProvider swipeDirection="right">
  <ToastRoot class="ToastRoot">...</ToastRoot>
  <ToastViewport />
</ToastProvider>
```

```css line=2,3,5,9,15
/* styles.css */
.ToastRoot[data-swipe='move'] {
  transform: translateX(var(--reka-toast-swipe-move-x));
}
.ToastRoot[data-swipe='cancel'] {
  transform: translateX(0);
  transition: transform 200ms ease-out;
}
.ToastRoot[data-swipe='end'] {
  animation: slideRight 100ms ease-out;
}

@keyframes slideRight {
  from {
    transform: translateX(var(--reka-toast-swipe-end-x));
  }
  to {
    transform: translateX(100%);
  }
}
```

## 无障碍

遵守 [`aria-live` 要求](https://www.w3.org/TR/wai-aria/#aria-live)。

### 敏感度

使用 `type` 属性控制屏幕阅读器的 toast 的敏感度。

对于作为用户动作结果的 toast，请选择 `foreground`。从后台任务生成的 Toast 应使用 `background`。

#### 前台

前台 Toast 会立即声明。辅助技术可以选择在前台 toast 出现时清除以前排队的消息。尽量避免同时堆叠不同的前台 toast。

#### 后台

后台 toast 将在下一个优雅机会时声明，例如，当屏幕阅读器读完其当前句子时。它们不会清除排队的消息，因此在用于响应用户交互时，过度使用它们可能会被视为屏幕阅读器用户的用户体验滞后。

```html line=1,6
<ToastRoot type="foreground">
  <ToastDescription>File removed successfully.</ToastDescription>
  <ToastClose>Dismiss</ToastClose>
</ToastRoot>

<ToastRoot type="background">
  <ToastDescription>We've just released Radix 1.0.</ToastDescription>
  <ToastClose>Dismiss</ToastClose>
</ToastRoot>
```

### 替代动作

使用 `Action` 上的 `altText` 属性，指定以另一种方式向屏幕阅读器用户操作 Toast。

您可以将用户定向到应用程序中的永久位置，他们可以在其中操作它或实现您自己的自定义热键逻辑。如果实现后者，请使用 `foreground` 类型立即声明并增加持续时间以给用户充足的时间。

```html line=4,10,12
<ToastRoot type="background">
  <ToastTitle>Upgrade Available!</ToastTitle>
  <ToastDescription>We've just released Radix 1.0.</ToastDescription>
  <ToastAction altText="Goto account settings to upgrade">
    Upgrade
  </ToastAction>
  <ToastClose>Dismiss</ToastClose>
</ToastRoot>

<ToastRoot type="foreground" :duration="10000">
  <ToastDescription>File removed successfully.</ToastDescription>
  <ToastAction altText="Undo (Alt+U)">
    Undo <kbd>Alt</kbd>+<kbd>U</kbd>
  </ToastAction>
  <ToastClose>Dismiss</ToastClose>
</ToastRoot>
```

### 关闭图标按钮

提供图标（或字体图标）时，请记住为屏幕阅读器用户正确标记它。

```html line=3-4
<ToastRoot type="foreground">
  <ToastDescription>Saved!</ToastDescription>
  <ToastClose aria-label="Close">
    <span aria-hidden="true">×</span>
  </ToastClose>
</ToastRoot>
```

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['F8'],
      description: '聚焦 Toast 视口。',
    },
    {
      keys: ['Tab'],
      description: '将焦点移动到下一个可聚焦元素。',
    },
    {
      keys: ['Shift + Tab'],
      description: '将焦点移动到上一个可聚焦元素。',
    },
    {
      keys: ['Space'],
      description: `
        <span>
          当焦点位于<Code>ToastAction</Code>或<Code>ToastClose</Code>上时，关闭 Toast。
        </span>`
    },
    {
      keys: ['Enter'],
      description: `
        <span>
          当焦点位于<Code>ToastAction</Code>或<Code>ToastClose</Code>上时，关闭 Toast。
        </span>`
    },
    {
      keys: ['Esc'],
      description: `
        <span>
          当焦点位于<Code>Toast</Code>上时，关闭 Toast。
        </span> `
    },
  ]"
/>

## 自定义 API

### 抽象化部件

通过将原始部分抽象到自己的组件中创建你自己的 API。

#### 使用

```vue
<script setup lang="ts">
import Toast from './your-toast.vue'
</script>

<template>
  <Toast
    title="Upgrade available"
    content="We've just released Radix 3.0!"
  >
    <button @click="handleUpgrade">
      Upgrade
    </button>
  </Toast>
</template>
```

#### 实现

```vue
// your-toast.vue
<script setup lang="ts">
import { ToastAction, ToastClose, ToastDescription, ToastRoot, ToastTitle } from 'reka-ui'

defineProps<{
  title: string
  content: string
}>()
</script>

<template>
  <ToastRoot>
    <ToastTitle v-if="title">
      {{ title }}
    </ToastTitle>
    <ToastDescription>{{ content }}</ToastDescription>
    <ToastAction
      as-child
      alt-text="toast"
    >
      <slot />
    </ToastAction>
    <ToastClose aria-label="Close">
      <span aria-hidden="true">×</span>
    </ToastClose>
  </ToastRoot>
</template>
```

### 命令式 API

创建您自己的命令式 API，以允许 [toast 重复](/zh/docs/components/toast#duplicate-toasts)（如果愿意）。

#### 使用

```vue
<script setup lang="ts">
import Toast from './your-toast.vue'

const savedRef = ref<InstanceType<typeof Toast>>()
</script>

<template>
  <div>
    <form @submit="savedRef.publish()">
      ...
    </form>
    <Toast ref="savedRef">
      Saved successfully!
    </Toast>
  </div>
</template>
```

#### 实现

```vue
// your-toast.vue
<script setup lang="ts">
import { ToastClose, ToastDescription, ToastRoot, ToastTitle } from 'reka-ui'
import { ref } from 'vue'

const count = ref(0)

function publish() {
  count.value++
}

defineExpose({
  publish
})
</script>

<template>
  <ToastRoot
    v-for="index in count"
    :key="index"
  >
    <ToastDescription>
      <slot />
    </ToastDescription>
    <ToastClose>Dismiss</ToastClose>
  </ToastRoot>
</template>
```
