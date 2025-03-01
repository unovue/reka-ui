---

title: 组合框
description: 从具有完整键盘支持的建议值列表中进行选择。
name: combobox
aria: https://www.w3.org/WAI/ARIA/apg/patterns/listbox
---

# 组合框

<Description>
从具有完整键盘支持的建议值列表中进行选择。
</Description>

<ComponentPreview name="Combobox" />

## 特性

<Highlights
  :features="[
    '可以是受控的或非受控的',
    '提供两种定位模式',
    '支持项、标签、项组',
    '焦点完全可控',
    '全键盘导航',
    '支持自定义占位符',
    '支持从右到左的方向（RTL）',
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
  ComboboxAnchor,
  ComboboxArrow,
  ComboboxCancel,
  ComboboxContent,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxLabel,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxViewport,
} from 'reka-ui'
</script>

<template>
  <ComboboxRoot>
    <ComboboxAnchor>
      <ComboboxInput />
      <ComboboxTrigger />
      <ComboboxCancel />
    </ComboboxAnchor>

    <ComboboxPortal>
      <ComboboxContent>
        <ComboboxViewport>
          <ComboboxItem>
            <ComboboxItemIndicator />
          </ComboboxItem>

          <ComboboxGroup>
            <ComboboxLabel />
            <ComboboxItem>
              <ComboboxItemIndicator />
            </ComboboxItem>
          </ComboboxGroup>
          <ComboboxSeparator />
        </ComboboxViewport>

        <ComboboxArrow />
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
```

## API 参考

### Root

包含组合框的所有部分。

<!-- @include: @/zh/meta/ComboboxRoot.md -->

### Anchor

如果将 `ComboboxContent` 的位置设置为 `popper`，则用作锚点。

<!-- @include: @/zh/meta/ComboboxAnchor.md -->

### Input

用于在组合框项目中进行搜索的输入组件。

<!-- @include: @/zh/meta/ComboboxInput.md -->

### Trigger

切换组合框内容（打开/关闭）的按钮。

<!-- @include: @/zh/meta/ComboboxTrigger.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
    {
      attribute: '[data-disabled]',
      values: '禁用时存在',
    },
  ]"
/>

### Cancel

清除搜索词的按钮。

<!-- @include: @/zh/meta/ComboboxCancel.md -->

### Empty

当没有任何项与查询匹配时显示。

<!-- @include: @/zh/meta/ComboboxEmpty.md -->

### Portal

你需要为 `ComboboxContent` 设置 `position="popper"` ，以确保其位置自动计算，类似于 `Popover` 或 `DropdownMenu`。

<!-- @include: @/zh/meta/ComboboxPortal.md -->

### Content

组合框打开时弹出的组件。

<PresenceCallout />

<!-- @include: @/zh/meta/ComboboxContent.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
    {
      attribute: '[data-side]',
      values: ['left', 'right', 'bottom', 'top'],
    },
    {
      attribute: '[data-align]',
      values: ['start', 'end', 'center'],
    },
  ]"
/>

<CssVariablesTable
  :data="[
    {
      cssVariable: '--reka-combobox-content-transform-origin',
      description: '从内容和箭头位置/偏移量计算的<Code>transform-origin</Code>。仅在<Code>position=&quot;popper&quot;</Code>时存在。',
    },
    {
      cssVariable: '--reka-combobox-content-available-width',
      description: '触发元素与边界边缘之间的剩余宽度。仅当<Code>position=&quot;popper&quot;</Code>时存在。',
    },
    {
      cssVariable: '--reka-combobox-content-available-height',
      description: '触发元素与边界边缘之间的剩余高度。仅当<Code>position=&quot;popper&quot;</Code>时存在。',
    },
    {
      cssVariable: '--reka-combobox-trigger-width',
      description: '触发器的宽度。仅当<Code>position=&quot;popper&quot;</Code>时存在。',
    },
    {
      cssVariable: '--reka-combobox-trigger-height',
      description: '触发器的高度。仅当<Code>position=&quot;popper&quot;</Code>时存在。',
    },
  ]"
/>

### Viewport

包含所有项的滚动视口。

<!-- @include: @/zh/meta/ComboboxViewport.md -->

### Item

包含组合框项的组件。

<!-- @include: @/zh/meta/ComboboxItem.md -->

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

当项被选中时进行渲染。你可以直接设置这个元素的样式，或者将其用作包装器来放入一个图标，或者两者兼而有之。

<!-- @include: @/zh/meta/ComboboxItemIndicator.md -->

### Group

用于对多个项目进行分组。与 `ComboboxLabel` 结合使用，以通过自动标记确保良好的可访问性。

<!-- @include: @/zh/meta/ComboboxGroup.md -->

### Label

用于呈现组的标签。使用箭头键无法将其聚焦。

<!-- @include: @/zh/meta/ComboboxLabel.md -->

### Separator

用于在组合框中直观地分隔项目。

<!-- @include: @/zh/meta/ComboboxSeparator.md -->

### Arrow

一个可选的箭头元素，与内容一起呈现。这可以用于在视觉上连接触发器与 `ComboboxContent`。必须在 `ComboboxContent` 内部呈现。仅当 `position` 设置为 `popper` 时可用。

<!-- @include: @/zh/meta/ComboboxArrow.md -->

### Virtualizer

实现列表虚拟化的虚拟容器。

<Callout type="warning">

组合框项**必须**在传递给虚拟化器之前手动进行过滤。参见[下面的示例](#virtualized-combobox-with-working-filtering)。

</Callout>

查看[虚拟化指南](../guides/virtualization.md)以获取有关虚拟化的更多通用信息。

<!-- @include: @/zh/meta/ComboboxVirtualizer.md -->

## 示例

### 将对象绑定为值

与仅允许提供字符串作为值的原生 HTML 表单控件不同，`reka-ui` 也支持绑定复杂对象。

确保设置 `displayValue` 属性以在项选择时设置输入值。

```vue line=12,17,26
<script setup lang="ts">
import { ref } from 'vue'
import { ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot } from 'reka-ui'

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
  <ComboboxRoot v-model="selectedPeople">
    <ComboboxInput :display-value="(v) => v.name" />
    <ComboboxPortal>
      <ComboboxContent>
        <ComboboxItem
          v-for="person in people"
          :key="person.id"
          :value="person"
          :disabled="person.unavailable"
        >
          {{ person.name }}
        </ComboboxItem>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
