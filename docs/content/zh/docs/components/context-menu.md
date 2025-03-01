---

title: 上下文菜单
description: 在指针处显示一个菜单，由右键单击或长按触发。
name: context-menu
aria: https://www.w3.org/WAI/ARIA/apg/patterns/menu
---

# 上下文菜单

<Description>
在指针处显示一个菜单，由右键单击或长按触发。
</Description>

<ComponentPreview name="ContextMenu" />

## 特性

<Highlights
  :features="[
    '支持具有可配置阅读方向的子菜单',
    '支持项、标签、项组',
    '支持具有可选不确定状态的可勾选项目（单个或多个）',
    '支持模态和非模态模式',
    '自定义边、对齐方式、偏移量、冲突处理',
    '焦点完全可控',
    '全键盘导航',
    '自动补全支持',
    '取消和分层行为是高度可定制的',
    '在触摸设备上通过长按触发',
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
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuItemIndicator,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from 'reka-ui'
</script>

<template>
  <ContextMenuRoot>
    <ContextMenuTrigger />

    <ContextMenuPortal>
      <ContextMenuContent>
        <ContextMenuLabel />
        <ContextMenuItem />

        <ContextMenuGroup>
          <ContextMenuItem />
        </ContextMenuGroup>

        <ContextMenuCheckboxItem>
          <ContextMenuItemIndicator />
        </ContextMenuCheckboxItem>

        <ContextMenuRadioGroup>
          <ContextMenuRadioItem>
            <ContextMenuItemIndicator />
          </ContextMenuRadioItem>
        </ContextMenuRadioGroup>

        <ContextMenuSub>
          <ContextMenuSubTrigger />
          <ContextMenuPortal>
            <ContextMenuSubContent />
          </ContextMenuPortal>
        </ContextMenuSub>

        <ContextMenuSeparator />
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>
```

## API 参考

遵循[菜单 WAI-ARIA 设计模式](https://www.w3.org/WAI/ARIA/apg/patterns/menu)并使用[移动制表符索引](https://www.w3.org/TR/wai-aria-practices-1.2/examples/menu-button/menu-button-actions.html)来管理菜单项之间的焦点移动。

### Root

包含上下文菜单的所有部分。

<!-- @include: @/zh/meta/ContextMenuRoot.md -->

### Trigger

打开上下文菜单的区域。将其包裹在你希望通过右键点击（或使用相关键盘快捷键）打开上下文菜单的目标周围。

<!-- @include: @/zh/meta/ContextMenuTrigger.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
  ]"
/>

### Portal

使用时，将内容部分传送到 `body`。

<!-- @include: @/zh/meta/ContextMenuPortal.md -->

### Content

在打开的上下文菜单中弹出的组件。

<!-- @include: @/zh/meta/ContextMenuContent.md -->

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
      cssVariable: '--reka-context-menu-content-transform-origin',
      description: `
        根据内容和箭头位置/偏移量计算的<Code>transform-origin</Code>
      `,
    },
    {
      cssVariable: '--reka-context-menu-content-available-width',
      description: `
        触发器和边界边缘之间的剩余宽度
      `,
    },
    {
      cssVariable: '--reka-context-menu-content-available-height',
      description: `
        触发器和边界边缘之间的剩余高度
      `,
    },
    {
      cssVariable: '--reka-context-menu-trigger-width',
      description: `触发器的宽度`,
    },
    {
      cssVariable: '--reka-context-menu-trigger-height',
      description: '扳机的高度',
    },
  ]"
/>

### Arrow

一个可选的箭头元素，与子菜单一起呈现。这可用于在视觉上帮助将触发项与 `ContextMenu.Content` 联系起来。必须在 `ContextMenu.Content`内部呈现。

<!-- @include: @/zh/meta/ContextMenuArrow.md -->

### Item

包含上下文菜单项的组件。

<!-- @include: @/zh/meta/ContextMenuItem.md -->

<DataAttributesTable
  :data="[
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

用于对多个 `ContextMenu.Item` 进行分组。

<!-- @include: @/zh/meta/ContextMenuGroup.md -->

### Label

用于呈现标签。无法使用箭头键聚焦。

<!-- @include: @/zh/meta/ContextMenuLabel.md -->

### CheckboxItem

可以像复选框一样控制和呈现的项。

<!-- @include: @/zh/meta/ContextMenuCheckboxItem.md -->

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

用于对多个 `ContextMenu.RadioItem` 进行分组。

<!-- @include: @/zh/meta/ContextMenuRadioGroup.md -->

### RadioItem

一个可以像单选框一样被控制和渲染的项。

<!-- @include: @/zh/meta/ContextMenuRadioItem.md -->

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

选中父级 `ContextMenu.CheckboxItem` 或 `ContextMenu.RadioItem` 时呈现。您可以直接设置此元素的样式，也可以将其用作包装器以放入图标，或两者兼而有之。

<!-- @include: @/zh/meta/ContextMenuItemIndicator.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['checked', 'unchecked', 'indeterminate'],
    },
  ]"
/>

### Separator

用于在上下文菜单中直观地分隔项目。

<!-- @include: @/zh/meta/ContextMenuSeparator.md -->

### Sub

包含子菜单的所有部分。

<!-- @include: @/zh/meta/ContextMenuSub.md -->

### SubTrigger

打开子菜单的项目。必须在 `ContextMenu.Sub` 中。

<!-- @include: @/zh/meta/ContextMenuSubTrigger.md -->

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

### SubContent

打开子菜单时弹出的组件。必须在 `ContextMenu.Sub` 中。

<!-- @include: @/zh/meta/ContextMenuSubContent.md -->

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
      cssVariable: '--reka-context-menu-content-transform-origin',
      description: `
        根据内容和箭头位置/偏移量计算的<Code>transform-origin</Code>
      `,
    },
    {
      cssVariable: '--reka-context-menu-content-available-width',
      description: `触发器和边界边缘之间的剩余宽度`,
    },
    {
      cssVariable: '--reka-context-menu-content-available-height',
      description: `触发器和边界边缘之间的剩余高度`,
    },
    {
      cssVariable: '--reka-context-menu-trigger-width',
      description: '触发器的宽度',
    },
    {
      cssVariable: '--reka-context-menu-trigger-height',
      description: '扳机的高度',
    },
  ]"
/>

## 示例

### 子菜单

你可以通过使用 `ContextMenuSub` 与其部分相结合来创建子菜单。

```vue line=24-33
<script setup lang="ts">
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from 'reka-ui'
</script>

