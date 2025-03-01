---

title: 开始
description: 帮助您快速上手 Reka UI。
---

# 开始

<Description>
帮助您快速上手 Reka UI。
</Description>

## 实现 Popover

在这个快速教程中，我们将安装 [Popover](../components/popover) 组件并设置其样式。

### 1. 安装库

从命令行安装此组件

<InstallationTabs value="reka-ui" />

### 2. 导入部件

导入并搭建部件。

```vue twoslash
<!-- Popover.vue -->
<script setup lang="ts">
import { PopoverArrow, PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger>More info</PopoverTrigger>
    <PopoverPortal>
      <PopoverContent>
        Some more info...
        <PopoverClose />
        <PopoverArrow />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
```

### 3. 添加样式

在需要的地方添加样式。

```vue
<template>
  <PopoverRoot>
    <PopoverTrigger class="PopoverTrigger">
      More info
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent class="PopoverContent">
        Some more info...
        <PopoverClose />
        <PopoverArrow class="PopoverArrow" />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<style>
.PopoverTrigger {
  background-color: white;
  border-radius: 4px;
}

.PopoverContent {
  border-radius: 4px;
  padding: 20px;
  width: 260px;
  background-color: white;
}

.PopoverArrow {
  background-color: white;
}
</style>
```

### 演示

这是一个完整的演示。

<ComponentPreview name="Popover" />

## 总结

上述步骤简要概述了在应用程序中使用 Reka UI 所涉及的内容。

这些组件足够低级，可让您控制如何包装它们。您可以自由引入自己的高级 API，以更好地满足您的团队和产品的需求。

通过几个简单的步骤，我们已经实现了一个完全可访问的 Popover 组件，而不必担心它的许多复杂性。

- 遵循 [WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) 设计模式
- 可以是受控的或非受控的。
- 自定义边、对齐方式、偏移量、冲突处理。
- （可选）呈现指向箭头。
- 焦点完全可控和可定制的。
- 取消和分层行为是高度可定制的。
