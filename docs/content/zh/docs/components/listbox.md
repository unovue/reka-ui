---

title: 列表框
description: 允许用户在选中和未选中之间切换的控件。
name: listbox
aria: https://www.w3.org/WAI/ARIA/apg/patterns/listbox
---

# 列表框

<Description>
允许用户在选中和未选中之间切换的控件。
</Description>

<ComponentPreview name="Listbox" />

## 特性

<Highlights
  :features="[
    '可以是受控的或非受控的',
    '支持项、标签、项组',
    '焦点完全可控',
    '全键盘导航',
    '支持从右到左的方向（RTL）',
    '不同的选择行为',
  ]"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import { ListboxContent, ListboxFilter, ListboxGroup, ListboxGroupLabel, ListboxItem, ListboxItemIndicator, ListboxRoot, ListboxVirtualizer } from 'reka-ui'
</script>

<template>
  <ListboxRoot>
    <ListboxFilter />

    <ListboxContent>
      <ListboxItem>
        <ListboxItemIndicator />
      </ListboxItem>

      <!-- or with group -->
      <ListboxGroup>
        <ListboxGroupLabel />
        <ListboxItem>
          <ListboxItemIndicator />
        </ListboxItem>
      </ListboxGroup>

      <!-- or with virtual -->
      <ListboxVirtualizer>
        <ListboxItem>
          <ListboxItemIndicator />
        </ListboxItem>
      </ListboxVirtualizer>
    </ListboxContent>
  </ListboxRoot>
</template>
```

## API 参考

### Root

包含列表框的所有部分。在 `form` 中使用时，`input` 也会渲染，以确保事件正确传播。

<!-- @include: @/zh/meta/ListboxRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

### Filter

用于执行筛选的输入元素。

<!-- @include: @/zh/meta/ListboxFilter.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

### Content

包含所有列表框组和项。

<!-- @include: @/zh/meta/ListboxContent.md -->

### Item

项组件。

<!-- @include: @/zh/meta/ListboxItem.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['checked', 'unchecked'],
    },
    {
      attribute: '[data-highlighted]',
      values: '高亮状态下存在',
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

### ItemIndicator

在项选中时渲染。您可以直接设置此元素的样式，也可以将其用作包装器以将图标放入其中，或两者兼而有之。

<!-- @include: @/zh/meta/ListboxItemIndicator.md -->

### Group

用于对多个项进行分组。与 `ListboxGroupLabel` 结合使用，通过自动标记确保良好的可访问性。

<!-- @include: @/zh/meta/ListboxGroup.md -->

### GroupLabel

用于呈现组的标签。无法使用箭头键聚焦。

<!-- @include: @/zh/meta/ListboxGroupLabel.md -->

### Virtualizer

虚拟容器，实现列表虚拟化。

<!-- @include: @/zh/meta/ListboxVirtualizer.md -->

## 示例

### 将对象绑定为值

与仅允许您提供字符串作为值的原生 HTML 表单控件不同，`reka-ui` 还支持绑定复杂对象。

```vue line=12,16,21
<script setup lang="ts">
import { ref } from 'vue'
import { ListboxContent, ListboxFilter, ListboxItem, ListboxRoot } from 'reka-ui'

const people = [
  { id: 1, name: 'Durward Reynolds' },
  { id: 2, name: 'Kenton Towne' },
  { id: 3, name: 'Therese Wunsch' },
  { id: 4, name: 'Benedict Kessler' },
  { id: 5, name: 'Katelyn Rohan' },
]
const selectedPeople = ref(people[0])
</script>

<template>
  <ListboxRoot v-model="selectedPeople">
    <ListboxContent>
      <ListboxItem
        v-for="person in people"
        :key="person.id"
        :value="person"
        :disabled="person.unavailable"
      >
        {{ person.name }}
      </ListboxItem>
    </ListboxContent>
  </ListboxRoot>
