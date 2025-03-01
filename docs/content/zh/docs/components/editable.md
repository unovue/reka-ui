---
title: 可编辑框
description: 显示用于编辑单行文本的输入字段，在加载时呈现为静态文本。当触发编辑交互时，它会转换为文本输入字段。
name: editable
---

# 可编辑框

<Description>
显示用于编辑单行文本的输入字段，在加载时呈现为静态文本。当触发编辑交互时，它会转换为文本输入字段。
</Description>

<ComponentPreview name="Editable" />

## 特性

<Highlights
  :features="[
    '全键盘导航',
    '可以是受控的或非受控的',
    '焦点完全可控'
  ]"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import {
  EditableArea,
  EditableCancelTrigger,
  EditableEditTrigger,
  EditableInput,
  EditablePreview,
  EditableRoot,
  EditableSubmitTrigger
} from 'reka-ui'
</script>

<template>
  <EditableRoot>
    <EditableArea>
      <EditablePreview />
      <EditableInput />
    </EditableArea>
    <EditableEditTrigger />
    <EditableSubmitTrigger />
    <EditableCancelTrigger />
  </EditableRoot>
</template>
```

## API 参考

### Root

包含可编辑组件的所有部分。

<!-- @include: @/zh/meta/EditableRoot.md -->

### Area

包含可编辑组件的文本部分。

<!-- @include: @/zh/meta/EditableArea.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-readonly]',
      values: '只读时存在',
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
    {
      attribute: '[data-placeholder-shown]',
      values: '显示预览时存在',
    },
    {
      attribute: '[data-empty]',
      values: '当输入为空时存在',
    },
    {
      attribute: '[data-focus]',
      values: '当可编辑字段获得焦点时显示。将被弃用，取而代之的是[data-focused]',
    },
    {
      attribute: '[data-focused]',
      values: '聚焦可编辑字段时显示',
    }
  ]"
/>

### Input

包含可编辑组件的输入。

<!-- @include: @/zh/meta/EditableInput.md -->

<DataAttributesTable
:data="[
  {
    attribute: '[data-readonly]',
    values: '只读时存在',
  },
  {
    attribute: '[data-disabled]',
    values: '禁用时存在',
  }
]"
/>

### Preview

包含可编辑组件的预览。

<!-- @include: @/zh/meta/EditablePreview.md -->

### Edit Trigger

包含可编辑组件的编辑触发器。

<!-- @include: @/zh/meta/EditableEditTrigger.md -->

### Submit Trigger

包含可编辑组件的提交触发器。

<!-- @include: @/zh/meta/EditableSubmitTrigger.md -->

### Cancel Trigger

包含可编辑组件的取消触发器。

<!-- @include: @/zh/meta/EditableCancelTrigger.md -->

## 示例

### 仅在提交时更改

默认情况下，组件将在 `blur` 事件触发时提交。我们可以修改 `submit-mode` 属性来改变这种行为。在这种情况下，我们只想在用户点击 `EditableSubmitTrigger` 时提交，因此我们将提交模式更改为 `none`。

```vue line=2,8
<template>
  <EditableRoot submit-mode="none">
    <EditableArea>
      <EditablePreview />
      <EditableInput />
    </EditableArea>
    <EditableEditTrigger />
    <EditableSubmitTrigger />
    <EditableCancelTrigger />
  </EditableRoot>
</template>
```

## 无障碍

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['Tab'],
      description: `<span>当焦点移动到可编辑字段时，如果<Code>activation-mode</Code>设置为<Code>focus</Code>，则切换到可编辑模式。</span>`
    },
    {
      keys: ['Enter'],
      description:`
      <span>
          如果<Code>submit-mode</Code>设置为<Code>enter</Code>或<Code>both</Code>，提交更改。
      </span>
    ` ,
    },
    {
      keys: ['Escape'],
      description:
      `
        当焦点在可编辑字段上时，它会取消更改。
      `
    }
  ]"
/>
