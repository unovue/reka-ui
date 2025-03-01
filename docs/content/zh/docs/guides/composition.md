---

title: 组合
description: 使用 `asChild` 属性将 Reka 的功能组合到替代元素类型或你自己的 Vue 组件上。
---

# 组合

<Description>
使用 `asChild` 属性将 Reka 的功能组合到替代元素类型或你自己的 Vue 组件上。
</Description>

所有渲染 DOM 元素的 Reka UI 部件都接受 `asChild` 属性。当 `asChild` 设置为 `true` 时，Reka UI 将不会渲染默认的 DOM 元素，而是将使其正常运行所需的 props 和行为传递给插槽的第一个子元素。

## 更改元素类型

在大多数情况下，您不需要修改元素类型，因为 Reka 旨在提供最合适的默认值。但是，在某些情况下，这样做会有所帮助。

`TooltipTrigger` 就是一个很好的示例。默认情况下，此部分呈现为 `button`，但你可能还希望向链接（`a` 标签）添加工具提示。让我们看看如何使用 `asChild` 来实现这一点：

```vue{7}
<script setup lang="ts">
import { TooltipRoot, TooltipTrigger, TooltipPortal } from "reka-ui";
</script>

<template>
  <TooltipRoot>
    <TooltipTrigger asChild>
      <a href="https://reka-ui.com/">Reka UI</a>
    </TooltipTrigger>
    <TooltipPortal>…</TooltipPortal>
  </TooltipRoot>
</template>
```

> 如果您决定更改基础元素类型，则您有责任确保其保持可访问性和功能。例如，在 `TooltipTrigger` 的情况下，它必须是可以响应指针和键盘事件的可聚焦元素。如果您将其切换到 `div`，则将丢失无障碍特性。

实际上，您很少会像上面看到的那样修改底层 DOM 元素。相反，使用你自己的 Vue 组件更常见。对于大多数 `Trigger` 部件来说尤其如此，因为您通常希望使用设计系统中的自定义按钮和链接来组合功能。

## 使用你自己的 Vue 组件进行组合

这与上面的工作原理完全相同，您将 `asChild` 传递给该部分，然后用它来包装您自己的组件。但是，有一些问题需要注意。

## 组合多个 Primitives

`asChild` 可以根据需要深入使用。这意味着它是将多个 primitive 的行为组合在一起的好方法。下面是如何将 `TooltipTrigger` 和 `DialogTrigger` 与你自己的按钮组合在一起的示例：

```vue{9,10}
<script setup lang="ts">
import { TooltipRoot, TooltipTrigger, TooltipPortal, DialogRoot, DialogTrigger, DialogPortal } from "reka-ui";
import MyButton from from "@/components/MyButton.vue"
</script>

<template>
  <DialogRoot>
    <TooltipRoot>
      <TooltipTrigger asChild>
        <DialogTrigger asChild>
          <MyButton>Open dialog</MyButton>
        </DialogTrigger>
      </TooltipTrigger>
      <TooltipPortal>…</TooltipPortal>
    </TooltipRoot>

    <DialogPortal>...</DialogPortal>
  </DialogRoot>
</template>
```