```

### 选择多个值

`Combobox` 组件允许你选择多个值。你可以通过提供一个值数组而不是单个值来启用此功能。

```vue line=12,16
<script setup lang="ts">
import { ref } from 'vue'
import { ComboboxRoot } from 'reka-ui'

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
  <ComboboxRoot
    v-model="selectedPeople"
    multiple
  >
    …
  </ComboboxRoot>
</template>
```

### 自定义筛选

在内部，`ComboboxRoot` 将根据呈现的文本对项目进行筛选。

但是，您也可以提供自己的自定义筛选逻辑，并设置 `ignoreFilter="false"`。

```vue line=15,16,22,28
<script setup lang="ts">
import { ref } from 'vue'
import { ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, useFilter } from 'reka-ui'

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
  <ComboboxRoot
    v-model="selectedPeople"
    :ignore-filter="true"
  >
    <ComboboxInput v-model="searchTerm" />
    <ComboboxPortal>
      <ComboboxContent>
        <ComboboxItem
          v-for="person in filteredPeople"
          :key="person.id"
          :value="person"
        >
          {{ person.name }}
        </ComboboxItem>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
```

### 自定义标签

默认情况下，`Combobox` 将使用输入内容作为屏幕阅读器的标签。如果您希望对辅助技术声明的内容有更多控制，请使用[标签](/zh/docs/components/label)组件。

```vue line=8,9
<script setup lang="ts">
import { ref } from 'vue'
import { ComboboxInput, ComboboxRoot, Label } from 'reka-ui'
</script>

