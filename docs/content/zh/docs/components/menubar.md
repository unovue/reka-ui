---

title: 菜单栏
description: 桌面应用程序中常见的视觉持久菜单，用于快速访问一组一致的命令。
name: menubar
aria: https://www.w3.org/WAI/ARIA/apg/patterns/menu/
---

# 菜单栏

<Description>
桌面应用程序中常见的视觉持久菜单，用于快速访问一组一致的命令。
</Description>

<ComponentPreview name="Menubar" />

## 特性

<Highlights
  :features="[
    '可以是受控的或非受控的',
    '支持具有可配置读取方向的子菜单',
    '支持项、标签、项组',
    '支持可勾选项（单个或多个）',
    '自定义边、对齐方式、偏移量、冲突处理',
    '（可选）呈现指向箭头',
    '焦点完全可控',
    '全键盘导航',
    '自动补全支持',
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
  MenubarArrow,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarItemIndicator,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarRoot,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from './'
</script>

<template>
  <MenubarRoot>
    <MenubarMenu>
      <MenubarTrigger />
      <MenubarPortal>
        <MenubarContent>
          <MenubarLabel />
          <MenubarItem />

          <MenubarGroup>
            <MenubarItem />
          </MenubarGroup>

          <MenubarCheckboxItem>
            <MenubarItemIndicator />
          </MenubarCheckboxItem>

          <MenubarRadioGroup>
            <MenubarRadioItem>
              <MenubarItemIndicator />
            </MenubarRadioItem>
          </MenubarRadioGroup>

          <MenubarSub>
            <MenubarSubTrigger />
            <MenubarPortal>
              <MenubarSubContent />
            </MenubarPortal>
          </MenubarSub>

          <MenubarSeparator />
          <MenubarArrow />
        </MenubarContent>
      </MenubarPortal>
    </MenubarMenu>
  </MenubarRoot>