<template>
  <ContextMenuRoot>
    <ContextMenuTrigger>…</ContextMenuTrigger>
    <ContextMenuPortal>
      <ContextMenuContent>
        <ContextMenuItem>…</ContextMenuItem>
        <ContextMenuItem>…</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>Sub menu →</ContextMenuSubTrigger>
          <ContextMenuPortal>
            <ContextMenuSubContent>
              <ContextMenuItem>Sub menu item</ContextMenuItem>
              <ContextMenuItem>Sub menu item</ContextMenuItem>
              <ContextMenuArrow />
            </ContextMenuSubContent>
          </ContextMenuPortal>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem>…</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>
```

### 禁用项

你可以通过 `data-disabled` 属性为禁用项添加特殊样式。

```vue line=10
<script setup lang="ts">
import { ContextMenuContent, ContextMenuItem, ContextMenuPortal, ContextMenuRoot, ContextMenuTrigger } from 'reka-ui'
</script>

<template>
  <ContextMenuRoot>
    <ContextMenuTrigger>…</ContextMenuTrigger>
    <ContextMenuPortal>
      <ContextMenuContent>
        <ContextMenuItem
          class="ContextMenuItem"
          disabled
        >
          …
        </ContextMenuItem>
        <ContextMenuItem class="ContextMenuItem">
          …
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>
```

```css line=2
/* styles.css */
.ContextMenuItem[data-disabled] {
  color: gainsboro;
}
```

### 分割线

使用 `Separator` 部件在项之间添加分割线。

```vue line=8,18,20
<script setup lang="ts">
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from 'reka-ui'
</script>

<template>
  <ContextMenuRoot>
    <ContextMenuTrigger>…</ContextMenuTrigger>
    <ContextMenuPortal>
      <ContextMenuContent>
        <ContextMenuItem>…</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>…</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>…</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>
```

### 标签

使用 `Label` 部分来帮助标记一个部分。

```vue line=5,17
<script setup lang="ts">
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRoot,
  ContextMenuTrigger,
} from 'reka-ui'
</script>

<template>
  <ContextMenuRoot>
    <ContextMenuTrigger>…</ContextMenuTrigger>
    <ContextMenuPortal>
      <ContextMenuContent>
        <ContextMenuLabel>Label</ContextMenuLabel>
        <ContextMenuItem>…</ContextMenuItem>
        <ContextMenuItem>…</ContextMenuItem>
        <ContextMenuItem>…</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>
