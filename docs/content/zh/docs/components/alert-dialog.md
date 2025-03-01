---
title: 警报对话框
description: 一个模态对话框，用重要内容打断用户并期望得到响应。
name: alert-dialog
aria: https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog
---

# 警报对话框

<Description>
一个模态对话框，用重要内容打断用户并期望得到响应。
</Description>

<ComponentPreview name="AlertDialog" />

## 特性

<Highlights
  :features="[
    '焦点自动被捕获。',
    '可以是受控的或非受控的',
    '使用<code>Title</code>和<code>Description</code>组件管理屏幕阅读器声明。',
    'Esc 可自动关闭该组件'
  ]"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup lang="ts">
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  AlertDialogTrigger,
} from 'reka-ui'
</script>

<template>
  <AlertDialogRoot>
    <AlertDialogTrigger />
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogContent>
        <AlertDialogTitle />
        <AlertDialogDescription />
        <AlertDialogCancel />
        <AlertDialogAction />
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
```

## API 参考

### Root

包含警报对话框的所有部分。

<!-- @include: @/zh/meta/AlertDialogRoot.md -->

### Trigger

打开对话框的按钮。

<!-- @include: @/zh/meta/AlertDialogTrigger.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    }
  ]"
/>

### Portal

使用时，将您的覆盖层和内容部分传送到<code>body</code>。

<!-- @include: @/zh/meta/AlertDialogPortal.md -->

### Overlay

当对话框打开时，覆盖视图中无效部分的一层。

<!-- @include: @/zh/meta/AlertDialogOverlay.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
      }
    ]"
/>

### Content

包含在对话框打开时要呈现的内容。

<!-- @include: @/zh/meta/AlertDialogContent.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    }
  ]"
/>

### Cancel

一个关闭对话框的按钮。此按钮应在视觉上与 `AlertDialogAction` 按钮区分开来。

<!-- @include: @/zh/meta/AlertDialogCancel.md -->

### Action

一个关闭对话框的按钮。此按钮应在视觉上与 `AlertDialogCancel` 区分开来。

<!-- @include: @/zh/meta/AlertDialogAction.md -->

### Title

当对话框打开时将声明的无障碍名称。或者，你可以向 `AlertDialogContent` 提供 `aria-label` 或 `aria-labelledby`，并摒弃此组件。

<!-- @include: @/zh/meta/AlertDialogTitle.md -->

### Description

当对话框打开时将声明的无障碍描述。或者，你可以向 `AlertDialogContent` 提供 `aria-describedby` ，并摒弃此组件。

<!-- @include: @/zh/meta/AlertDialogDescription.md -->

## 示例

### 异步表单提交后关闭

使用受控属性在异步操作完成后以编程方式关闭警告对话框。

```vue line=14,15,19,25-29
<script setup>
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  AlertDialogTrigger,
} from 'reka-ui'

const wait = () => new Promise(resolve => setTimeout(resolve, 1000))
const open = ref(false)
</script>

<template>
  <AlertDialogRoot v-model:open="open">
    <AlertDialogTrigger>Open</AlertDialogTrigger>
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogContent>
        <form
          @submit.prevent="
            (event) => {
              wait().then(() => open = false);
            }
          "
        >
          <!-- some inputs -->
          <button type="submit">
            Submit
          </button>
        </form>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
```

<br />

### 自定义 portal 容器

自定义你的警报对话框传送的元素。

```vue line=4,17
<script setup>
import { ref } from 'vue'

const container = ref(null)
</script>

<template>
  <div>
    <AlertDialogRoot>
      <AlertDialogTrigger />
      <AlertDialogPortal :to="container">
        <AlertDialogOverlay />
        <AlertDialogContent>...</AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialogRoot>

    <div ref="container" />
  </div>
</template>
```

## 无障碍

遵循[警报和消息对话框 WAI-ARIA 设计模式](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog).

### 键盘交互

<KeyboardTable :data="[{
keys: ['Space'],
description: '打开/关闭对话框。',
},{
keys: ['Enter'],
description: '打开/关闭对话框。',
},{
keys: ['Tab'],
description: '将焦点移动到下一个可聚焦元素。',
},{
keys: ['Shift + Tab'],
description: '将焦点移动到上一个可聚焦元素。',
},{
keys: ['Esc'],
description: '关闭对话框并将焦点移动到<code>AlertDialogTrigger</code>。',
}]" />