</template>
```

## API 参考

### Root

包含菜单栏的所有部分

<!-- @include: @/zh/meta/MenubarRoot.md -->

### Menu

顶级菜单项，包含具有内容组合的触发器。

<!-- @include: @/zh/meta/MenubarMenu.md -->

### Trigger

用于切换内容的按钮。默认情况下，`MenubarContent` 会将自身定位在触发器上。

<!-- @include: @/zh/meta/MenubarTrigger.md -->

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

### Portal

使用时，将内容部分传送到 `body` 中。

<!-- @include: @/zh/meta/MenubarPortal.md -->

### Content

打开菜单时弹出的组件。

<!-- @include: @/zh/meta/MenubarContent.md -->

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
      cssVariable: '--reka-menubar-content-transform-origin',
      description: `
        根据内容和箭头位置/偏移量计算的<Code>transform-origin</Code>
      `,
    },
    {
      cssVariable: '--reka-menubar-content-available-width',
      description: `
        触发器和边界边缘之间的剩余宽度
      `,
    },
    {
      cssVariable: '--reka-menubar-content-available-height',
      description: `
        触发器和边界边缘之间的剩余高度
      `,
    },
    {
      cssVariable: '--reka-menubar-trigger-width',
      description: '触发器的宽度',
    },
    {
      cssVariable: '--reka-menubar-trigger-height',
      description: '扳机的高度',
    },
  ]"
/>

### Arrow

一个可选的箭头元素，与菜单栏菜单一起渲染。这可用于帮助视觉上将触发器与 `MenubarContent` 链接起来。必须在 `MenubarContent` 中。

<!-- @include: @/zh/meta/MenubarArrow.md -->

### Item

包含菜单栏项的组件。

<!-- @include: @/zh/meta/MenubarItem.md -->

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

用于对多个 `MenubarItem` 进行分组。

<!-- @include: @/zh/meta/MenubarGroup.md -->

### Label

用于渲染标签。无法使用箭头键聚焦。

<!-- @include: @/zh/meta/MenubarLabel.md -->

### CheckboxItem

一个可以像复选框一样受控和渲染的项。

<!-- @include: @/zh/meta/MenubarCheckboxItem.md -->

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

### RadioGroup

用于对多个 `MenubarRadioItem` 进行分组。

<!-- @include: @/zh/meta/MenubarRadioGroup.md -->

### RadioItem

一个可以像单选框一样受控和渲染的项。

<!-- @include: @/zh/meta/MenubarRadioItem.md -->

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

在选中父 `MenubarCheckboxItem` 或 `MenubarRadioItem` 时渲染。您可以直接设置此元素的样式，也可以将其用作包装器以将图标放入其中，或两者兼而有之。

<!-- @include: @/zh/meta/MenubarItemIndicator.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['checked', 'unchecked'],
    },
  ]"
/>

### Separator

用于视觉上分隔菜单栏菜单中的项。

<!-- @include: @/zh/meta/MenubarSeparator.md -->

### Sub

包含子菜单的所有部分。

<!-- @include: @/zh/meta/MenubarSub.md -->

### SubTrigger

打开子菜单的项。必须在 `MenubarSub` 中。

<!-- @include: @/zh/meta/MenubarSubTrigger.md -->

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

打开子菜单时弹出的组件。 必须在 `MenubarSub` 中。

<!-- @include: @/zh/meta/MenubarSubContent.md -->

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
      cssVariable: '--reka-menubar-content-transform-origin',
      description: `
        根据内容和箭头位置/偏移量计算的<Code>transform-origin</Code>
      `,
    },
    {
      cssVariable: '--reka-menubar-content-available-width',
      description: `
        触发器和边界边缘之间的剩余宽度
      `,
    },
    {
      cssVariable: '--reka-menubar-content-available-height',
      description: `
        触发器和边界边缘之间的剩余高度
      `,
    },
    {
      cssVariable: '--reka-menubar-trigger-width',
      description: '触发器的宽度',
    },
    {
      cssVariable: '--reka-menubar-trigger-height',
      description: '扳机的高度',
    },
  ]"
/>

## 示例

### 子菜单

您可以通过将 `MenubarSub` 与其部件结合使用来创建子菜单。

```vue line=9-11,25-34
<script setup lang="ts">
import {
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarPortal,
  MenubarRoot,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from 'reka-ui'
</script>

<template>
  <MenubarRoot>
    <MenubarMenu>
      <MenubarTrigger>…</MenubarTrigger>
      <MenubarPortal>
        <MenubarContent>
          <MenubarItem>…</MenubarItem>
          <MenubarItem>…</MenubarItem>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>Sub menu →</MenubarSubTrigger>
            <MenubarPortal>
              <MenubarSubContent>
                <MenubarItem>Sub menu item</MenubarItem>
                <MenubarItem>Sub menu item</MenubarItem>
                <MenubarArrow />
              </MenubarSubContent>
            </MenubarPortal>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem>…</MenubarItem>
        </MenubarContent>
      </MenubarPortal>
    </MenubarMenu>
  </MenubarRoot>
</template>
```

### 禁用项

您可以通过 `data-disabled` 属性向禁用的项添加特殊样式。

```vue line=11
<script setup lang="ts">
import { MenubarContent, MenubarItem, MenubarMenu, MenubarPortal, MenubarRoot, MenubarTrigger } from 'reka-ui'
</script>

<template>
  <MenubarRoot>
    <MenubarMenu>
      <MenubarTrigger>…</MenubarTrigger>
      <MenubarPortal>
        <MenubarContent>
          <MenubarItem
            class="MenubarItem"
            disabled
          >
            …
          </MenubarItem>
          <MenubarItem class="MenubarItem">
            …
          </MenubarItem>
        </MenubarContent>
      </MenubarPortal>
    </MenubarMenu>
  </MenubarRoot>
</template>
```

```css line=2
/* styles.css */
.MenubarItem[data-disabled] {
  color: gainsboro;
}
```

### 分割线

使用 `Separator` 部件在项之间添加分割线。

```vue line=8,20,22
<script setup lang="ts">
import {
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarPortal,
  MenubarRoot,
  MenubarSeparator,
  MenubarTrigger,
} from 'reka-ui'
</script>

<template>
  <MenubarRoot>
    <MenubarMenu>
      <MenubarTrigger>…</MenubarTrigger>
      <MenubarPortal>
        <MenubarContent>
          <MenubarItem>…</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>…</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>…</MenubarItem>
        </MenubarContent>
      </MenubarPortal>
    </MenubarMenu>
  </MenubarRoot>
</template>
```

### 标签

使用 `Label` 部分来帮助标记。

```vue line=5,19
<script setup lang="ts">
import {
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarRoot,
  MenubarTrigger,
} from 'reka-ui'
</script>

<template>
  <MenubarRoot>
    <MenubarMenu>
      <MenubarTrigger>…</MenubarTrigger>
      <MenubarPortal>
        <MenubarContent>
          <MenubarLabel>Label</MenubarLabel>
          <MenubarItem>…</MenubarItem>
          <MenubarItem>…</MenubarItem>
          <MenubarItem>…</MenubarItem>
        </MenubarContent>
      </MenubarPortal>
    </MenubarMenu>
  </MenubarRoot>
</template>
```

### 复选框项

使用 `CheckboxItem` 部件添加可选中的项目。

```vue line=3,27-32
<script setup lang="ts">
import {
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarItemIndicator,
  MenubarMenu,
  MenubarPortal,
  MenubarRoot,
  MenubarSeparator,
  MenubarTrigger,
} from 'reka-ui'
import { Icon } from '@iconify/vue'

const checked = ref(true)
</script>

<template>
  <MenubarRoot>
    <MenubarMenu>
      <MenubarTrigger>…</MenubarTrigger>
      <MenubarPortal>
        <MenubarContent>
          <MenubarItem>…</MenubarItem>
          <MenubarItem>…</MenubarItem>
          <MenubarSeparator />
          <MenubarCheckboxItem v-model="checked">
            <MenubarItemIndicator>
              <Icon icon="radix-icons:check" />
            </MenubarItemIndicator>
            Checkbox item
          </MenubarCheckboxItem>
        </MenubarContent>
      </MenubarPortal>
    </MenubarMenu>
  </MenubarRoot>
</template>
```

### 单选项

使用 `RadioGroup` 和 `RadioItem` 部件添加可选中的项。

```vue line=9-10,26-39
<script setup lang="ts">
import {
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarItemIndicator,
  MenubarMenu,
  MenubarPortal,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarRoot,
  MenubarSeparator,
  MenubarTrigger,
} from 'reka-ui'
import { Icon } from '@iconify/vue'

const color = ref('blue')
</script>

<template>
  <MenubarRoot>
    <MenubarMenu>
      <MenubarTrigger>…</MenubarTrigger>
      <MenubarPortal>
        <MenubarContent>
          <MenubarRadioGroup v-model="color">
            <MenubarRadioItem value="red">
              <MenubarItemIndicator>
                <Icon icon="radix-icons:check" />
              </MenubarItemIndicator>
              Red
            </MenubarRadioItem>
            <MenubarRadioItem value="blue">
              <MenubarItemIndicator>
                <Icon icon="radix-icons:check" />
              </MenubarItemIndicator>
              Blue
            </MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarContent>
      </MenubarPortal>
    </MenubarMenu>
  </MenubarRoot>
</template>
```

### 复杂项

您可以在 `Item` 部件中添加额外的装饰元素，例如图像。

```vue line=12,16
<script setup lang="ts">
import { MenubarContent, MenubarItem, MenubarMenu, MenubarPortal, MenubarRoot, MenubarTrigger } from 'reka-ui'
</script>

<template>
  <MenubarRoot>
    <MenubarMenu>
      <MenubarTrigger>…</MenubarTrigger>
      <MenubarPortal>
        <MenubarContent>
          <MenubarItem>
            <img src="…">
            Adolfo Hess
          </MenubarItem>
          <MenubarItem>
            <img src="…">
            Miyah Myles
          </MenubarItem>
        </MenubarContent>
      </MenubarPortal>
    </MenubarMenu>
  </MenubarRoot>
</template>
```

### 限制内容/子内容大小

您可能希望限制内容（或子内容）的宽度，使其与触发器（或子触发器）的宽度匹配。您可能还希望将其高度限制为不超过视口。

我们暴露了几个 CSS 自定义属性，例如 `--reka-menubar-trigger-width` 和 `--reka-menubar-content-available-height` 来支持这一点。使用它们来限制内容维度。

```vue line=10
<script setup lang="ts">
import { MenubarContent, MenubarItem, MenubarMenu, MenubarPortal, MenubarRoot, MenubarTrigger } from 'reka-ui'
</script>

<template>
  <MenubarRoot>
    <MenubarMenu>
      <MenubarTrigger> Trigger </MenubarTrigger>
      <MenubarPortal>
        <MenubarContent
          class="MenubarContent"
          :side-offset="5"
          :align-offset="-3"
        >
          <MenubarItem> New Tab </MenubarItem>
        </MenubarContent>
      </MenubarPortal>
    </MenubarMenu>
  </MenubarRoot>
</template>
```

```css line=3-4
/* styles.css */
.MenubarContent {
  width: var(--reka-menubar-trigger-width);
  max-height: var(--reka-menubar-content-available-height);
}
```

### 原点感知（Origin-aware）动画

我们暴露了一个 CSS 自定义属性 `--reka-menubar-content-transform-origin`。使用它可以根据 `side`、`sideOffset`、`align`、`alignOffset` 和任何碰撞从其计算的原点对内容进行动画处理。

```vue line=10
<script setup lang="ts">
import { MenubarContent, MenubarMenu, MenubarPortal, MenubarRoot, MenubarTrigger } from 'reka-ui'
</script>

<template>
  <MenubarRoot>
    <MenubarMenu>
      <MenubarTrigger>…</MenubarTrigger>
      <MenubarPortal>
        <MenubarContent class="MenubarContent">
          …
        </MenubarContent>
      </MenubarPortal>
    </MenubarMenu>
  </MenubarRoot>
</template>
```

```css line=3
/* styles.css */
.MenubarContent {
  transform-origin: var(--reka-menubar-content-transform-origin);
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

```vue line=10
<script setup lang="ts">
import { MenubarContent, MenubarMenu, MenubarPortal, MenubarRoot, MenubarTrigger } from 'reka-ui'
</script>

<template>
  <MenubarRoot>
    <MenubarMenu>
      <MenubarTrigger>…</MenubarTrigger>
      <MenubarPortal>
        <MenubarContent class="MenubarContent">
          …
        </MenubarContent>
      </MenubarPortal>
    </MenubarMenu>
  </MenubarRoot>
</template>
```

```css line=6-11
/* styles.css */
.MenubarContent {
  animation-duration: 0.6s;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}
.MenubarContent[data-side="top"] {
  animation-name: slideUp;
}
.MenubarContent[data-side="bottom"] {
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
        当焦点位于<Code>MenubarTrigger</Code>时，打开菜单栏并聚焦第一项。
        <br />
        当焦点位于某项上时，激活焦点项。
      `,
    },
    {
      keys: ['Enter'],
      description: `
        When focus is on <Code>MenubarTrigger</Code>, opens the associated menu.
        <br />
        当焦点位于某项上时，激活焦点项。
      `,
    },
    {
      keys: ['ArrowDown'],
      description: `
        When focus is on <Code>MenubarTrigger</Code>, opens the associated menu.
        <br />
        当焦点位于某项上时，将焦点移动到下一项。
      `,
    },
    {
      keys: ['ArrowUp'],
      description: `当焦点位于某项上时，将焦点移动到前一项。`,
    },
    {
      keys: ['ArrowRight', 'ArrowLeft'],
      description: `
        当焦点在<Code>MenubarTrigger</Code>上时，将焦点移动到下一个或上一个项。<br/>当焦点在<Code>MenubarSubTrigger</Code>上时，根据阅读方向打开或关闭子菜单。<br/>当焦点在<Code>MenubarContent</Code>内时，打开菜单栏中的下一个菜单
      `,
    },
    {
      keys: ['Esc'],
      description: `
        关闭当前打开的菜单并将焦点移动到其<Code>MenubarTrigger</Code>。
      `,
    },
  ]"
/>
