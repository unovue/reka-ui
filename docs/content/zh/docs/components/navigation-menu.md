---
title: 导航菜单
description: 用于导航 Web 站点的链接集合。
name: navigation-menu
aria: https://www.w3.org/TR/wai-aria/#navigation
---

# 导航菜单

<Description>
用于导航 Web 站点的链接集合。
</Description>

<ComponentPreview name="NavigationMenu" />

## 特性

<Highlights
  :features="[
    '可以是受控的或非受控的',
    '灵活的布局结构，可管理选项卡焦点。',
    '支持子菜单',
    '可选的活动项指示器',
    '全键盘导航',
    '暴露用于高级动画的 CSS 变量',
    '支持自定义时间函数',
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
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuRoot,
  NavigationMenuSub,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from 'reka-ui'
</script>

<template>
  <NavigationMenuRoot>
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuTrigger />
        <NavigationMenuContent>
          <NavigationMenuLink />
        </NavigationMenuContent>
      </NavigationMenuItem>

      <NavigationMenuItem>
        <NavigationMenuLink />
      </NavigationMenuItem>

      <NavigationMenuItem>
        <NavigationMenuTrigger />
        <NavigationMenuContent>
          <NavigationMenuSub>
            <NavigationMenuList />
            <NavigationMenuViewport />
          </NavigationMenuSub>
        </NavigationMenuContent>
      </NavigationMenuItem>

      <NavigationMenuIndicator />
    </NavigationMenuList>

    <NavigationMenuViewport />
  </NavigationMenuRoot>
