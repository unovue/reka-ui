---

title: 设置样式
description: Reka UI 是无样式的，并且与任何样式解决方案兼容，让您可以完全控制样式。
---

# 设置样式

<Description>
Reka UI 是无样式的，并且与任何样式解决方案兼容，让您可以完全控制样式。
</Description>

## 样式概述

### 功能样式

您可以控制样式的所有方面，包括功能样式。例如，默认情况下，[Dialog Overlay](../components/dialog)不会覆盖整个视区。您负责添加这些样式以及任何演示样式。

### 类

所有组件都接受 `class` 属性，就像普通组件一样。这个类将被传递给 DOM 元素。您可以按预期在 CSS 中使用它。

#### 传送元素

某些元素（如 modal 或 popover）被传送到 `body` 中。使用范围样式应用 CSS 时，您需要使用[深度选择器](https://cn.vuejs.org/api/sfc-css-features.html#deep-selectors)来定位它们。

### Data attributes 数据属性

当组件是有状态的时，它们的状态将在 `data-state` 属性中公开。例如，当打开[Accordion Item 折叠项](../components/accordion)时，它包括一个 `data-state="open"` 属性。

## 使用 CSS 设置样式

### 设置部件样式

您可以通过定位您提供的 `class` 来设置组件部件的样式。

```vue{7}
<script setup lang="ts">
import { AccordionRoot, AccordionItem, ... } from "reka-ui";
</script>

<template>
  <AccordionRoot>
    <AccordionItem class="AccordionItem" value="item-1" />
    <!-- ... -->
  </AccordionRoot>
</template>

<style>
.AccordionItem {
  /* ... */
}
</style>
```

### 设置状态的样式

您可以通过指定组件 `data-state` 属性来设置组件状态的样式。

```css
.AccordionItem {
  border-bottom: 1px solid gainsboro;
}

.AccordionItem[data-state="open"] {
  border-bottom-width: 2px;
}
```

### 作用域（scoped）样式

您可以使用作用域样式设置组件的样式。注意传送元素，因为它们需要使用[深度选择器](https://cn.vuejs.org/api/sfc-css-features.html#deep-selectors)才能成为目标。

```vue{7}
<script setup lang="ts">
import { DropdownMenuRoot, DropdownMenuItem, ... } from "reka-ui";
</script>

<template>
  <DropdownMenuRoot>
    <!-- ... -->
    <DropdownMenuPortal>
      <DropdownMenuContent class="DropdownMenuContent">
        <DropdownMenuItem class="DropdownMenuItem">An item</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<style scoped>
:deep(.DropdownMenuContent) {
  /* ... */
}

.DropdownMenuItem {
  /* ... */
}
</style>
```

## 使用 Tailwind CSS 设置样式

下面的示例使用的是 [Tailwind CSS](https://tailwindcss.com/)，但你可以使用你选择的任何库。

### 设置部件样式

您可以通过指定 `class` 来设置组件部件的样式。

```vue{7}
<script setup lang="ts">
import { AccordionRoot, AccordionItem, ... } from "reka-ui";
</script>

<template>
  <AccordionRoot>
    <AccordionItem class="border border-gray-400 rounded-2xl" value="item-1" />
    <!-- ... -->
  </AccordionRoot>
</template>
```

### 设置状态的样式

使用 Tailwind CSS 强大的变体选择器，您可以通过定位组件 `data-state` 属性来设置组件状态的样式。

```vue{10}
<script setup lang="ts">
import { AccordionRoot, AccordionItem, ... } from "reka-ui";
</script>

<template>
  <AccordionRoot>
    <AccordionItem
      class="
        border border-gray-400 rounded-2xl
        data-[state=open]:border-b-2 data-[state=open]:border-gray-800
      "
      value="item-1"
    />
    <!-- ... -->
  </AccordionRoot>
</template>
```

## 扩展 primitive

扩展 primitive 的方式与扩展任何 Vue 组件的方式相同。

```vue[CustomAccordion.vue]
<script setup lang="ts">
import { AccordionItem, type AccordionItemProps } from "reka-ui";

interface Props extends AccordionItemProps {
  foo: string;
}

defineProps<Props>();
</script>

<template>
  <AccordionItem v-bind="$props"><slot /></AccordionItem>
</template>
```

## 总结

Reka UI 旨在封装辅助功能问题和其他复杂功能，同时确保您保留对样式的完全控制。

为方便起见，有状态组件包括 `data-state` 属性。
