---
title: 工具提示
description: 当元素获得键盘焦点或鼠标悬停在元素上时，显示与元素相关的信息的弹出面板。
name: tooltip
aria: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip
---

# 工具提示

<Description>
当元素获得键盘焦点或鼠标悬停在元素上时，显示与元素相关的信息的弹出面板。
</Description>

<ComponentPreview name="Tooltip" />

## 特性

<Highlights
  :features="[
    'Provider，用于全局控制显示延迟',
    '当触发器聚焦或悬停时打开',
    '当触发器被激活或按 escape 时关闭',
    '支持自定义时间函数']"
/>

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup lang="ts">
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
</script>

<template>
  <TooltipProvider>
    <TooltipRoot>
      <TooltipTrigger />
      <TooltipPortal>
        <TooltipContent>
          <TooltipArrow />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
```

## API 参考

### Provider

包装您的应用程序以为您的工具提示提供全局功能。

<!-- @include: @/zh/meta/TooltipProvider.md -->

### Root

包含工具提示的所有部分。

<!-- @include: @/zh/meta/TooltipRoot.md -->

### Trigger

用于切换工具提示的按钮。默认情况下，`TooltipContent` 将自身定位在触发器上。

<!-- @include: @/zh/meta/TooltipTrigger.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['closed', 'delayed-open', 'instant-open'],
    },
  ]"
/>

### Portal

使用时，将内容部分传送到 `body` 中。

<!-- @include: @/zh/meta/TooltipPortal.md -->

### Content

工具提示打开时弹出的组件。

<PresenceCallout />

<!-- @include: @/zh/meta/TooltipContent.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['closed', 'delayed-open', 'instant-open'],
    },
    {
      attribute: '[data-side]',
      values: ['left', 'right', 'bottom', 'top'],
    },
    {
      attribute: '[data-align]',
      values: ['start', 'end', 'center'],
    },
  ]"
/>

<CssVariablesTable
  :data="[
    {
      cssVariable: '--reka-tooltip-content-transform-origin',
      description: ' 根据内容和箭头位置/偏移量计算的<Code>transform-origin</Code>',
    },
    {
      cssVariable: '--reka-tooltip-content-available-width',
      description: '触发器和边界边缘之间的剩余宽度',
    },
    {
      cssVariable: '--reka-tooltip-content-available-height',
      description: '触发器和边界边缘之间的剩余高度',
    },
    {
      cssVariable: '--reka-tooltip-trigger-width',
      description: '触发器的宽度',
    },
    {
      cssVariable: '--reka-tooltip-trigger-height',
      description: '扳机的高度',
    },
  ]"
/>

### Arrow

一个可选的箭头元素，用于与工具提示一起呈现。这可用于帮助直观地将触发器与 `TooltipContent` 链接起来。必须在 `TooltipContent` 中。

<!-- @include: @/zh/meta/TooltipArrow.md -->

## 示例

### 全局配置

使用 `Provider` 全局控制 `delayDuration` 和 `skipDelayDuration`。

```vue line=6
<script setup>
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
</script>

<template>
  <TooltipProvider
    :delay-duration="800"
    :skip-delay-duration="500"
  >
    <TooltipRoot>
      <TooltipTrigger>…</TooltipTrigger>
      <TooltipContent>…</TooltipContent>
    </TooltipRoot>
    <TooltipRoot>
      <TooltipTrigger>…</TooltipTrigger>
      <TooltipContent>…</TooltipContent>
    </TooltipRoot>
  </TooltipProvider>
</template>
```

### 立即显示

使用 `delayDuration` 属性来控制打开工具提示所需的时间。

```vue line=6
<script setup>
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
</script>

<template>
  <TooltipRoot :delay-duration="0">
    <TooltipTrigger>…</TooltipTrigger>
    <TooltipContent>…</TooltipContent>
  </TooltipRoot>
</template>
```

### 显示已禁用按钮的工具提示

由于禁用的按钮不会触发事件，因此您需要：

- 将 `Trigger` 渲染为 `span`。
- 确保 `button` 没有  `pointerEvents`。

```vue line=7-11
<script setup>
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
</script>

<template>
  <TooltipRoot>
    <TooltipTrigger as-child>
      <span tabindex="0">
        <button
          disabled
          style="{ pointerEvents: 'none' }"
        >…</button>
      </span>
    </TooltipTrigger>
    <TooltipContent>…</TooltipContent>
  </TooltipRoot>
