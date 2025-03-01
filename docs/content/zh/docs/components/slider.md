---

title: 滑块
description: 用户从给定范围内选择一个值的输入。
name: slider
aria: https://www.w3.org/WAI/ARIA/apg/patterns/slidertwothumb
---

# 滑块

<Description>
用户从给定范围内选择一个值的输入。
</Description>

<ComponentPreview name="Slider" />

## 特性

<Highlights
  :features="[
    '可以是受控的或非受控的',
    '支持多个滑块滑钮',
    '支持滑块之间的最小值',
    '支持触摸或单击轨道以更新值',
    '支持从右到左的方向（RTL）',
    '全键盘导航',
  ]"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'
</script>

<template>
  <SliderRoot>
    <SliderTrack>
      <SliderRange />
    </SliderTrack>
    <SliderThumb />
  </SliderRoot>
</template>
```

## API 参考

### Root

包含滑块的所有部分。在 `form` 中使用时，它将为每个滑钮呈现一个 `input`，以确保事件正确传播。

<!-- @include: @/zh/meta/SliderRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Track

包含 `SliderRange` 的轨道。

<!-- @include: @/zh/meta/SliderTrack.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Range

范围部分。必须位于 `SliderTrack` 中。

<!-- @include: @/zh/meta/SliderRange.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Thumb

一个可拖动的滑钮。您可以渲染多个滑钮。

<!-- @include: @/zh/meta/SliderThumb.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

## 示例

### 垂直方向

使用 `orientation` 属性创建一个垂直滑块。

```vue line=7
// index.vue
<script setup>
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'
</script>

<template>
  <SliderRoot
    class="SliderRoot"
    :default-value="[50]"
    orientation="vertical"
  >
    <SliderTrack class="SliderTrack">
      <SliderRange class="SliderRange" />
    </SliderTrack>
    <SliderThumb class="SliderThumb" />
  </SliderRoot>
</template>
```

```css line=7,18,26
/* styles.css */
.SliderRoot {
  position: relative;
  display: flex;
  align-items: center;
}
.SliderRoot[data-orientation="vertical"] {
  flex-direction: column;
  width: 20px;
  height: 100px;
}

.SliderTrack {
  position: relative;
  flex-grow: 1;
  background-color: grey;
}
.SliderTrack[data-orientation="vertical"] {
  width: 3px;
}

.SliderRange {
  position: absolute;
  background-color: black;
}
.SliderRange[data-orientation="vertical"] {
  width: 100%;
}

.SliderThumb {
  display: block;
  width: 20px;
  height: 20px;
  background-color: black;
}
```

### 创建范围滑块

添加多个滑钮和值以创建范围滑块。

```vue line=7,11-12
// index.vue
<script setup>
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'
</script>

<template>
  <SliderRoot :default-value="[25, 75]">
    <SliderTrack>
      <SliderRange />
    </SliderTrack>
    <SliderThumb />
    <SliderThumb />
  </SliderRoot>
</template>
```

### 定义步长

使用 `step` 属性来定义步长。

```vue line=7
// index.vue
<script setup>
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'
</script>

<template>
  <SliderRoot
    :default-value="[50]"
    :step="10"
  >
    <SliderTrack>
      <SliderRange />
    </SliderTrack>
    <SliderThumb />
  </SliderRoot>
</template>
```

### 防止滑钮重叠

使用 `minStepsBetweenThumbs` 可避免使用值相等的滑钮。

```vue line=10
// index.vue
<script setup>
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'
</script>

<template>
  <SliderRoot
    :default-value="[25, 75]"
    :step="10"
    :min-steps-between-thumbs="1"
  >
    <SliderTrack>
      <SliderRange />
    </SliderTrack>
    <SliderThumb />
    <SliderThumb />
  </SliderRoot>
</template>
```

## 无障碍

遵循 [Slider WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/slidertwothumb) 设计模式。

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['ArrowRight'],
      description: '<span> 根据<Code>orientation</Code>按<Code>step</Code>值递增/递减。 </span>',
    },
    {
      keys: ['ArrowLeft'],
      description: '<span> 根据<Code>orientation</Code>按<Code>step</Code>值递增/递减。 </span>',
    },
    {
      keys: ['ArrowUp'],
      description: '<span> 按<Code>step</Code>量增加值。 </span>',
    },
    {
      keys: ['ArrowDown'],
      description: '<span> 按<Code>step</Code>量减少值。 </span>',
    },
    {
      keys: ['PageUp'],
      description: '<span> 用更大的<Code>step</Code>增加值。</span>',
    },
    {
      keys: ['PageDown'],
      description: '<span> 用更大的<Code>step</Code>减少值。</span>',
    },
    {
      keys: ['Shift + ArrowUp'],
      description: '<span> 用更大的<Code>step</Code>增加值。</span>',
    },
    {
      keys: ['Shift + ArrowDown'],
      description: '<span> 用更大的<Code>step</Code>减少值。</span>',
    },
    {
      keys: ['Home'],
      description: '设为最小值。',
    },
    {
      keys: ['End'],
      description: '设为最大值。',
    },
  ]"
/>

## 自定义 API

通过将原始部分抽象到自己的组件中创建你自己的 API。

### 抽象所有部件

此示例抽象了所有 `Slider` 部件，以便它可以用作自闭合元素。

#### 使用

```vue
<script setup lang="ts">
import { Slider } from './your-slider'
</script>

<template>
  <Slider :default-value="[25]" />
</template>
```

#### 实现

 ```ts
// your-slider.ts
export { default as Slider } from 'Slider.vue'
```

```vue
 <!-- Slider.vue -->
<script setup lang="ts">
import { SlideRoot, SliderRange, type SliderRootEmits, type SliderRootProps, SliderThumb, SliderTrack, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<SliderRootProps>()
const emits = defineEmits<SliderRootEmits>()

const forward = useForwardPropsEmits(props, emits)
</script>

<template>
  <SliderRoot v-bind="forward">
    <SliderTrack>
      <SliderRange />
    </SliderTrack>

    <SliderThumb
      v-for="(_, i) in value"
      :key="i"
    />
  </SliderRoot>
</template>
```

## 警告

### 不触发鼠标事件

由于我们在实现过程中遇到的[限制](https://github.com/unovue/reka-ui/blob/main/packages/radix-vue/src/Slider/SliderImpl.vue#L48-L49)，以下示例无法按预期工作，并且不会触发 `@mousedown` 和 `@mousedown` 事件处理程序：

```vue
<SliderRoot
  @mousedown="() => { console.log('onMouseDown')  }"
  @mouseup="() => { console.log('onMouseUp')  }"
>
  …
</SliderRoot>
```

我们建议改用指针事件（例如。`@pointerdown`，`@pointerup`）。无论上述限制如何，这些事件都更适合跨平台/设备处理，因为它们是针对所有指针输入类型（鼠标、触摸、笔等）触发的。
