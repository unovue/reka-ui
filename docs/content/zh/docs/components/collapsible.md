---

title: 折叠面板
description: 一个可展开/折叠面板的交互式组件。
name: collapsible
aria: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure
---

# 折叠面板

<Description>
一个可展开/折叠面板的交互式组件。
</Description>

<ComponentPreview name="Collapsible" />

## 特性

<Highlights
  :features="[
    '全键盘导航',
    '可以是受控的或非受控的',
  ]"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui'
</script>

<template>
  <CollapsibleRoot>
    <CollapsibleTrigger />
    <CollapsibleContent />
  </CollapsibleRoot>
</template>
```

## API 参考

### Root

包含可折叠组件的所有部分。

<!-- @include: @/zh/meta/CollapsibleRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

### Trigger

切换可折叠部分的按钮。

<!-- @include: @/zh/meta/CollapsibleTrigger.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

### Content

包含可折叠内容的组件。

<PresenceCallout />

<!-- @include: @/zh/meta/CollapsibleContent.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

<CssVariablesTable
  :data="[
    {
      cssVariable: '--reka-collapsible-content-width',
      description: '内容打开/关闭时的宽度。',
    },
    {
      cssVariable: '--reka-collapsible-content-height',
      description: '内容打开/关闭时的高度。',
    },
  ]"
/>

## 示例

### 内容大小动画

使用 `--reka-collapsible-content-width` 和/或 `--reka-collapsible-content-height` CSS 变量在内容打开/关闭时为内容的大小设置动画。下面是一个示例：

```vue line=10
// index.vue
<script setup>
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui'
import './styles.css'
</script>

<template>
  <CollapsibleRoot>
    <CollapsibleTrigger>…</CollapsibleTrigger>
    <CollapsibleContent class="CollapsibleContent">
      …
    </CollapsibleContent>
  </CollapsibleRoot>
</template>
```

```css line=17,23
/* styles.css */
.CollapsibleContent {
  overflow: hidden;
}
.CollapsibleContent[data-state="open"] {
  animation: slideDown 300ms ease-out;
}
.CollapsibleContent[data-state="closed"] {
  animation: slideUp 300ms ease-out;
}

@keyframes slideDown {
  from {
    height: 0;
  }
  to {
    height: var(--reka-collapsible-content-height);
  }
}

@keyframes slideUp {
  from {
    height: var(--reka-collapsible-content-height);
  }
  to {
    height: 0;
  }
}
```

### 即使折叠也渲染内容

默认情况下，隐藏的内容将被移除，使用 `:unmountOnHide="false"` 可始终保持内容可用。

这也将允许浏览器搜索隐藏文本并打开可折叠部分。

```vue line=6
<script setup>
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui'
</script>

<template>
  <CollapsibleRoot :unmount-on-hide="false">
    …
  </CollapsibleRoot>
</template>
```

## 无障碍

遵循[折叠面板 WAI-ARIA 设计模式](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure).

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['Space'],
      description: '打开/关闭折叠面板',
    },
    {
      keys: ['Enter'],
      description: '打开/关闭折叠面板',
    },
  ]"
/>
