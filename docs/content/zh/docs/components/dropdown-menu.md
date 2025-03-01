---

title:  下拉菜单
description: 通过按钮触发向用户显示菜单，例如一组操作或功能。
name: dropdown-menu
aria: https://www.w3.org/WAI/ARIA/apg/patterns/menubutton
---

# 下拉菜单

<Description>
通过按钮触发向用户显示菜单，例如一组操作或功能。
</Description>

<ComponentPreview name="DropdownMenu" />

## 特性

<Highlights
  :features="[
    '可以是受控的或非受控的',
    '支持具有可配置阅读方向的子菜单',
    '支持项、标签、项组',
    '支持具有可选不确定状态的可勾选项目（单个或多个）',
    '支持模态和非模态模式',
    '自定义边、对齐方式、偏移量、冲突处理',
    '可选渲染指向箭头',
    '焦点完全可控',
    '全键盘导航',
    '自动补全支持',
    '取消和分层行为是高度可定制的',
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
  DropdownMenuArrow,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuItemIndicator,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'reka-ui'
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger />

    <DropdownMenuPortal>
      <DropdownMenuContent>
        <DropdownMenuLabel />
        <DropdownMenuItem />

        <DropdownMenuGroup>
          <DropdownMenuItem />
        </DropdownMenuGroup>

        <DropdownMenuCheckboxItem>
          <DropdownMenuItemIndicator />
        </DropdownMenuCheckboxItem>

        <DropdownMenuRadioGroup>
          <DropdownMenuRadioItem>
            <DropdownMenuItemIndicator />
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger />
          <DropdownMenuPortal>
            <DropdownMenuSubContent />
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        <DropdownMenuArrow />
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
```

## API 参考

### Root

包含下拉框的所有部分。

<!-- @include: @/zh/meta/DropdownMenuRoot.md -->

### Trigger

切换下拉框的按钮。默认情况下，`DropdownMenuContent` 将自身定位在触发器上。

<!-- @include: @/zh/meta/DropdownMenuTrigger.md -->

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

### Portal

使用时，将内容部分传送到 `body`。

<!-- @include: @/zh/meta/DropdownMenuPortal.md -->

### Content

下拉框打开时弹出的组件。

<!-- @include: @/zh/meta/DropdownMenuContent.md -->

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
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

<CssVariablesTable
  :data="[
    {
      cssVariable: '--reka-dropdown-menu-content-transform-origin',
      description: '根据内容和箭头位置/偏移量计算的<Code>transform-origin</Code>'
    },
    {
      cssVariable: '--reka-dropdown-menu-content-available-width',
      description: '触发器和边界边缘之间的剩余宽度'
    },
    {
      cssVariable: '--reka-dropdown-menu-content-available-height',
      description: '触发器和边界边缘之间的剩余高度'
    },
    {
      cssVariable: '--reka-dropdown-menu-trigger-width',
      description: '触发器的宽度',
    },
    {
      cssVariable: '--reka-dropdown-menu-trigger-height',
      description: '扳机的高度',
    },
  ]"
/>

### Arrow

与下拉框一起呈现的可选箭头元素。这可用于帮助将触发器与 `DropdownMenuContent` 视觉上链接起来。必须在  `DropdownMenuContent` 中。

<!-- @include: @/zh/meta/DropdownMenuArrow.md -->

### Item

包含下拉框项的组件。

<!-- @include: @/zh/meta/DropdownMenuItem.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
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

### Group

用于对多个 `DropdownMenuItem` 进行分组。

<!-- @include: @/zh/meta/DropdownMenuGroup.md -->

### Label

用于渲染标签。无法使用箭头键聚焦。

<!-- @include: @/zh/meta/DropdownMenuLabel.md -->

### CheckboxItem

一个可以像复选框一样受控和渲染的项。

<!-- @include: @/zh/meta/DropdownMenuCheckboxItem.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['checked', 'unchecked', 'indeterminate'],
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

### RadioGroup

用于对多个 `DropdownMenuRadioItem` 进行分组。

<!-- @include: @/zh/meta/DropdownMenuRadioGroup.md -->

### RadioItem

一个可以像单选框一样受控和渲染的项。

<!-- @include: @/zh/meta/DropdownMenuRadioItem.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['checked', 'unchecked', 'indeterminate'],
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

选中父 `DropdownMenuCheckboxItem` 或 `DropdownMenuRadioItem` 时呈现。您可以直接设置此元素的样式，也可以将其用作包装器来放入图标，或者两者兼而有之。

<!-- @include: @/zh/meta/DropdownMenuItemIndicator.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['checked', 'unchecked', 'indeterminate'],
    },
  ]"
/>

### Separator

用于在下拉框中视觉上分隔项。

<!-- @include: @/zh/meta/DropdownMenuSeparator.md -->

### Sub

包含子菜单的所有部分。

<!-- @include: @/zh/meta/DropdownMenuSub.md -->

### SubTrigger

打开子菜单的项。必须在 `DropdownMenuSub` 中。

<!-- @include: @/zh/meta/DropdownMenuSubTrigger.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
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

<CssVariablesTable
  :data="[
    {
      cssVariable: '--reka-dropdown-menu-content-transform-origin',
      description: '根据内容和箭头位置/偏移量计算的<Code>transform-origin</Code>',
    },
    {
      cssVariable: '--reka-dropdown-menu-content-available-width',
      description: `
        触发器和边界边缘之间的剩余宽度
      `,
    },
    {
      cssVariable: '--reka-dropdown-menu-content-available-height',
      description: '触发器和边界边缘之间的剩余高度',
    },
    {
      cssVariable: '--reka-dropdown-menu-trigger-width',
      description: '触发器的宽度',
    },
    {
      cssVariable: '--reka-dropdown-menu-trigger-height',
      description: '扳机的高度'
    },
  ]"
/>

### SubContent

打开子菜单时弹出的组件。 必须在 `DropdownMenuSub` 中。

<!-- @include: @/zh/meta/DropdownMenuSubContent.md -->

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
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

## 示例

### 子菜单

您可以通过结合使用 `DropdownMenuSub` 及其部分来创建子菜单。

```vue line=9-11,24-33
<script setup lang="ts">
import {
  DropdownMenuArrow,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'reka-ui'
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger>…</DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent>
        <DropdownMenuItem>…</DropdownMenuItem>
        <DropdownMenuItem>…</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Sub menu →</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Sub menu item</DropdownMenuItem>
              <DropdownMenuItem>Sub menu item</DropdownMenuItem>
              <DropdownMenuArrow />
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem>…</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
```

### 禁用项

您可以通过 `data-disabled` 属性向禁用的项添加特殊样式。

```vue line=16
<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui'
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger>…</DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent>
        <DropdownMenuItem
          class="DropdownMenuItem"
          disabled
        >
          …
        </DropdownMenuItem>
        <DropdownMenuItem class="DropdownMenuItem">
          …
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
```

```css line=2
/* styles.css */
.DropdownMenuItem[data-disabled] {
  color: gainsboro;
}
```

### 分割线

使用 `Separator` 部件在项之间添加分割线。

```vue line=7 ,18,20
<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'reka-ui'
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger>…</DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent>
        <DropdownMenuItem>…</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>…</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>…</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
```

### 标签

使用 `Label` 部分来帮助标记。

```vue line=5,17
<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui'
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger>…</DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent>
        <DropdownMenuLabel>Label</DropdownMenuLabel>
        <DropdownMenuItem>…</DropdownMenuItem>
        <DropdownMenuItem>…</DropdownMenuItem>
        <DropdownMenuItem>…</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
```

### 复选框项

使用 `CheckboxItem` 部件添加可选中的项目。

```vue line=5 ,26-31
<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIndicator,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'reka-ui'

const checked = ref(false)
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger>…</DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent>
        <DropdownMenuItem>…</DropdownMenuItem>
        <DropdownMenuItem>…</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem v-model="checked">
          <DropdownMenuItemIndicator>
            <Icon icon="radix-icons:check" />
          </DropdownMenuItemIndicator>
          Checkbox item
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
```

### 单选项

使用 `RadioGroup` 和 `RadioItem` 部件添加可选中的项。

```vue line=8-9,22-41
<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import {
  DropdownMenuContent,
  DropdownMenuItemIndicator,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui'

const color = ref(false)
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger>…</DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup v-model="color">
          <DropdownMenuRadioItem value="red">
            <DropdownMenuItemIndicator>
              <Icon icon="radix-icons:check" />
            </DropdownMenuItemIndicator>
            Red
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="blue">
            <DropdownMenuItemIndicator>
              <Icon icon="radix-icons:check" />
            </DropdownMenuItemIndicator>
            Blue
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="green">
            <DropdownMenuItemIndicator>
              <Icon icon="radix-icons:check" />
            </DropdownMenuItemIndicator>
            Green
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
```

### 复杂项

您可以在 `Item` 部件中添加额外的装饰元素，例如图像。

```vue line=17,21
<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui'
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger>…</DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <img src="…">
          Adolfo Hess
        </DropdownMenuItem>
        <DropdownMenuItem>
          <img src="…">
          Miyah Myles
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
```

### 限制内容/子内容大小

您可能希望限制内容（或子内容）的宽度，使其与触发器（或子触发器）的宽度匹配。您可能还希望将其高度限制为不超过视口。

我们暴露了几个 CSS 自定义属性，例如 `--reka-dropdown-menu-trigger-width` 和 `--reka-dropdown-menu-content-available-height` 来支持这一点。使用它们来限制内容维度。

```vue line=9
<script setup lang="ts">
import { DropdownMenuContent, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from 'reka-ui'
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger>…</DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        class="DropdownMenuContent"
        :side-offset="5"
      >
        …
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
```

```css line=3-4
/* styles.css */
.DropdownMenuContent {
  width: var(--reka-dropdown-menu-trigger-width);
  max-height: var(--reka-dropdown-menu-content-available-height);
}
```

### 原点感知（Origin-aware）动画

我们暴露了一个 CSS 自定义属性 `--reka-dropdown-menu-content-transform-origin`。使用它可以根据 `side`、`sideOffset`、`align`、`alignOffset` 和任何碰撞从其计算的原点对内容进行动画处理。

```vue line=9
<script setup lang="ts">
import { DropdownMenuContent, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from 'reka-ui'
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger>…</DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent class="DropdownMenuContent">
        …
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
```

```css line=3
/* styles.css */
.DropdownMenuContent {
  transform-origin: var(--reka-dropdown-menu-content-transform-origin);
  animation: scaleIn 0.5s ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### 碰撞感知（Collision-aware）动画

我们暴露 `data-side` 和 `data-align` 属性。它们的值将在运行时更改以反映碰撞。使用它们创建碰撞和方向感知动画。

```vue line=9
<script setup lang="ts">
import { DropdownMenuContent, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from 'reka-ui'
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger>…</DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent class="DropdownMenuContent">
        …
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
```

```css line=6-11
/* styles.css */
.DropdownMenuContent {
  animation-duration: 0.6s;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}
.DropdownMenuContent[data-side="top"] {
  animation-name: slideUp;
}
.DropdownMenuContent[data-side="bottom"] {
  animation-name: slideDown;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## 无障碍

遵循[菜单按钮 WAI-ARIA 设计模式](https://www.w3.org/WAI/ARIA/apg/patterns/menubutton)并使用[浮动 tabindex](https://www.w3.org/WAI/ARIA/apg/patterns/kbd_roving_tabindex)来管理菜单项之间的焦点移动。

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['Space'],
      description: `
        <span>
          当焦点在<Code>DropdownMenuTrigger</Code>时，打开下拉菜单并聚焦第一项。
          <br/>
          当焦点在项上时，激活焦点项。
        </span>
      `,
    },
    {
      keys: ['Enter'],
      description: `
        <span>
          当焦点在<Code>DropdownMenuTrigger</Code>时，打开下拉菜单并聚焦第一项。
          <br/>
          当焦点在项上时，激活焦点项。
        </span>
      `,
    },
    {
      keys: ['ArrowDown'],
      description: `
        <span>
          当焦点在<Code>DropdownMenuTrigger</Code>时，打开下拉菜单。
          <br />
          当焦点在项上时，将焦点移动到下一项。
        </span>
      `,
    },
    {
      keys: ['ArrowUp'],
      description: `
        <span>当焦点在项上时，将焦点移动到前一项。</span>
      `,
    },
    {
      keys: ['ArrowRight', 'ArrowLeft'],
      description: `
        <span>
          当焦点在<Code>DropdownMenuSubTrigger</Code>时，根据阅读方向打开或关闭子菜单。
        </span>
      `,
    },
    {
      keys: ['Esc'],
      description: `
        <span>
          关闭下拉菜单并将焦点移动到<Code>DropdownMenuTrigger</Code>.
        </span>
      `,
    },
  ]"
/>

## 自定义 API

通过将原始部分抽象到自己的组件中创建你自己的 API。

### 抽象化箭头和项指示符

此示例抽象化了 `DropdownMenuArrow` 和 `DropdownMenuItemIndicator` 部件。它还包装了 `CheckboxItem` 和 `RadioItem` 的实现细节。

#### 使用

```vue
<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './your-dropdown-menu'
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger>DropdownMenu trigger</DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>Item</DropdownMenuItem>
      <DropdownMenuLabel>Label</DropdownMenuLabel>
      <DropdownMenuGroup>Group</DropdownMenuGroup>
      <DropdownMenuCheckboxItem>CheckboxItem</DropdownMenuCheckboxItem>
      <DropdownMenuSeparator>Separator</DropdownMenuSeparator>
      <DropdownMenuRadioGroup>
        <DropdownMenuRadioItem>RadioItem</DropdownMenuRadioItem>
        <DropdownMenuRadioItem>RadioItem</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
```

#### 实现

```ts
// your-dropdown-menu.ts
export { default as DropdownMenuContent } from 'DropdownMenuContent.vue'
export { default as DropdownMenuCheckboxItem } from 'DropdownMenuCheckboxItem.vue'
export { default as DropdownMenuRadioItem } from 'DropdownMenuRadioItem.vue'

export {
  DropdownMenuRoot as DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator
} from 'reka-ui'
```

```vue
<!-- DropdownMenuContent.vue -->
<script setup lang="ts">
import { DropdownMenuContent, type DropdownMenuContentEmits, type DropdownMenuContentProps, DropdownMenuPortal, useForwardPropsEmits, } from 'reka-ui'

const props = defineProps<DropdownMenuContentProps>()
const emits = defineEmits<DropdownMenuContentEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DropdownMenuPortal>
    <DropdownMenuContent v-bind="forwarded">
      <slot />
    </DropdownMenuContent>
  </DropdownMenuPortal>
</template>
```

```vue
<!-- DropdownMenuCheckboxItem.vue -->
<script setup lang="ts">
import { DropdownMenuCheckboxItem, type DropdownMenuCheckboxItemEmits, type DropdownMenuCheckboxItemProps, DropdownMenuItemIndicator, useForwardPropsEmits } from 'reka-ui'
import { CheckIcon } from '@radix-icons/vue'

const props = defineProps<DropdownMenuCheckboxItemProps>()
const emits = defineEmits<DropdownMenuCheckboxItemEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DropdownMenuCheckboxItem v-bind="forwarded">
    <span>
      <DropdownMenuItemIndicator>
        <CheckIcon />
      </DropdownMenuItemIndicator>
    </span>
    <slot />
  </DropdownMenuCheckboxItem>
</template>
```

```vue
<!-- DropdownMenuRadioItem.vue -->
<script setup lang="ts">
import { DropdownMenuItemIndicator, DropdownMenuRadioItem, type DropdownMenuRadioItemEmits, type DropdownMenuRadioItemProps, useForwardPropsEmits, } from 'reka-ui'
import { DotFilledIcon } from '@radix-icons/vue'

const props = defineProps<DropdownMenuRadioItemProps>()
const emits = defineEmits<DropdownMenuRadioItemEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DropdownMenuRadioItem v-bind="forwarded">
    <span>
      <DropdownMenuItemIndicator>
        <DotFilledIcon />
      </DropdownMenuItemIndicator>
    </span>
    <slot />
  </DropdownMenuRadioItem>
</template>
```
