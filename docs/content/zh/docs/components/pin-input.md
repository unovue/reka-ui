---

title: Pin 输入
description: 单字符字母数字输入序列。
name: pin-input
---

# Pin 输入

<Description>
单字符字母数字输入序列。
</Description>

<ComponentPreview name="PinInput" />

## 特性

<Highlights
  :features="[
    '全键盘导航',
    '可以是受控的或非受控的',
    '支持从剪贴板粘贴',
    '当输入框被填充时触发事件'
  ]"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import { PinInputInput, PinInputRoot } from 'reka-ui'
</script>

<template>
  <PinInputRoot>
    <PinInputInput />
  </PinInputRoot>
</template>
```

## API 参考

### Root

包含 Pin 输入的所有部分。在 `form` 中使用时，`input` 也会渲染，以确保事件正确传播。

<!-- @include: @/zh/meta/PinInputRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-complete]',
      values: 'Present when completed',
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

### Input

Pin 输入的输入字段。您可以根据需要添加任意数量的输入。
<!-- @include: @/zh/meta/PinInputInput.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-complete]',
      values: 'Present when completed',
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

## 示例

### OTP 模式

您可以通过将 `otp` 设置为 `true` 来将 pin 输入设置为 otp 模式。

```vue{6}
<script setup lang="ts">
import { Label, PinInputInput, PinInputRoot } from 'reka-ui'
</script>

<template>
  <PinInputRoot v-model="value" otp>
    …
  </PinInputRoot>
</template>
```

### 数字模式

您可以通过将 `type` 设置为 `number` 来将 pin 输入设置为只接受 `number` 类型。

```vue{6}
<script setup lang="ts">
import { Label, PinInputInput, PinInputRoot } from 'reka-ui'
</script>

<template>
  <PinInputRoot v-model="value" type="number">
    …
  </PinInputRoot>
</template>
```

## 无障碍

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['ArrowLeft'],
      description: '聚焦于前一个输入框',
    },
    {
      keys: ['ArrowRight'],
      description: '聚焦于下一个输入框',
    },
    {
      keys: ['Home'],
      description: '聚焦于第一个输入框',
    },
    {
      keys: ['End'],
      description: '聚焦于最后一个输入框',
    },
    {
      keys: ['Backspace'],
      description: '删除当前输入框的值，如果当前输入框为空，移动到前一个并删除这个',
    },
    {
      keys: ['Delete'],
      description: '删除当前输入框的值',
    },
    {
      keys: ['Ctrl + V'],
      description: `
将剪贴板的内容粘贴到 pin 输入中。如果剪贴板中的字符数等于输入数，则从第一个输入开始粘贴内容。否则，将从当前输入开始粘贴内容。`,
    }
  ]"
/>