</template>
```

## API 参考

### Root

包含导航菜单的所有部分。

<!-- @include: @/zh/meta/NavigationMenuRoot.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Sub

表示子菜单。嵌套时使用它代替根部分来创建子菜单。

<!-- @include: @/zh/meta/NavigationMenuSub.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### List

包含顶级菜单项。

<!-- @include: @/zh/meta/NavigationMenuList.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Item

顶级菜单项，包含带有内容组合的链接或触发器。

<!-- @include: @/zh/meta/NavigationMenuItem.md -->

### Trigger

切换内容的按钮。

<!-- @include: @/zh/meta/NavigationMenuTrigger.md -->

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

### Content

包含与每个触发器关联的内容。

<PresenceCallout />

<!-- @include: @/zh/meta/NavigationMenuContent.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
    {
      attribute: '[data-motion]',
      values: ['to-start', 'to-end', 'from-start', 'from-end'],
    },
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
  ]"
/>

### Link

导航链接。

<!-- @include: @/zh/meta/NavigationMenuLink.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-active]',
      values: 'Present when active',
    },
  ]"
/>

### Indicator

呈现在列表下方的可选指示符元素用于突出显示当前活动的触发器。

<PresenceCallout />

<!-- @include: @/zh/meta/NavigationMenuIndicator.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['visible', 'hidden'],
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
      cssVariable: '--reka-navigation-menu-indicator-size',
      description: '指示器的大小。',
    },
    {
      cssVariable: '--reka-navigation-menu-indicator-position',
      description: '指示器的位置',
    },
  ]"
/>

### Viewport

一个可选的视口元素，用于在列表之外呈现活动内容。

<PresenceCallout />

<!-- @include: @/zh/meta/NavigationMenuViewport.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['visible', 'hidden'],
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
      cssVariable: '--reka-navigation-menu-viewport-width',
      description: '可见/隐藏时视口的宽度，根据活动内容计算',
    },
    {
      cssVariable: '--reka-navigation-menu-viewport-height',
      description: '可视/隐藏时视口的高度，根据活动内容计算',
    },
  ]"
/>

## 示例

### 纵向

您可以使用 `orientation` prop 创建垂直菜单。

```vue line=16
<script setup lang="ts">
import {
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuRoot,
  NavigationMenuSub,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from 'reka-ui'
</script>

<template>
  <NavigationMenuRoot orientation="vertical">
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuTrigger>Item one</NavigationMenuTrigger>
        <NavigationMenuContent>Item one content</NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger>Item two</NavigationMenuTrigger>
        <NavigationMenuContent>Item Two content</NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenuRoot>
</template>
```

### 灵活的布局

当您需要对 `Content` 的渲染位置进行额外控制时，请使用 `Viewport` 部分。当您的设计需要调整 DOM 结构或需要灵活性来实现[高级动画](/zh/docs/components/navigation-menu#advanced-animation)时，这会很有帮助。Tab 键焦点将自动保持。

```vue line=26
<script setup lang="ts">
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuRoot,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from 'reka-ui'
</script>

<template>
  <NavigationMenuRoot>
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuTrigger>Item one</NavigationMenuTrigger>
        <NavigationMenuContent>Item one content</NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger>Item two</NavigationMenuTrigger>
        <NavigationMenuContent>Item two content</NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>

    <!-- NavigationMenuContent will be rendered here when active  -->
    <NavigationMenuViewport />
  </NavigationMenuRoot>
</template>
```

### 指示器

您可以使用可选的 `Indicator` 部分来高亮显示当前活动的 `Trigger`，当您想要提供动画视觉提示（如箭头或高光）以伴随 `Viewport` 时，这非常有用。

```vue line=24
<script setup lang="ts">
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuRoot,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from 'reka-ui'
</script>

<template>
  <NavigationMenuRoot>
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuTrigger>Item one</NavigationMenuTrigger>
        <NavigationMenuContent>Item one content</NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger>Item two</NavigationMenuTrigger>
        <NavigationMenuContent>Item two content</NavigationMenuContent>
      </NavigationMenuItem>

      <NavigationMenuIndicator class="NavigationMenuIndicator" />
    </NavigationMenuList>

    <NavigationMenuViewport />
  </NavigationMenuRoot>
</template>
```

```css
/* styles.css */
.NavigationMenuIndicator {
  background-color: grey;
  position: absolute;
  transition: width, transform, 250ms ease;
}

.NavigationMenuIndicator[data-orientation="horizontal"] {
  left: 0;
  height: 3px;
  transform: translateX(var(--reka-navigation-menu-indicator-position));
  width: var(--reka-navigation-menu-indicator-size);
}
```

### 子菜单

通过嵌套 `NavigationMenu` 并使用 `Sub` 部件代替其 `Root` 来创建子菜单。子菜单的工作方式与 `Root` 导航菜单不同，并且类似于 [`Tabs`](/zh/docs/components/tabs)，因为一个项应始终处于活动状态，因此请务必分配和设置 `defaultValue`。

```vue line=7,23-34
<script setup lang="ts">
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuRoot,
  NavigationMenuSub,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from 'reka-ui'
</script>

<template>
  <NavigationMenuRoot>
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuTrigger>Item one</NavigationMenuTrigger>
        <NavigationMenuContent>Item one content</NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger>Item two</NavigationMenuTrigger>
        <NavigationMenuContent>
          <NavigationMenuSub default-value="sub1">
            <NavigationMenuList>
              <NavigationMenuItem value="sub1">
                <NavigationMenuTrigger>Sub item one</NavigationMenuTrigger>
                <NavigationMenuContent> Sub item one content </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem value="sub2">
                <NavigationMenuTrigger>Sub item two</NavigationMenuTrigger>
                <NavigationMenuContent> Sub item two content </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenuSub>
        </NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenuRoot>
</template>
```

### 使用客户端路由

如果你需要使用路由包提供的 `RouterLink` 组件，那么我们建议在 `NavigationMenuLink` 中添加 `asChild="true"`，或者设置 `as="RouterLink"` 这将确保辅助功能和一致的键盘控制：

```vue line=12-14,19-21
<script setup lang="ts">
import { NavigationMenuItem, NavigationMenuList, NavigationMenuRoot } from 'reka-ui'

// RouterLink should be injected by default if using `vue-router`
</script>

<template>
  <NavigationMenuRoot>
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuLink as-child>
          <RouterLink to="/">
            Home
          </RouterLink>
          <NavigationMenuLink />
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink
          :as="RouterLink"
          to="/about"
        >
          About
        </NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenuRoot>
</template>
```

### 高级动画

我们暴露了 `--reka-navigation-menu-viewport-[width|height]` 和 `data-motion['from-start'|'to-start'|'from-end'|'to-end']` 属性，以允许您根据进入/退出方向为 `Viewport` 大小和 `Content` 位置设置动画。

将这些与 `position: absolute;` 结合使用，可以在项目之间移动时创建平滑重叠的动画效果。

```vue line=17,23,29
<script setup lang="ts">
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuRoot,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from 'reka-ui'
</script>

<template>
  <NavigationMenuRoot>
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuTrigger>Item one</NavigationMenuTrigger>
        <NavigationMenuContent class="NavigationMenuContent">
          Item one content
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger>Item two</NavigationMenuTrigger>
        <NavigationMenuContent class="NavigationMenuContent">
          Item two content
        </NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>

    <NavigationMenuViewport class="NavigationMenuViewport" />
  </NavigationMenuRoot>
</template>
```

```css line=9-20,24,25
/* styles.css */
.NavigationMenuContent {
  position: absolute;
  top: 0;
  left: 0;
  animation-duration: 250ms;
  animation-timing-function: ease;
}
.NavigationMenuContent[data-motion="from-start"] {
  animation-name: enterFromLeft;
}
.NavigationMenuContent[data-motion="from-end"] {
  animation-name: enterFromRight;
}
.NavigationMenuContent[data-motion="to-start"] {
  animation-name: exitToLeft;
}
.NavigationMenuContent[data-motion="to-end"] {
  animation-name: exitToRight;
}

.NavigationMenuViewport {
  position: relative;
  width: var(--reka-navigation-menu-viewport-width);
  height: var(--reka-navigation-menu-viewport-height);
  transition: width, height, 250ms ease;
}

@keyframes enterFromRight {
  from {
    opacity: 0;
    transform: translateX(200px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes enterFromLeft {
  from {
    opacity: 0;
    transform: translateX(-200px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes exitToRight {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(200px);
  }
}

@keyframes exitToLeft {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-200px);
  }
}
```

## 无障碍

遵循[`navigation` role 要求](https://www.w3.org/TR/wai-aria-1.2/#navigation)。

### 与 menubar 的区别

`NavigationMenu` 不应该与 `menubar` 混淆，尽管此 primitive 在口语意义上共享名称 `menu` 来引用一组导航链接，但它不使用 WAI-ARIA `menu` role。这是因为 `menu` `menubars` 的行为类似于桌面应用程序窗口中最常见的原生系统菜单，因此它们具有复杂的功能，如复合焦点管理和首字符导航。

这些功能通常被认为[对于网站导航是不必要的](https://github.com/w3c/aria-practices/issues/353)，最坏的情况是会让熟悉网站模式惯例的用户感到困惑。

有关更多信息，请参阅 [Disclosure Navigation Menu](https://w3c.github.io/aria-practices/examples/disclosure/disclosure-navigation.html) 示例。

### 链接使用情况和 aria-current

对菜单中的所有导航链接使用 `NavigationMenuLink` 非常重要，这不仅适用于主列表，也适用于通过 `NavigationMenuContent` 渲染的任何内容。这将确保一致的键盘交互和可访问性，同时还可以访问 `active` prop 来设置 `aria-current` 和激活样式。有关与第三方路由组件一起使用的更多信息，请参阅[此示例](/zh/docs/components/navigation-menu#with-client-side-routing)。

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['Space', 'Enter'],
      description: `
        <span>
          当焦点在<code>NavigationMenuTrigger</code>时，打开内容。
        </span>
      `,
    },
    {
      keys: ['Tab'],
      description: '将焦点移动到下一个可聚焦元素。',
    },
    {
      keys: ['ArrowDown'],
      description: `
        <span>
          当<code>horizontal</code>并且焦点在打开的
          <code>NavigationMenuTrigger</code>时，将焦点移动到
          <code>NavigationMenuContent</code>.
          <br />
          将焦点移动到下一个<code>NavigationMenuTrigger</code>或
          <code>NavigationMenuLink</code>。
        </span>
      `,
    },
    {
      keys: ['ArrowUp'],
      description: `
        <span>
          将焦点移动到前面的<code>NavigationMenuTrigger</code>或
          <code>NavigationMenuLink</code>。
        </span>
      `,
    },
    {
      keys: ['ArrowRight', 'ArrowLeft'],
      description: `
        <span>
          当<code>vertical</code>并且焦点在打开的
          <code>NavigationMenuTrigger</code>时，将焦点移动到
          <code>NavigationMenuContent</code>.
          <br />
          将焦点移动到下一个/上一个<code>NavigationMenuTrigger</code>或<code>NavigationMenuLink</code>。
        </span>
      `,
    },
    {
      keys: ['Home', 'End'],
      description: `
        <span>
          将焦点移动到第一个/最后一个<code>NavigationMenu. Trigger</code>或
          <code>NavigationMenu.Link</code>
        </span>
      `,
    },
    {
      keys: ['Esc'],
      description: `
        <span>
          关闭打开的<code>NavigationMenu. Content</code>并将焦点移动到其
          <code>NavigationMenu.Trigger</code>。
        </span>
      `,
    },
  ]"
/>
