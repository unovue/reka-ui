---

title: 弹出面板
description: 在传送处显示由按钮触发的丰富内容。
name: popover
aria: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
---

# 弹出面板

<Description>
在传送处显示由按钮触发的丰富内容。
</Description>

<ComponentPreview name="Popover" />

## 特性

<Highlights
  :features="[
    '可以是受控的或非受控的',
    '自定义边、对齐方式、偏移量、冲突处理',
    '（可选）呈现指向箭头',
    '焦点完全可控和可定制',
    '支持模态和非模态模式',
    '取消和分层行为是高度可定制的',
  ]"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import { PopoverAnchor, PopoverArrow, PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger />
    <PopoverAnchor />
    <PopoverPortal>
      <PopoverContent>
        <PopoverClose />
        <PopoverArrow />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
```

## API 参考

### Root

包含弹出面板的所有部分。

<!-- @include: @/zh/meta/PopoverRoot.md -->

### Trigger

用于切换弹出框的按钮。默认情况下，`PopoverContent` 会将自身定位在触发器上。

<!-- @include: @/zh/meta/PopoverTrigger.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
  ]"
/>

### Anchor

用于定位 `PopoverContent` 的可选元素。如果未使用此部分，则内容将位于 `PopoverTrigger` 旁边。

<!-- @include: @/zh/meta/PopoverAnchor.md -->

### Portal

使用时，将内容部分传送到 `body` 中。

<!-- @include: @/zh/meta/PopoverPortal.md -->

### Content

弹出面板打开时弹出的组件。

<PresenceCallout />

<!-- @include: @/zh/meta/PopoverContent.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
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
      cssVariable: '--reka-popover-content-transform-origin',
      description: ' 根据内容和箭头位置/偏移量计算的<Code>transform-origin</Code>',
    },
    {
      cssVariable: '--reka-popover-content-available-width',
      description: '触发器和边界边缘之间的剩余宽度',
    },
    {
      cssVariable: '--reka-popover-content-available-height',
      description: '触发器和边界边缘之间的剩余高度',
    },
    {
      cssVariable: '--reka-popover-trigger-width',
      description: '触发器的宽度',
    },
    {
      cssVariable: '--reka-popover-trigger-height',
      description: '扳机的高度',
    },
  ]"
/>

### Arrow

一个可选的箭头元素，与弹出面板一起呈现。这可用于帮助直观地将锚点与 `PopoverContent` 链接。必须在 `PopoverContent` 中。

<!-- @include: @/zh/meta/PopoverArrow.md -->

### Close

关闭打开的弹出面板的按钮。

<!-- @include: @/zh/meta/PopoverClose.md -->

## 示例

### 限制内容的大小

您可能希望限制内容的宽度，使其与触发器宽度匹配。您可能还希望将其高度限制为不超过视口。

我们暴露了几个 CSS 自定义属性，例如 `--reka-popover-trigger-width` 和 `--reka-popover-content-available-height` 来支持这一点。使用它们来限制内容维度。

```vue line=10
// index.vue
<script setup>
import { PopoverArrow, PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger>…</PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        class="PopoverContent"
        :side-offset="5"
      >
        …
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
```

```css line=3,4
/* styles.css */
.PopoverContent {
  width: var(--reka-popover-trigger-width);
  max-height: var(--reka-popover-content-available-height);
}
```

### 原点感知（Origin-aware）动画

我们暴露了一个 CSS 自定义属性 `--reka-popover-content-transform-origin`。使用它可以根据 `side`、`sideOffset`、`align`、`alignOffset` 和任何碰撞从其计算的原点对内容进行动画处理。

```vue line=l10
// index.vue
<script setup>
import { PopoverArrow, PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger>…</PopoverTrigger>
    <PopoverPortal>
      <PopoverContent class="PopoverContent">
        …
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
```

```css line=3
/* styles.css */
.PopoverContent {
  transform-origin: var(--reka-popover-content-transform-origin);
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

```vue line=10
// index.vue
<script setup>
import { PopoverArrow, PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger>…</PopoverTrigger>
    <PopoverPortal>
      <PopoverContent class="PopoverContent">
        …
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
```

```css line=6-11
/* styles.css */
.PopoverContent {
  animation-duration: 0.6s;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}
.PopoverContent[data-side="top"] {
  animation-name: slideUp;
}
.PopoverContent[data-side="bottom"] {
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

### 自定义锚点

如果您不想将触发器用作锚点，则可以将内容锚定到另一个元素。

```vue line=8-12
// index.vue
<script setup>
import { PopoverAnchor, PopoverArrow, PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
</script>

<template>
  <PopoverRoot>
    <PopoverAnchor as-child>
      <div class="Row">
        Row as anchor <PopoverTrigger>Trigger</PopoverTrigger>
      </div>
    </PopoverAnchor>

    <PopoverPortal>
      <PopoverContent>…</PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
```

```css
/* styles.css */
.Row {
  background-color: gainsboro;
  padding: 20px;
}
```

## 无障碍

遵循[对话框 WAI-ARIA 设计模式](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['Space'],
      description: '打开/关闭弹出面板。',
    },
    {
      keys: ['Enter'],
      description: '打开/关闭弹出面板。',
    },
    {
      keys: ['Tab'],
      description: '将焦点移动到下一个可聚焦元素',
    },
    {
      keys: ['Shift + Tab'],
      description: '将焦点移动到上一个可聚焦元素',
    },
    {
      keys: ['Esc'],
      description: '<span>关闭弹出面板并将焦点移动到<code>PopoverTrigger</code></span>',
    },
  ]"
/>

## 自定义 API

通过将原始部分抽象到自己的组件中创建你自己的 API。

#### 抽象化箭头并设置默认配置

此示例抽象化了 `PopoverArrow` 部件并设置了默认的 `sideOffset` 配置。

#### 使用

```vue
<script setup lang="ts">
import { Popover, PopoverContent, PopoverTrigger } from './your-popover'
</script>

<template>
  <Popover>
    <PopoverTrigger>Popover trigger</PopoverTrigger>
    <PopoverContent>Popover content</PopoverContent>
  </Popover>
</template>
```

#### 实现

```ts
// your-popover.ts
export { default as PopoverContent } from 'PopoverContent.vue'

export { PopoverRoot as Popover, PopoverTrigger } from 'reka-ui'
```

```vue
<!-- PopoverContent.vue -->
<script setup lang="ts">
import { PopoverContent, type PopoverContentEmits, type PopoverContentProps, PopoverPortal, useForwardPropsEmits, } from 'reka-ui'

const props = defineProps<PopoverContentProps>()
const emits = defineEmits<PopoverContentEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <PopoverPortal>
    <PopoverContent v-bind="{ ...forwarded, ...$attrs }">
      <slot />
    </PopoverContent>
  </PopoverPortal>
</template>
```