</template>
```

### 限制内容的大小

您可能希望限制内容的宽度，使其与触发器宽度匹配。您可能还希望将其高度限制为不超过视口。

我们暴露了几个 CSS 自定义属性，例如 `--reka-tooltip-trigger-width` 和 `--reka-tooltip-content-available-height` 来支持这一点。使用它们来限制内容维度。

```vue line=10
 <!-- index.vue -->
<script setup>
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
</script>

<template>
  <TooltipRoot>
    <TooltipTrigger>…</TooltipTrigger>
    <TooltipPortal>
      <TooltipContent
        class="TooltipContent"
        :side-offset="5"
      >
        …
      </TooltipContent>
    </TooltipPortal>
  </TooltipRoot>
</template>
```

```css line=3,4
/* styles.css */
.TooltipContent {
  width: var(--reka-tooltip-trigger-width);
  max-height: var(--reka-tooltip-content-available-height);
}
```

### 原点感知（Origin-aware）动画

我们暴露了一个 CSS 自定义属性 `--reka-tooltip-content-transform-origin`。使用它可以根据 `side`、`sideOffset`、`align`、`alignOffset` 和任何碰撞从其计算的原点对内容进行动画处理。

```vue line=9
 <!-- index.vue -->
<script setup>
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
</script>

<template>
  <TooltipRoot>
    <TooltipTrigger>…</TooltipTrigger>
    <TooltipContent class="TooltipContent">
      …
    </TooltipContent>
  </TooltipRoot>
</template>
```

```css line=3-4
/* styles.css */
.TooltipContent {
  transform-origin: var(--reka-tooltip-content-transform-origin);
  animation: scaleIn 0.5s ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### 碰撞感知（Collision-aware）动画

我们暴露 `data-side` 和 `data-align` 属性。它们的值将在运行时更改以反映碰撞。使用它们创建碰撞和方向感知动画。

```vue line=9
 <!-- index.vue -->
<script setup>
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
</script>

<template>
  <TooltipRoot>
    <TooltipTrigger>…</TooltipTrigger>
    <TooltipContent class="TooltipContent">
      …
    </TooltipContent>
  </TooltipRoot>
</template>
```

```css line=6,9
/* styles.css */
.TooltipContent {
  animation-duration: 0.6s;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}
.TooltipContent[data-side="top"] {
  animation-name: slideUp;
}
.TooltipContent[data-side="bottom"] {
  animation-name: slideDown;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## 无障碍

### 键盘交互

<KeyboardTable
:data="[
{
keys: ['Tab'],
description: '立即打开/关闭工具提示。',
},
{
keys: ['Space'],
description: '如果打开，则立即关闭工具提示。',
},
{
keys: ['Enter'],
description: '如果打开，则立即关闭工具提示。',
},
{
keys: ['Escape'],
description: '如果打开，则立即关闭工具提示。',
},
]"
/>

## 自定义 API

通过将原始部分抽象到自己的组件中创建你自己的 API。

### 抽象部件并引入 content prop

此示例抽象了所有 `Tooltip` 部分，并引入了一个新的 `content` 属性。

#### 使用

```vue
<script setup lang="ts">
import { Tooltip } from './your-tooltip'
</script>

<template>
  <Tooltip content="Tooltip content">
    <button>Tooltip trigger</button>
  </Tooltip>
</template>
```

#### 实现

使用 [`asChild` 属性](/zh/docs/guides/composition)将触发器部分转换为可开槽区域。它会将触发器替换为传递给它的子组件。

```vue line=13-15
<!-- your-tooltip.vue  -->
<script setup lang="ts">
import { TooltipArrow, TooltipContent, TooltipRoot, type TooltipRootEmits, type TooltipRootProps, TooltipTrigger, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<TooltipRootProps & { content?: string }>()
const emits = defineEmits<TooltipRootEmits>()

const forward = useForwardPropsEmits(props, emits)
</script>

<template>
  <TooltipRoot v-bind="forward">
    <TooltipTrigger as-child>
      <slot />
    </TooltipTrigger>
    <TooltipContent
      side="top"
      align="center"
    >
      {{ content }}
      <TooltipArrow
        :width="11"
        :height="5"
      />
    </TooltipContent>
  </TooltipRoot>
</template>
```