<template>
  <ComboboxRoot v-model="selectedPeople">
    <Label for="person">Person: </Label>
    <ComboboxInput
      id="person"
      placeholder="Select a person"
    />
    …
  </ComboboxRoot>
</template>
```

### 禁用项

你可以通过 `data-disabled` 属性为禁用项添加特殊样式。

```vue line=17
<script setup lang="ts">
import { ref } from 'vue'
import {
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxPortal,
  ComboboxRoot,
} from 'reka-ui'
</script>

<template>
  <ComboboxRoot>
    <ComboboxInput />
    <ComboboxPortal>
      <ComboboxContent>
        <ComboboxItem
          class="ComboboxItem"
          disabled
        >
          …
        </ComboboxItem>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
```

```css line=2
/* styles.css */
.ComboboxItem[data-disabled] {
  color: "gainsboro";
}
```

### 分割线

使用 `Separator` 部分在条目之间添加分割线。

```vue line=21
<script setup lang="ts">
import { ref } from 'vue'
import {
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxSeparator
} from 'reka-ui'
</script>

<template>
  <ComboboxRoot>
    <ComboboxInput />
    <ComboboxPortal>
      <ComboboxContent>
        <ComboboxItem>…</ComboboxItem>
        <ComboboxItem>…</ComboboxItem>
        <ComboboxItem>…</ComboboxItem>
        <ComboboxSeparator />
        <ComboboxItem>…</ComboboxItem>
        <ComboboxItem>…</ComboboxItem>
        <ComboboxItem>…</ComboboxItem>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
```

### 分组项

使用 `Group` 和 `Label` 部分在一个区域中对项进行分组。

```vue line=19,20,24
<script setup lang="ts">
import { ref } from 'vue'
import {
  ComboboxContent,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxPortal,
  ComboboxRoot
} from 'reka-ui'
</script>

<template>
  <ComboboxRoot>
    <ComboboxInput />
    <ComboboxPortal>
      <ComboboxContent>
        <ComboboxGroup>
          <ComboboxLabel>Label</ComboboxLabel>
          <ComboboxItem>…</ComboboxItem>
          <ComboboxItem>…</ComboboxItem>
          <ComboboxItem>…</ComboboxItem>
        </ComboboxGroup>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
```

### 复杂项

你可以在你的项中使用自定义内容。

```vue line=21
<script setup lang="ts">
import { ref } from 'vue'
import {
  ComboboxContent,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxLabel,
  ComboboxPortal,
  ComboboxRoot
} from 'reka-ui'
</script>

<template>
  <ComboboxRoot>
    <ComboboxInput />
    <ComboboxPortal>
      <ComboboxContent>
        <ComboboxItem>
          <img src="…">
          Adolfo Hess
          <ComboboxItemIndicator />
        </ComboboxItem>
        …
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
```

### 避免选择行为

默认情况下，选择 `ComboboxItem` 将关闭内容，并使用提供的值更新 `modelValue`。你可以通过阻止默认行为 `@select.prevent` 来防止这种行为。

```vue line=11
<script setup lang="ts">
import { ref } from 'vue'
import { ComboboxContent, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxItemIndicator, ComboboxLabel, ComboboxPortal, ComboboxRoot } from 'reka-ui'
</script>

<template>
  <ComboboxRoot>
    <ComboboxInput />
    <ComboboxPortal>
      <ComboboxContent>
        <ComboboxItem @select.prevent>
          Item A
        </ComboboxItem>
        …
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
```

### 具有可用过滤功能的虚拟化组合框

组合框项目**必须**在将它们传递给虚拟化程序之前手动过滤。

查看[虚拟化指南](../guides/virtualization.md)以获取有关虚拟化的更多通用信息。

```vue line=9-10,17,19-28
<script setup lang="ts">
import { computed, ref } from 'vue'
import { ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxViewport, ComboboxVirtualizer, useFilter } from 'reka-ui'

