---
title: 手风琴面板
description: 一组垂直堆叠的交互式标题，每个标题显示一个相关的内容部分。
name: accordion
aria: https://www.w3.org/WAI/ARIA/apg/patterns/accordion
---

# 手风琴面板

<Description>
一组垂直堆叠的交互式标题，每个标题显示一个相关的内容部分。
</Description>

<ComponentPreview name="Accordion" />

## 特性

<Highlights
  :features="[
    '全键盘导航',
    '支持水平/垂直方向',
    '支持从右到左的方向（RTL）',
    '可以展开一个或多个项。',
    '可以是受控的或非受控的'
  ]"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from 'reka-ui'
</script>

<template>
  <AccordionRoot>
    <AccordionItem>
      <AccordionHeader>
        <AccordionTrigger />
      </AccordionHeader>
      <AccordionContent />
    </AccordionItem>
  </AccordionRoot>
</template>
```

## API 参考

### Root

包含手风琴面板的所有部分

<!-- @include: @/zh/meta/AccordionRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
  }]"
/>

### Item

包含可折叠部分的所有部分。

<!-- @include: @/zh/meta/AccordionItem.md -->

<DataAttributesTable :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    }]" />

### Header

包一个 `AccordionTrigger`。使用 `asChild` 属性将其更新到您页面的适当标题级别。

<!-- @include: @/zh/meta/AccordionHeader.md -->

<DataAttributesTable :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    }]" />

### Trigger

切换与其关联项的折叠状态。它应嵌套在一个 `AccordionHeader` 内部。

<!-- @include: @/zh/meta/AccordionTrigger.md -->

<DataAttributesTable :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    }]" />

### Content

包含一个 Item 的可折叠内容。

<!-- @include: @/zh/meta/AccordionContent.md -->

<DataAttributesTable :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    }]" />

<CssVariablesTable :data="[
    {
      cssVariable: '--reka-accordion-content-width',
      description: 'The width of the content when it opens/closes',
    },
    {
      cssVariable: '--reka-accordion-content-height',
      description: 'The height of the content when it opens/closes',
    }]"
/>

## 示例

### 默认展开

使用 `defaultValue` 属性来定义默认打开的项。

```vue line=2
<template>
  <AccordionRoot
    type="single"
    default-value="item-2"
  >
    <AccordionItem value="item-1">
      …
    </AccordionItem>
    <AccordionItem value="item-2">
      …
    </AccordionItem>
  </AccordionRoot>
</template>
```

### 允许折叠所有项

使用 `collapsible` 属性允许所有项关闭。

```vue line=2
<template>
  <AccordionRoot
    type="single"
    collapsible
  >
    <AccordionItem value="item-1">
      …
    </AccordionItem>
    <AccordionItem value="item-2">
      …
    </AccordionItem>
  </AccordionRoot>
</template>
```

### 多个项同时打开

将 `type` 属性设置为 `multiple` 以启用一次打开多个项。

```vue line=2
<template>
  <AccordionRoot type="multiple">
    <AccordionItem value="item-1">
      …
    </AccordionItem>
    <AccordionItem value="item-2">
      …
    </AccordionItem>
  </AccordionRoot>
</template>
```

### 打开时旋转图标

您可以添加额外的装饰元素，例如箭头，并在物品打开时旋转它。

```vue line=14
// index.vue
<script setup>
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from 'reka-ui'
import { Icon } from '@iconify/vue'
import './styles.css'
</script>

<template>
  <AccordionRoot type="single">
    <AccordionItem value="item-1">
      <AccordionHeader>
        <AccordionTrigger class="AccordionTrigger">
          <span>Trigger text</span>
          <Icon
            icon="radix-icons:chevron-down"
            class="AccordionChevron"
          />
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionContent>…</AccordionContent>
    </AccordionItem>
  </AccordionRoot>
</template>
```

```css line=5-7
/* styles.css */
.AccordionChevron {
  transition: transform 300ms;
}
.AccordionTrigger[data-state="open"] > .AccordionChevron {
  transform: rotate(180deg);
}
```

### 横向

使用 `orientation` 属性创建横向手风琴面板

```vue line=2
<template>
  <AccordionRoot orientation="horizontal">
    <AccordionItem value="item-1">
      …
    </AccordionItem>
    <AccordionItem value="item-2">
      …
    </AccordionItem>
  </AccordionRoot>
</template>
```

### 内容大小动画

使用 `--reka-accordion-content-width` 和/或 `--reka-accordion-content-height` CSS变量来设置内容打开/关闭时的动画大小：

```vue line=11
// index.vue
<script setup>
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from 'reka-ui'
import './styles.css'
</script>

<template>
  <AccordionRoot type="single">
    <AccordionItem value="item-1">
      <AccordionHeader>…</AccordionHeader>
      <AccordionContent class="AccordionContent">
        …
      </AccordionContent>
    </AccordionItem>
  </AccordionRoot>
</template>
```

```css line=17,23
/* styles.css */
.AccordionContent {
  overflow: hidden;
}
.AccordionContent[data-state="open"] {
  animation: slideDown 300ms ease-out;
}
.AccordionContent[data-state="closed"] {
  animation: slideUp 300ms ease-out;
}

@keyframes slideDown {
  from {
    height: 0;
  }
  to {
    height: var(--reka-accordion-content-height);
  }
}

@keyframes slideUp {
  from {
    height: var(--reka-accordion-content-height);
  }
  to {
    height: 0;
  }
}
```

### 即使关闭也能渲染内容

默认情况下，隐藏的内容将被删除，使用 `:unmountOnHide="false"` 以保持内容始终可用。

这也将允许浏览器搜索隐藏的文本，并打开手风琴面板。

```vue line=2
<template>
  <AccordionRoot :unmount-on-hide="false">
    <AccordionItem value="item-1">
      …
    </AccordionItem>
    <AccordionItem value="item-2">
      …
    </AccordionItem>
  </AccordionRoot>
</template>
```

## 无障碍

遵循[手风琴面板 WAI-ARIA 设计模式](https://www.w3.org/WAI/ARIA/apg/patterns/accordion)。

### 键盘交互

<KeyboardTable :data="[
    {
      keys: ['Space'],
      description: '当焦点在折叠部分的<code>AccordionTrigger</code>上时，展开该部分。',
    },
    {
      keys: ['Enter'],
      description: '当焦点在折叠部分的<code>AccordionTrigger</code>上时，展开该部分。',
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
      keys: ['ArrowDown'],
      description: '当<code>orientation</code>是<code>vertical</code>时，将焦点移动到下一个<code>AccordionTrigger</code>。',
    },
    {
      keys: ['ArrowUp'],
      description: '当<code>orientation</code>为<code>vertical</code>时，将焦点移动到上一个<code>AccordionTrigger</code>。',
    },
    {
      keys: ['ArrowRight'],
      description: '当<code>orientation</code>为<code>horizontal</code>时，将焦点移动到下一个<code>AccordionTrigger</code>。',
    },
    {
      keys: ['ArrowLeft'],
      description: '当<code>orientation</code>为<code>horizontal</code>时，将焦点移动到上一个<code>AccordionTrigger</code>。',
    },
    {
      keys: ['Home'],
      description: '当焦点在<code>AccordionTrigger</code>上时，将焦点移动到起始<code>AccordionTrigger</code>。',
    },
    {
      keys: ['End'],
      description: '当焦点在<code>AccordionTrigger</code>上时，将焦点移动到最后一个<code>AccordionTrigger</code>。',
    }]" />
