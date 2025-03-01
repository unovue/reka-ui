---

title: 选择器
description: 显示供用户选择的选项列表 - 由按钮触发。
name: select
aria: https://www.w3.org/WAI/ARIA/apg/patterns/listbox
---

# 选择器

<Description>
显示供用户选择的选项列表 - 由按钮触发。
</Description>

<ComponentPreview name="Select" />

## 特性

<Highlights
  :features="[
    '可以是受控的或非受控的',
    '提供 2 种定位模式',
    '支持项、标签、项组',
    '焦点完全可控',
    '全键盘导航',
    '支持自定义占位符',
    '自动补全支持',
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
  SelectContent,
  SelectGroup,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'
</script>

<template>
  <SelectRoot>
    <SelectTrigger>
      <SelectValue />
      <SelectIcon />
    </SelectTrigger>

    <SelectPortal>
      <SelectContent>
        <SelectScrollUpButton />
        <SelectViewport>
          <SelectItem>
            <SelectItemText />
            <SelectItemIndicator />
          </SelectItem>
          <SelectGroup>
            <SelectLabel />
            <SelectItem>
              <SelectItemText />
              <SelectItemIndicator />
            </SelectItem>
          </SelectGroup>
          <SelectSeparator />
        </SelectViewport>
        <SelectScrollDownButton />
        <SelectArrow />
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```

## API 参考

### Root

包含选择器的所有部分

<!-- @include: @/zh/meta/SelectRoot.md -->

### Trigger

切换选择器的按钮，`SelectContent` 将通过对齐触发器来定位自身。

<!-- @include: @/zh/meta/SelectTrigger.md -->

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
    {
      attribute: '[data-placeholder]',
      values: 'Present when has placeholder',
    },
  ]"
/>

### Value

反映所选值的部分。默认情况下，将呈现所选项的文本。如果需要更多控制，可以改为控制选择器并传递自己的 `children`。不应设置其样式以确保正确定位。当选择器没有值时，也可以使用可选的 `placeholder` prop。

<!-- @include: @/zh/meta/SelectValue.md -->

### Icon

一个通常显示在值旁边的小图标，作为它可以打开的视觉方式。默认情况下，会呈现 ▼，但您可以通过 `asChild` 使用自己的图标或使用 `children`。

<!-- @include: @/zh/meta/SelectItem.md -->

### Portal

使用时，将内容部分传送到 `body` 中。

<!-- @include: @/zh/meta/SelectPortal.md -->

### Content

打开选择器时弹出的组件。

<PresenceCallout />

<!-- @include: @/zh/meta/SelectContent.md -->

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
      cssVariable: '--reka-select-content-transform-origin',
      description: '根据内容和箭头位置/偏移量计算的<Code>transform-origin</Code>。仅在<Code>position=&quot;popper&quot;</Code>时出现。',
    },
    {
      cssVariable: '--reka-select-content-available-width',
      description: '触发器和边界边缘之间的剩余宽度。仅在<Code>position=&quot;popper&quot;</Code>时出现。',
    },
    {
      cssVariable: '--reka-select-content-available-height',
      description: '触发器和边界边缘之间的剩余高度。仅在<Code>position=&quot;popper&quot;</Code>时出现。',
    },
    {
      cssVariable: '--reka-select-trigger-width',
      description: '触发器的宽度。仅在<Code>position=&quot;popper&quot;</Code>时出现。',
    },
    {
      cssVariable: '--reka-select-trigger-height',
      description: '扳机的高度。仅在<Code>position=&quot;popper&quot;</Code>时出现。',
    },
  ]"
/>

### Viewport

包含所有项的滚动视口。

<!-- @include: @/zh/meta/SelectViewport.md -->

### Item

包含选项的组件。

<!-- @include: @/zh/meta/SelectItem.md -->

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

### ItemText

项的文本部分。它应仅包含您希望在选择该项时在触发器中看到的文本。不应设置其样式以确保正确定位。

<!-- @include: @/zh/meta/SelectItemText.md -->

### ItemIndicator

在选择项时渲染。您可以直接设置此元素的样式，也可以将其用作包装器以将图标放入其中，或两者兼而有之。

<!-- @include: @/zh/meta/SelectItemIndicator.md -->

### ScrollUpButton

一个可选按钮，可供显示视区溢出，并启用向上滚动功能。

<!-- @include: @/zh/meta/SelectScrollUpButton.md -->

### ScrollDownButton

一个可选按钮，可供显示视区溢出，并启用向下滚动功能。

<!-- @include: @/zh/meta/SelectScrollDownButton.md -->

### Group

用于对多个项进行分组。与 `SelectLabel` 结合使用，通过自动标记确保良好的可访问性。

<!-- @include: @/zh/meta/SelectGroup.md -->

### Label

用于呈现组的标签。无法使用箭头键聚焦。

<!-- @include: @/zh/meta/SelectLabel.md -->

### Separator

用于视觉上分隔选择器中的项。

<!-- @include: @/zh/meta/SelectSeparator.md -->
### Arrow

一个可选的箭头元素，与内容一起渲染。这可用于帮助视觉上将触发器与 `SelectContent` 链接起来。必须在 `SelectContent` 中。仅当 `position` 设置为 `popper` 时可用。

<!-- @include: @/zh/meta/SelectArrow.md -->

## 示例

### 更改定位模式

默认情况下，`Select` 的行为类似于原生 MacOS 菜单，方法是将 `SelectContent` 相对于活动项定位。如果你更喜欢类似于 `Popover` 或 `DropdownMenu` 的替代定位方法，那么你可以将 `position` 设置为 `popper` 并使用其他对齐选项，例如 `side`、`sideOffset` 等。

```vue line=20
// index.vue
<script setup lang="ts">
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemIndicator,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
} from 'reka-ui'
</script>