```

### 复选框项

使用 `CheckboxItem` 部分添加一个可以被选中的项。

```vue line=3,25-30
<script setup lang="ts">
import {
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuItemIndicator,
  ContextMenuPortal,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from 'reka-ui'
import { Icon } from '@iconify/vue'

const checked = ref(true)
</script>

<template>
  <ContextMenuRoot>
    <ContextMenuTrigger>…</ContextMenuTrigger>
    <ContextMenuPortal>
      <ContextMenuContent>
        <ContextMenuItem>…</ContextMenuItem>
        <ContextMenuItem>…</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem v-model="checked">
          <ContextMenuItemIndicator>
            <Icon icon="radix-icons:check" />
          </ContextMenuItemIndicator>
          Checkbox item
        </ContextMenuCheckboxItem>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>
```

### 单选项

使用 `RadioGroup` 和 `RadioItem` 部分添加一个可以在其他项中进行选择的项。

```vue line=8,9,24-43
<script setup lang="ts">
import {
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuItemIndicator,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from 'reka-ui'
import { Icon } from '@iconify/vue'

const color = ref('blue')
</script>

<template>
  <ContextMenuRoot>
    <ContextMenuTrigger>…</ContextMenuTrigger>
    <ContextMenuPortal>
      <ContextMenuContent>
        <ContextMenuRadioGroup v-model="color">
          <ContextMenuRadioItem value="red">
            <ContextMenuItemIndicator>
              <Icon icon="radix-icons:check" />
            </ContextMenuItemIndicator>
            Red
          </ContextMenuRadioItem>
          <ContextMenuRadioItem value="blue">
            <ContextMenuItemIndicator>
              <Icon icon="radix-icons:check" />
            </ContextMenuItemIndicator>
            Blue
          </ContextMenuRadioItem>
          <ContextMenuRadioItem value="green">
            <ContextMenuItemIndicator>
              <Icon icon="radix-icons:check" />
            </ContextMenuItemIndicator>
            Green
          </ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>
```

### 复杂项

你可以在 `Item` 部分中添加额外的装饰元素，例如图片。

```vue line=11,15
<script setup lang="ts">
import { ContextMenuContent, ContextMenuItem, ContextMenuPortal, ContextMenuRoot, ContextMenuTrigger } from 'reka-ui'
</script>

<template>
  <ContextMenuRoot>
    <ContextMenuTrigger>…</ContextMenuTrigger>
    <ContextMenuPortal>
      <ContextMenuContent>
        <ContextMenuItem>
          <img src="…">
          Adolfo Hess
        </ContextMenuItem>
        <ContextMenuItem>
          <img src="…">
          Miyah Myles
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>
```

### 约束内容/子内容的大小

你可能希望限制内容（或子内容）的宽度，使其与触发器（或子触发器）的宽度相匹配。你可能还希望限制其高度不超过视口。

我们暴露了几个 CSS 自定义属性，如 `--reka-context-menu-trigger-width` 和 `--reka-context-menu-content-available-height` 来支持这一点。使用它们来限制内容尺寸。

```vue line=9
<script setup lang="ts">
import { ContextMenuContent, ContextMenuItem, ContextMenuPortal, ContextMenuRoot, ContextMenuTrigger } from 'reka-ui'
</script>

<template>
  <ContextMenuRoot>
    <ContextMenuTrigger>…</ContextMenuTrigger>
    <ContextMenuPortal>
      <ContextMenuContent class="ContextMenuContent">
        …
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>
```

```css
/* styles.css */
.ContextMenuContent {
  width: var(--reka-context-menu-trigger-width);
  max-height: var(--reka-context-menu-content-available-height);
}
```

### 原点感知（Origin-aware）动画

我们暴露了一个 CSS 自定义属性 `--reka-context-menu-content-transform-origin`。使用它可以根据 `side`、`sideOffset`、`align`、`alignOffset` 以及任何碰撞情况，从其计算出的原点对内容进行动画处理。

```vue line=9
<script setup lang="ts">
import { ContextMenuContent, ContextMenuPortal, ContextMenuRoot, ContextMenuTrigger } from 'reka-ui'
</script>

<template>
  <ContextMenuRoot>
    <ContextMenuTrigger>…</ContextMenuTrigger>
    <ContextMenuPortal>
      <ContextMenuContent class="ContextMenuContent">
        …
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>
```

```css line=3
/* styles.css */
.ContextMenuContent {
  transform-origin: var(--reka-context-menu-content-transform-origin);
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

我们暴露了 `data-side` 和 `data-align` 属性。它们的值将在运行时改变以反映碰撞。使用它们来创建具有碰撞和方向感知的动画。

```vue line=9
<script setup lang="ts">
import { ContextMenuContent, ContextMenuPortal, ContextMenuRoot, ContextMenuTrigger } from 'reka-ui'
</script>

<template>
  <ContextMenuRoot>
    <ContextMenuTrigger>…</ContextMenuTrigger>
    <ContextMenuPortal>
      <ContextMenuContent class="ContextMenuContent">
        …
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>
```

```css line=6-11
/* styles.css */
.ContextMenuContent {
  animation-duration: 0.6s;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}
.ContextMenuContent[data-side="top"] {
  animation-name: slideUp;
}
.ContextMenuContent[data-side="bottom"] {
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

使用[浮动 tabindex](https://www.w3.org/WAI/ARIA/apg/patterns/kbd_roving_tabindex)来管理菜单项之间的焦点移动。

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['Space'],
      description: `<span>激活焦点项。</span>`
    },
    {
      keys: ['Enter'],
      description: '<span>激活焦点项。</span>',
    },
    {
      keys: ['ArrowDown'],
      description: '<span>将焦点移动到下一项。</span>',
    },
    {
      keys: ['ArrowUp'],
      description: '<span>将焦点移动到前一项。</span>',
    },
    {
      keys: ['ArrowRight', 'ArrowLeft'],
      description: `
        <span>
          当焦点在<Code>ContextMenu. SubTrigger</Code>时，根据阅读方向打开或关闭子菜单。
        </span>
      `,
    },
    {
      keys: ['Esc'],
      description: '关闭上下文菜单',
    },
  ]"
/>