</template>
```

### 选择多个值

`Listbox` 组件允许您选择多个值。您可以通过提供值数组而不是单个值来启用此功能。

```vue line=12,18
<script setup lang="ts">
import { ref } from 'vue'
import { ListboxRoot } from 'reka-ui'

const people = [
  { id: 1, name: 'Durward Reynolds' },
  { id: 2, name: 'Kenton Towne' },
  { id: 3, name: 'Therese Wunsch' },
  { id: 4, name: 'Benedict Kessler' },
  { id: 5, name: 'Katelyn Rohan' },
]
const selectedPeople = ref([people[0], people[1]])
</script>

<template>
  <ListboxRoot
    v-model="selectedPeople"
    multiple
  >
    ...
  </ListboxRoot>
</template>
```

### 自定义筛选

```vue line=13,15-16,21,24
<script setup lang="ts">
import { ref } from 'vue'
import { ListboxContent, ListboxFilter, ListboxItem, ListboxRoot, useFilter } from 'reka-ui'

const people = [
  { id: 1, name: 'Durward Reynolds' },
  { id: 2, name: 'Kenton Towne' },
  { id: 3, name: 'Therese Wunsch' },
  { id: 4, name: 'Benedict Kessler' },
  { id: 5, name: 'Katelyn Rohan' },
]
const selectedPeople = ref(people[0])
const searchTerm = ref('')

const { startsWith } = useFilter({ sensitivity: 'base' })
const filteredPeople = computed(() => people.filter(p => startsWith(p.name, searchTerm.value)))
</script>

<template>
  <ListboxRoot v-model="selectedPeople">
    <ListboxFilter v-model="searchTerm" />
    <ListboxContent>
      <ListboxItem
        v-for="person in filteredPeople"
        :key="person.id"
        :value="person"
      >
        {{ person.name }}
      </ListboxItem>
    </ListboxContent>
  </ListboxRoot>
</template>
```

### 虚拟列表

渲染一长串项目可能会降低应用程序的速度，因此使用虚拟化将显著提高性能。

```vue line=19-23,24
<script setup lang="ts">
import { ref } from 'vue'
import { ListboxContent, ListboxFilter, ListboxItem, ListboxRoot, ListboxVirtualizer } from 'reka-ui'

const people = [
  { id: 1, name: 'Durward Reynolds' },
  { id: 2, name: 'Kenton Towne' },
  { id: 3, name: 'Therese Wunsch' },
  { id: 4, name: 'Benedict Kessler' },
  { id: 5, name: 'Katelyn Rohan' },
  // and a lot more
]
</script>

<template>
  <ListboxRoot>
    <ListboxContent>
      <!-- checkout https://reka-ui.com/components/listbox.html#virtualizer -->
      <ListboxVirtualizer
        v-slot="{ option }"
        :options="people"
        :text-content="(opt) => opt.name"
      >
        <ListboxItem :value="option">
          {{ person.name }}
        </ListboxItem>
      </ListboxVirtualizer>
    </ListboxContent>
  </ListboxRoot>
</template>
```

## 无障碍

遵循[列表框WAI-ARIA设计模式](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)。

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['Enter'],
      description: '<span>在<code>ListboxItem</code>上突出显示时，选择聚焦项。 </span>',
    },
    {
      keys: ['ArrowDown'],
      description: '当焦点在<code>ListboxItem</code>上时, 将焦点移动到下一项。 </span>',
    },
    {
      keys: ['ArrowUp'],
      description: '当焦点在<code>ListboxItem</code>上时, 将焦点移动到前一项。 </span>',
    },
    {
      keys: ['Home'],
      description: '<span>将焦点和突出显示移动到第一项。</span>',
    },
    {
      keys: ['End'],
      description: '<span>将焦点和突出显示移动到最后一项。</span>',
    },
    {
      keys: ['Ctrl/Cmd + A'],
      description: '<span>选择所有项。</span>',
    }
  ]"
/>