<template>
  <SelectRoot>
    <SelectTrigger>…</SelectTrigger>
    <SelectPortal>
      <SelectContent
        position="popper"
        :side-offset="5"
      >
        …
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```

### 限制内容的大小

在 `SelectContent` 上使用 `position="popper"` 时，您可能希望限制内容的宽度，使其与触发器宽度匹配。您可能还希望将其高度限制为不超过视口。

我们暴露了几个 CSS 自定义属性，例如 `--reka-select-trigger-width` 和 `--reka-select-content-available-height` 来支持这一点。使用它们来限制内容维度。

```vue line=20
// index.vue
<script setup lang="ts">
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemIndicator,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
} from 'reka-ui'
</script>

<template>
  <SelectRoot>
    <SelectTrigger>…</SelectTrigger>
    <SelectPortal>
      <SelectContent
        class="SelectContent"
        position="popper"
        :side-offset="5"
      >
        …
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```

```css line=3,4
/* styles.css */
.SelectContent {
  width: var(--reka-select-trigger-width);
  max-height: var(--reka-select-content-available-height);
}
```

### 禁用项

您可以通过 `data-disabled` 属性向禁用的项添加特殊样式。

```vue line=22
// index.vue
<script setup lang="ts">
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemIndicator,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
} from 'reka-ui'
</script>

<template>
  <SelectRoot>
    <SelectTrigger>…</SelectTrigger>
    <SelectPortal>
      <SelectContent>
        <SelectViewport>
          <SelectItem
            class="SelectItem"
            disabled
          >
            …
          </SelectItem>
          <SelectItem>…</SelectItem>
          <SelectItem>…</SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```

```css line=2
/* styles.css */
.SelectItem[data-disabled] {
  color: "gainsboro";
}
```

### 占位

当选择器没有值时，你可以在 `Value` 上使用 `placeholder` 属性。`Trigger` 上还有一个 `data-placeholder` 属性，用于帮助设置样式。

```vue line=19,20
// index.vue
<script setup lang="ts">
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemIndicator,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
} from 'reka-ui'
import './styles.css'
</script>

