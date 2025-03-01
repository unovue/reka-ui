---

title: 悬停卡片
description: 供视力正常的用户预览链接后面可用的内容。
name: hover-card
---

# 悬停卡片

<Description>
供视力正常的用户预览链接后面可用的内容。
</Description>

<ComponentPreview name="HoverCard" />

## 特性

<Highlights
  :features="[
    '可以是受控的或非受控的',
    '自定义边、对齐方式、偏移量、冲突处理',
    '（可选）渲染指向箭头',
    '支持自定义打开和关闭延迟',
    '被屏幕阅读器忽略',
  ]"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import { HoverCardArrow, HoverCardContent, HoverCardPortal, HoverCardRoot, HoverCardTrigger } from 'reka-ui'
</script>

<template>
  <HoverCardRoot>
    <HoverCardTrigger />
    <HoverCardPortal>
      <HoverCardContent>
        <HoverCardArrow />
      </HoverCardContent>
    </HoverCardPortal>
  </HoverCardRoot>
</template>
```

## API 参考

### Root

包含悬停卡片的所有部分。

<!-- @include: @/zh/meta/HoverCardRoot.md -->

### Trigger

悬停时打开悬停卡片的链接。

<!-- @include: @/zh/meta/HoverCardTrigger.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
  ]"
/>

### Portal

使用时，将内容部分传送到 `body` 中。

<!-- @include: @/zh/meta/HoverCardPortal.md -->

### Content

悬停卡片打开时弹出的组件。

<PresenceCallout />

<!-- @include: @/zh/meta/HoverCardContent.md -->

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
      cssVariable: '--reka-hover-card-content-transform-origin',
      description: '根据内容和箭头位置/偏移量计算的<Code>transform-origin</Code>',
    },
    {
      cssVariable: '--reka-hover-card-content-available-width',
      description: '触发器和边界边缘之间的剩余宽度',
    },
    {
      cssVariable: '--reka-hover-card-content-available-height',
      description: '触发器和边界边缘之间的剩余高度',
    },
    {
      cssVariable: '--reka-hover-card-trigger-width',
      description: '触发器的宽度',
    },
    {
      cssVariable: '--reka-hover-card-trigger-height',
      description: '扳机的高度',
    },
  ]"
/>

### Arrow

一个可选的箭头元素，与悬停卡片一起呈现。这可用于帮助视觉上将触发器与 `HoverCardContent` 链接起来。必须在 `HoverCardContent` 中。

<!-- @include: @/zh/meta/HoverCardArrow.md -->

## 示例

### 立即显示

使用 `openDelay` 属性来控制悬停卡打开所需的时间。

```vue line=12
<script setup>
import {
  HoverCardArrow,
  HoverCardContent,
  HoverCardPortal,
  HoverCardRoot,
  HoverCardTrigger,
} from 'reka-ui'
</script>

<template>
  <HoverCardRoot :open-delay="0">
    <HoverCardTrigger>…</HoverCardTrigger>
    <HoverCardContent>…</HoverCardContent>
  </HoverCardRoot>
</template>
````

### 限制内容的大小

您可能希望限制内容的宽度，使其与触发器宽度匹配。您可能还希望将其高度限制为不超过视口。

我们暴露了几个 CSS 自定义属性，例如 `--reka-hover-card-trigger-width` 和 `--reka-hover-card-content-available-height` 来支持这一点。使用它们来限制内容维度。

```vue line=10
// index.vue
<script setup>
import { HoverCardArrow, HoverCardContent, HoverCardPortal, HoverCardRoot, HoverCardTrigger } from 'reka-ui'
</script>

<template>
  <HoverCardRoot>
    <HoverCardTrigger>…</HoverCardTrigger>
    <HoverCardPortal>
      <HoverCardContent
        class="HoverCardContent"
        :side-offset="5"
      >
        …
      </HoverCardContent>
    </HoverCardPortal>
  </HoverCardRoot>
</template>
```

```css line=3-4
/* styles.css */
.HoverCardContent {
  width: var(--reka-hover-card-trigger-width);
  max-height: var(--reka-hover-card-content-available-height);
}
```

### 原点感知（Origin-aware）动画

我们暴露了一个 CSS 自定义属性 `--reka-hover-card-content-transform-origin`。使用它可以根据 `side`、`sideOffset`、`align`、`alignOffset` 和任何碰撞从其计算的原点对内容进行动画处理。

```vue line=9
// index.vue
<script setup>
import { HoverCardArrow, HoverCardContent, HoverCardPortal, HoverCardRoot, HoverCardTrigger } from 'reka-ui'
</script>

<template>
  <HoverCardRoot>
    <HoverCardTrigger>…</HoverCardTrigger>
    <HoverCardContent class="HoverCardContent">
      …
    </HoverCardContent>
  </HoverCardRoot>
</template>
```

```css line=3
/* styles.css */
.HoverCardContent {
  transform-origin: var(--reka-hover-card-content-transform-origin);
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
// index.vue
<script setup>
import { HoverCardArrow, HoverCardContent, HoverCardPortal, HoverCardRoot, HoverCardTrigger } from 'reka-ui'
</script>

<template>
  <HoverCardRoot>
    <HoverCardTrigger>…</HoverCardTrigger>
    <HoverCardContent class="HoverCardContent">
      …
    </HoverCardContent>
  </HoverCardRoot>
</template>
```

```css line=6-11
/* styles.css */
.HoverCardContent {
  animation-duration: 0.6s;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}
.HoverCardContent[data-side="top"] {
  animation-name: slideUp;
}
.HoverCardContent[data-side="bottom"] {
  animation-name: slideDown;
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
```

## 无障碍

悬停卡片仅供视力正常的用户使用，键盘用户无法访问内容。

### 键盘交互

<KeyboardTable :data="[
    {
      keys: ['Tab'],
      description: '打开/关闭悬停卡片。',
    },
    {
      keys: ['Enter'],
      description: '打开悬停卡片链接',
    }]" />
