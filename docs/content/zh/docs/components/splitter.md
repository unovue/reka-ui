---
title: 拆分器
description: 将布局划分为可调整大小的部分的组件。
name: splitter
aria: https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
---

# 拆分器

<Description>
将布局划分为可调整大小的部分的组件。
</Description>

<ComponentPreview name="Splitter" />

## 特性

<Highlights
  :features="[
    '支持键盘交互',
    '支持水平/垂直布局',
    '支持嵌套布局',
    '支持从右到左的方向（RTL）',
    '可以在另一个面板上调整大小',
    '可以有条件地装载'
  ]"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from 'reka-ui'
</script>

<template>
  <SplitterGroup>
    <SplitterPanel />
    <SplitterResizeHandle />
  </SplitterGroup>
</template>
```

## API 参考

### Group

包含拆分器的所有部分。

<!-- @include: @/zh/meta/SplitterGroup.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
    {
      attribute: '[data-state]',
      values: ['collapsed', 'expanded', 'Present when collapsbile'],
    },
  ]"
/>

### Panel

可折叠的部分。

<!-- @include: @/zh/meta/SplitterPanel.md -->

### Resize Handle

按住来调整大小。

<!-- @include: @/zh/meta/SplitterResizeHandle.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['drag', 'hover', 'inactive'],
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    }
  ]"
/>

## 示例

### 折叠

使用 `collapsible` 属性允许面板在达到 `minSize` 时折叠成 `collapsedSize`。

（`collapsedSize` 和 `minSize` 属性是必需的。）

```vue line=2
<template>
  <SplitterGroup>
    <SplitterPanel
      collapsible
      :collapsed-size="10"
      :min-size="35"
    >
      Panel A
    </SplitterPanel>
    <SplitterResizeHandle />
    <SplitterPanel>
      Panel B
    </SplitterPanel>
  </SplitterGroup>
</template>
```

### 持久保存在 localStorage 中

使用 `autoSaveId` 属性将布局数据保存到 `localStorage` 中。

```vue line=2
<template>
  <SplitterGroup auto-save-id="any-id">
    …
  </SplitterGroup>
</template>
```

### 使用 SSR 持久化布局

默认情况下，拆分器使用 `localStorage` 来持久化布局。使用服务器渲染时，当默认布局（在服务器上渲染）替换为持久布局（在 `localStorage` 中）时，这可能会导致闪烁。避免这种闪烁的方法是使用 cookie 持久化布局，如下所示：

```vue line=3,7,8,12
<!-- with Nuxt -->
<script setup lang="ts">
const layout = useCookie<number[]>('splitter:layout')
</script>

<template>
  <SplitterGroup
    direction="horizontal"
    @layout="layout = $event"
  >
    <SplitterPanel :default-size="layout[0]">
      …
    </SplitterPanel>
    <SplitterResizeHandle />
    <SplitterPanel :default-size="layout[1]">
      …
    </SplitterPanel>
  </SplitterGroup>
</template>
```

### 以程序方式折叠/展开

有时，面板需要调整大小或折叠/展开以响应用户作。`SplitterPanel` 公开了 `collapse` 和 `expand` 方法来实现此目的。

```vue line=2,7,14
<script setup lang="ts">
const panelRef = ref<InstanceType<typeof SplitterPanel>>()
</script>

<template>
  <button
    @click="panelRef?.isCollapsed ? panelRef?.expand() : panelRef?.collapse() "
  >
    {{ panelRef?.isCollapsed ? 'Expand' : 'Collapse' }}
  </button>

  <SplitterGroup>
    <SplitterPanel
      ref="panelRef"
      collapsible
      :collapsed-size="10"
      :min-size="35"
    >
      …
    </SplitterPanel>
    <SplitterResizeHandle />
    <SplitterPanel>
      …
    </SplitterPanel>
  </SplitterGroup>
</template>
```

### 自定义拖动把手

通过将任何元素传入插槽来自定义把手。

 ```vue line=6-8
<template>
   <SplitterGroup>
     <SplitterPanel>
       …
     </SplitterPanel>
     <SplitterResizeHandle>
       <Icon icon="radix-icons-drag-handle-dots-2" />
     </SplitterResizeHandle>
     <SplitterPanel>
       …
     </SplitterPanel>
   </SplitterGroup>
</template>
```

### SSR

拆分器组件严重依赖唯一 `id`，但是对于 Vue<3.4，我们没有可靠的方法来生成[SSR 友好的 `id`](https://github.com/vuejs/rfcs/discussions/557)。

因此，如果您使用的是 Nuxt 或其他 SSR 框架，则需要手动添加所有拆分器组件的 `id`。或者，您也可以用 `<ClientOnly>`.

```vue
<template>
  <SplitterGroup id="group-1">
    <SplitterPanel id="group-1-panel-1">
      …
    </SplitterPanel>
    <SplitterResizeHandle id="group-1-resize-1">
      <Icon icon="radix-icons-drag-handle-dots-2" />
    </SplitterResizeHandle>
    <SplitterPanel id="group-1-panel-2">
      …
    </SplitterPanel>
  </SplitterGroup>
</template>
```

## 无障碍

遵循 [Window Splitter WAI-ARIA 设计模式](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter)。

### 键盘交互

<KeyboardTable :data="[
    {
      keys: ['Enter'],
      description: '如果主窗格未折叠，则折叠窗格。如果窗格已折叠，则将拆分器恢复到其先前的位置。',
    },
    {
      keys: ['ArrowDown'],
      description: '向下移动水平拆分器。',
    },
    {
      keys: ['ArrowUp'],
      description: '向上移动水平拆分器。',
    },
    {
      keys: ['ArrowRight'],
      description: '将垂直拆分器向右移动。',
    },
    {
      keys: ['ArrowLeft'],
      description: '将垂直拆分器向左移动。',
    },
    {
      keys: ['Home'],
      description: '将拆分器移动到为主窗格提供最小允许大小的位置。',
    },
    {
      keys: ['End'],
      description: '将拆分器移动到为主窗格提供最大允许大小的位置。',
    }]" />