<template>
  <SelectRoot>
    <SelectTrigger class="SelectTrigger">
      <SelectValue placeholder="Pick an option" />
      <SelectIcon />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent>…</SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```

```css line=2
/* styles.css */
.SelectTrigger[data-placeholder] {
  color: "gainsboro";
}
```

### 分割线

使用 `Separator` 部件在项之间添加分割线。

```vue line=10
<template>
  <SelectRoot>
    <SelectTrigger>…</SelectTrigger>
    <SelectPortal>
      <SelectContent>
        <SelectViewport>
          <SelectItem>…</SelectItem>
          <SelectItem>…</SelectItem>
          <SelectItem>…</SelectItem>
          <SelectSeparator />
          <SelectItem>…</SelectItem>
          <SelectItem>…</SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```

### 项分组

使用 `Group` 和 `Label` 部分对部分中的项进行分组。

```vue line=7,8,12
<template>
  <SelectRoot>
    <SelectTrigger>…</SelectTrigger>
    <SelectPortal>
      <SelectContent>
        <SelectViewport>
          <SelectGroup>
            <SelectLabel>Label</SelectLabel>
            <SelectItem>…</SelectItem>
            <SelectItem>…</SelectItem>
            <SelectItem>…</SelectItem>
          </SelectGroup>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```

### 复杂项

您可以在项中使用自定义内容。

```vue line=23
<script setup lang="ts">
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemIndicator,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
} from 'reka-ui'
</script>

<template>
  <SelectRoot>
    <SelectTrigger>…</SelectTrigger>
    <SelectPortal>
      <SelectContent>
        <SelectViewport>
          <SelectItem>
            <SelectItemText>
              <img src="…">
              Adolfo Hess
            </SelectItemText>
            <SelectItemIndicator>…</SelectItemIndicator>
          </SelectItem>
          <SelectItem>…</SelectItem> <SelectItem>…</SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```

### 控制触发器中显示的值

默认情况下，触发器显示所选项的文本（不再像 v1 中那样自动呈现 `ItemText` 的内容）。

如果你需要渲染纯文本以外的内容，你可以使用 `v-model` props（或访问 `SelectValue` 的 slotProps）来控制组件，并将 `slot` 传递给 `SelectValue`。请记住确保您放入其中的内容是无障碍的。

```vue line=2,4,10-12
<script setup>
const countries = { 'france': '🇫🇷', 'united-kingdom': '🇬🇧', 'spain': '🇪🇸' }

const value = ref('france')
</script>

<template>
  <SelectRoot v-model="value">
    <SelectTrigger>
      <SelectValue :aria-label="value">
        {{ countries[value] }}
      </SelectValue>
      <SelectIcon />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent>
        <SelectViewport>
          <SelectItem value="france">
            <SelectItemText>France</SelectItemText>
            <SelectItemIndicator>…</SelectItemIndicator>
          </SelectItem>
          <SelectItem value="united-kingdom">
            <SelectItemText>United Kingdom</SelectItemText>
            <SelectItemIndicator>…</SelectItemIndicator>
          </SelectItem>
          <SelectItem value="spain">
            <SelectItemText>Spain</SelectItemText>
            <SelectItemIndicator>…</SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```

### 自定义滚动条

默认情况下，原生滚动条处于隐藏状态，因此我们建议使用 `ScrollUpButton` 和 `ScrollDownButton` 部件以获得最佳 UX。如果您不想使用这些部分，请使用我们的 [Scroll Area](scroll-area) primitive 来组合您的选择器。

```vue line=25,27,32-34
// index.vue
<script setup lang="ts">
import {
  ScrollAreaRoot,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemIndicator,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
} from 'reka-ui'
</script>

<template>
  <SelectRoot>
    <SelectTrigger>…</SelectTrigger>
    <SelectPortal>
      <SelectContent>
        <ScrollAreaRoot
          class="ScrollAreaRoot"
          type="auto"
        >
          <SelectViewport as-child>
            <ScrollAreaViewport class="ScrollAreaViewport">
              <StyledItem>…</StyledItem> <StyledItem>…</StyledItem>
              <StyledItem>…</StyledItem>
            </ScrollAreaViewport>
          </SelectViewport>
          <ScrollAreaScrollbar
            class="ScrollAreaScrollbar"
            orientation="vertical"
          >
            <ScrollAreaThumb class="ScrollAreaThumb" />
          </ScrollAreaScrollbar>
        </ScrollAreaRoot>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```

```css
/* styles.css */
.ScrollAreaRoot {
  width: 100%;
  height: 100%;
}

.ScrollAreaViewport {
  width: 100%;
  height: 100%;
}

.ScrollAreaScrollbar {
  width: 4px;
  padding: 5px 2px;
}