const people = Array.from({ length: 100000 }).map((_, id) => ({ id, name: `Person #${id}` }))
const selectedPeople = ref(people[0])
const searchTerm = ref('')

const { contains } = useFilter({ sensitivity: 'base' })
const filteredPeople = computed(() => people.filter(p => contains(p.name, searchTerm.value)))
</script>

<template>
  <ComboboxRoot v-model="selectedPeople">
    <ComboboxInput v-model="searchTerm" />
    <ComboboxPortal>
      <ComboboxContent class="max-h-[40vh] overflow-hidden">
        <ComboboxViewport>
          <ComboboxVirtualizer
            v-slot="{ option }"
            :options="filteredPeople"
            :text-content="(x) => x.name"
            :estimate-size="24"
          >
            <ComboboxItem :value="option">
              {{ option.name }}
            </ComboboxItem>
          </ComboboxVirtualizer>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
```

## 无障碍

遵循[组合框WAI-ARIA设计模式](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)。

查看 W3C [组合框自动完成列表](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/) 示例获取更多信息。

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['Enter'],
      description: '<span>当焦点位于<Code>ComboboxItem</Code>时，选择焦点项。</span>',
    },
    {
      keys: ['ArrowDown'],
      description: '<span> 当焦点在<Code>ComboboxInput</Code>上时，打开组合框内容。<br/>当焦点在一个项上时，将焦点移动到下一个项。 </span>',
    },
    {
      keys: ['ArrowUp'],
      description: '<span> 当焦点在<Code>ComboboxInput</Code>上时，打开组合框内容。<br/>当焦点在一个项上时，将焦点移动到前一个项。 </span>',
    },
    {
      keys: ['Esc'],
      description: '<span> 关闭组合框并恢复<Code>ComboboxInput</Code>字段中的选定项。 </span>',
    },
  ]"
/>

## 自定义 API

通过将原始部分抽象到自己的组件中创建你自己的 API。

### 命令菜单

组合框可用于构建你自己的命令菜单。

#### 使用

```vue
<script setup lang="ts">
import { Command, CommandItem } from './your-command'
</script>

<template>
  <Command>
    <CommandItem value="1">
      Item 1
    </CommandItem>
    <CommandItem value="2">
      Item 2
    </CommandItem>
    <CommandItem value="3">
      Item 3
    </CommandItem>
  </Command>
</template>
```

#### 实现

```ts
// your-command.ts
export { default as Command } from 'Command.vue'
export { default as CommandItem } from 'CommandItem.vue'
```

```vue
<!-- Command.vue -->
<script setup lang="ts">
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, } from '@radix-icons/vue'
import { ComboboxContent, ComboboxInput, ComboboxPortal, ComboboxRoot, useForwardPropsEmits } from 'reka-ui'
import type { ComboboxRootEmits, ComboboxRootProps } from 'reka-ui'

const props = defineProps<ComboboxRootProps>()
const emits = defineEmits<ComboboxRootEmits>()

const forward = useForwardPropsEmits(props, emits)
</script>

<template>
  <ComboboxRoot
    v-bind="forward"
    :open="true"
    model-value=""
  >
    <ComboboxInput placeholder="Type a command or search…" />

    <ComboboxPortal>
      <ComboboxContent
        @escape-key-down.prevent
        @focus-outside.prevent
        @interact-outside.prevent
        @pointer-down-outside.prevent
      >
        <ComboboxViewport>
          <slot />
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
```

```vue
<!-- ComboboxItem.vue -->
<script setup lang="ts">
import { CheckIcon } from '@radix-icons/vue'
import { ComboboxItem, type ComboboxItemProps } from 'reka-ui'

const props = defineProps<ComboboxItemProps>()
</script>

<template>
  <ComboboxItem
    v-bind="props"
    @select.prevent
  >
    <slot />
  </ComboboxItem>
</template>
```
