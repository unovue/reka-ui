---

title: 数字字段
description: 数字字段允许用户输入一个数字，并使用步进按钮来增加或减少该值。
name: number field
aria: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton
---

# 数字字段

<Description>
数字字段允许用户输入一个数字，并使用步进按钮来增加或减少该值。
</Description>

<ComponentPreview name="NumberField" />

## 特性

<Highlights
  :features="[
    '全键盘导航',
    '可以是受控的或非受控的',
    '支持按钮按住和滚轮事件',
    '支持不同语言的编号系统',
    '可自定义格式'
  ]"
/>

## 安装

安装 number 包。

<InstallationTabs value="@internationalized/number" />

从命令行安装此组件

<InstallationTabs value="reka-ui" />

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import { NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldRoot } from 'reka-ui'
</script>

<template>
  <NumberFieldRoot>
    <NumberFieldDecrement />
    <NumberFieldInput />
    <NumberFieldIncrement />
  </NumberFieldRoot>
</template>
```

## API 参考

### Root

包含数字字段的所有部分。在 `form` 中使用时，`input` 也会渲染，以确保事件正确传播。

<!-- @include: @/zh/meta/NumberFieldRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

### Input

根据 `value` 和 `format` 选项呈现文本值的输入组件。

<!-- @include: @/zh/meta/NumberFieldInput.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

### Increment

增加值的按钮。

<!-- @include: @/zh/meta/NumberFieldIncrement.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-pressed]',
      values: 'Present when pressed',
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

### Decrement

减小值的按钮。

<!-- @include: @/zh/meta/NumberFieldDecrement.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-pressed]',
      values: 'Present when pressed',
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

## Example

### 十进制

支持 `Intl.NumberFormat` 支持的所有选项，包括最小和最大分数位数的配置、符号显示、分组分隔符等。

```vue line=3-7
<template>
  <NumberFieldRoot
    :default-value="5"
    :format-options="{
      signDisplay: 'exceptZero',
      minimumFractionDigits: 1,
    }"
  >
    …
  </NumberFieldRoot>
</template>
```

### 百分比

您可以将 `formatOptions.style` 设置为 `percent` 以将值视为百分比。您需要手动将步长设置为 0.01，以便在此模式下允许适当的步长。

```vue line=3-7
<template>
  <NumberFieldRoot
    :default-value="0.05"
    :step="0.01"
    :format-options="{
      style: 'percent',
    }"
  >
    …
  </NumberFieldRoot>
</template>
```

### 货币

您可以将 `formatOptions.style` 设置为 `currency`，以将该值视为货币值。还必须传递 `currency` 选项以设置货币代码（例如，CNY）。

如果您需要允许用户更改货币，则应在数字字段旁边包含一个单独的下拉列表。数字字段本身不会从用户输入中确定货币。

```vue line=4-9
<template>
  <NumberFieldRoot
    :default-value="5"
    :format-options="{
      style: 'currency',
      currency: 'EUR',
      currencyDisplay: 'code',
      currencySign: 'accounting',
    }"
  >
    …
  </NumberFieldRoot>
</template>
```

## 无障碍

遵循 [Spinbutton WAI-ARIA 设计模式](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton)。

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['Arrow Up'],
      description: '增加该值',
    },
    {
      keys: ['Arrow Down'],
      description: '减小该值',
    },
    {
      keys: ['Page Up'],
      description: '将值增加 10 次',
    },
    {
      keys: ['Page Down'],
      description: '将值减少 10 次',
    },
    {
      keys: ['Home'],
      description: '将值设置为最小值（如果提供了<code>min</code>）',
    },
    {
      keys: ['End'],
      description: '将值设置为最大值（如果提供了<code>max</code>）',
    },
  ]"
/>