.ScrollAreaThumb {
  background: rgba(0, 0, 0, 0.3);
  borderradius: 3px;
}
```

## 无障碍

遵循 [ListBox WAI-ARIA 设计模式](https://www.w3.org/WAI/ARIA/apg/patterns/listbox)。

有关更多信息，请参阅 W3C [仅选组合框](https://www.w3.org/TR/wai-aria-practices/examples/combobox/combobox-select-only.html)示例。

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['Space'],
      description: '<span> 当焦点位于<Code>SelectTrigger</Code>上时，打开选择并聚焦所选项。<br/>当焦点位于某项上时，选择聚焦项。 </span>',
    },
    {
      keys: ['Enter'],
      description: '<span> 当焦点位于<Code>SelectTrigger</Code>上时，打开选择并聚焦第一项。<br/>当焦点位于某项上时，选择焦点项。 </span>',
    },
    {
      keys: ['ArrowDown'],
      description: '<span> 当焦点位于<Code>SelectTrigger</Code>时，打开选择器 <br /> 当焦点位于某项上时，将焦点移动到下一项。 </span>',
    },
    {
      keys: ['ArrowUp'],
      description: '<span> 当焦点位于<Code>SelectTrigger</Code>时，打开选择器 <br /> 当焦点位于某项上时，将焦点移动到前一项。 </span>',
    },
    {
      keys: ['Esc'],
      description: '<span> 关闭选择器并将焦点移动到<Code>SelectTrigger</Code>。 </span>',
    },
  ]"
/>

### 打标签

使用我们的 [Label](label) 组件，以便为选择器提供视觉和无障碍的标签。

```vue line=19,22,26,28
<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import {
  Label,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemIndicator,
  SelectLabel,
  SelectPortal,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
} from 'reka-ui'
</script>

<template>
  <Label>
    Country
    <SelectRoot>…</SelectRoot>
  </Label>

  <!-- or -->

  <Label for="country">Country</Label>
  <SelectRoot>
    <SelectTrigger id="country">
      …
    </SelectTrigger>
    <SelectPortal>
      <SelectContent>…</SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```

## 自定义 API

通过将原始部分抽象到自己的组件中创建你自己的 API。

### 抽象为 `Select` 和 `SelectItem`

此示例抽象了大部分部件。

#### 使用

```vue
<script setup lang="ts">
import { Select, SelectItem } from './your-select'
</script>

<template>
  <Select default-value="2">
    <SelectItem value="1">
      Item 1
    </SelectItem>
    <SelectItem value="2">
      Item 2
    </SelectItem>
    <SelectItem value="3">
      Item 3
    </SelectItem>
  </Select>
</template>
```

#### 实现

```ts
// your-select.ts
export { default as Select } from 'Select.vue'
export { default as SelectItem } from 'SelectItem.vue'
```

```vue
<!-- Select.vue -->
<script setup lang="ts">
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, } from '@radix-icons/vue'
import { SelectContent, SelectIcon, SelectPortal, SelectRoot, SelectScrollDownButton, SelectScrollUpButton, SelectTrigger, SelectValue, SelectViewport, useForwardPropsEmits } from 'reka-ui'
import type { SelectRootEmits, SelectRootProps } from 'reka-ui'

const props = defineProps<SelectRootProps>()
const emits = defineEmits<SelectRootEmits>()

const forward = useForwardPropsEmits(props, emits)
</script>

<template>
  <SelectRoot v-bind="forward">
    <SelectTrigger>
      <SelectValue />
      <SelectIcon>
        <ChevronDownIcon />
      </SelectIcon>
    </SelectTrigger>

    <SelectPortal>
      <SelectContent>
        <SelectScrollUpButton>
          <ChevronUpIcon />
        </SelectScrollUpButton>
        <SelectViewport>
          <slot />
        </SelectViewport>
        <SelectScrollDownButton>
          <ChevronDownIcon />
        </SelectScrollDownButton>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
```

```vue
<!-- SelectItem.vue -->
<script setup lang="ts">
import { CheckIcon } from '@radix-icons/vue'
import { SelectItem, SelectItemIndicator, type SelectItemProps, SelectItemText } from 'reka-ui'

const props = defineProps<SelectItemProps>()
</script>

<template>
  <SelectItem v-bind="props">
    <SelectItemText>
      <slot />
    </SelectItemText>
    <SelectItemIndicator>
      <CheckIcon />
    </SelectItemIndicator>
  </SelectItem>
</template>
```
