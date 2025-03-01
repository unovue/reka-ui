---

title: 对话框
description: 一个覆盖在主窗口或另一个对话框窗口上的窗口，使下面的内容无效。
name: dialog
aria: https://www.w3.org/WAI/ARIA/apg/patterns/dialogmodal
---

# 对话框

<Description>
一个覆盖在主窗口或另一个对话框窗口上的窗口，使下面的内容无效。
</Description>

<ComponentPreview name="Dialog" />

## 特性

<Highlights
  :features="[
    '支持模态和非模态模式',
    '模态时自动捕获焦点',
    '可以是受控的或非受控的',
    '<span>使用<Code>Title</Code>和<Code>Description</Code>组件管理屏幕阅读器声明</span>',
    'Esc 可自动关闭该组件',
  ]"
/>

## 安装

从命令行安装组件。

<InstallationTabs value="reka-ui" />

## 组件解析

导入所有零件并将它们拼凑在一起。

```vue
<script setup>
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui'
</script>

<template>
  <DialogRoot>
    <DialogTrigger />
    <DialogPortal>
      <DialogOverlay />
      <DialogContent>
        <DialogTitle />
        <DialogDescription />
        <DialogClose />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
```

## API 参考

### Root

包含对话框的所有部分

<!-- @include: @/zh/meta/DialogRoot.md -->

### Trigger

打开对话框的按钮

<!-- @include: @/zh/meta/DialogTrigger.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
  ]"
/>

### Portal

使用时，将您的覆盖和内容部分传送到 `body` 中。

<!-- @include: @/zh/meta/DialogPortal.md -->

### Overlay

打开对话框时覆盖视图惰性部分的层。

<PresenceCallout />

<!-- @include: @/zh/meta/DialogOverlay.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
  ]"
/>

### Content

包含要在打开对话框中呈现的内容

<PresenceCallout />

<!-- @include: @/zh/meta/DialogContent.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
  ]"
/>

### Close

关闭对话框的按钮

<!-- @include: @/zh/meta/DialogClose.md -->

### Title

对话框打开时声明的无障碍标题。

如果您想隐藏标题，请将其包装在我们的视觉隐藏实用组件，如 `<VisuallyHidden asChild>`。

<!-- @include: @/zh/meta/DialogTitle.md -->

### Description

可选的对话框打开时声明的无障碍描述。

如果您想隐藏描述，请将其包装在我们的 `Visual Hidden` 实用组件，如下所示 `<VisuallyHidden asChild>`。如果您想完全删除描述，请删除此部分并将 `:aria-describedby="undefined"` 传递给 `DialogContent`。

<!-- @include: @/zh/meta/DialogDescription.md -->

## 示例

### 嵌套对话框

您可以嵌套多层对话框。

<ComponentPreview name="DialogNested" />

### 异步表单提交后关闭

异步操作完成后，使用受控属性以程序方式关闭对话框。

```vue line=4,5,15-19,22-24
<script setup>
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTrigger } from 'reka-ui'

const wait = () => new Promise(resolve => setTimeout(resolve, 1000))
const open = ref(false)
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger>Open</DialogTrigger>
    <DialogPortal>
      <DialogOverlay />
      <DialogContent>
        <form
          @submit.prevent="
            (event) => {
              wait().then(() => (open = false));
            }
          "
        >
          <!-- some inputs -->
          <button type="submit">
            Submit
          </button>
        </form>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
```

### 可滚动覆盖层

将覆盖层内部的内容移动，以呈现带有溢出的对话框。

```vue
// index.vue
<script setup>
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTrigger } from 'reka-ui'
import './styles.css'
</script>

<template>
  <DialogRoot>
    <DialogTrigger />
    <DialogPortal>
      <DialogOverlay class="DialogOverlay">
        <DialogContent class="DialogContent">
          ...
        </DialogContent>
      </DialogOverlay>
    </DialogPortal>
  </DialogRoot>
</template>
```

```css
/* styles.css */
.DialogOverlay {
  background: rgba(0 0 0 / 0.5);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  place-items: center;
  overflow-y: auto;
}

.DialogContent {
  min-width: 300px;
  background: white;
  padding: 30px;
  border-radius: 4px;
}
```

然而，这种方法有一个需要注意的地方，即用户可能会意外地点击滚动条并关闭对话框。目前没有通用的解决方案来解决这个问题，但是你可以将以下代码片段添加到 `DialogContent` 中，以防止在点击滚动条时关闭模态框。

```vue
<DialogContent
  @pointer-down-outside="(event) => {
    const originalEvent = event.detail.originalEvent;
    const target = originalEvent.target as HTMLElement;
    if (originalEvent.offsetX > target.clientWidth || originalEvent.offsetY > target.clientHeight) {
      event.preventDefault();
    }
  }"
>
```

### 传送到自定义容器

自定义对话框传送的元素。

```vue line=4,11,17
<script setup>
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTrigger } from 'reka-ui'

const container = ref(null)
</script>

<template>
  <div>
    <DialogRoot>
      <DialogTrigger />
      <DialogPortal to="container">
        <DialogOverlay />
        <DialogContent>...</DialogContent>
      </DialogPortal>
    </DialogRoot>

    <div ref="container" />
  </div>
</template>
```

### 禁止在外部交互时关闭

例如，如果你有一些全局的通知组件，点击它时不应该关闭对话框。

<ComponentPreview name="DialogToaster" />

## 无障碍

遵循[对话框 WAI-ARIA 设计模式](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)。

### 关闭图标按钮

当提供图标（或字体图标）时，记得为屏幕阅读器用户正确地标记它。

```html line=8-9
<DialogRoot>
  <DialogTrigger />
  <DialogPortal>
    <DialogOverlay />
    <DialogContent>
      <DialogTitle />
      <DialogDescription />
      <DialogClose aria-label="Close">
        <span aria-hidden="true">×</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</DialogRoot>
```

### 键盘交互

<KeyboardTable
  :data="[
    {
      keys: ['Space'],
      description: '打开/关闭对话框',
    },
    {
      keys: ['Enter'],
      description: '打开/关闭对话框',
    },
    {
      keys: ['Tab'],
      description: '将焦点移动到下一个可聚焦元素。',
    },
    {
      keys: ['Shift + Tab'],
      description: '将焦点移动到上一个可聚焦元素。',
    },
    {
      keys: ['Esc'],
      description: '<span>关闭对话框并将焦点移动到<Code>DialogTrigger</Code>。</span>',
    },
  ]"
/>

## 自定义 API

通过将原始部分抽象到自己的组件中创建你自己的 API。

### 抽象化叠加层和关闭按钮

此示例抽象了 `DialogOverlay` 和 `DialogClose` 部分。

#### 使用

```vue
<script setup>
import { Dialog, DialogContent, DialogTrigger } from './your-dialog'
</script>

<template>
  <Dialog>
    <DialogTrigger>Dialog trigger</DialogTrigger>
    <DialogContent>Dialog Content</DialogContent>
  </Dialog>
</template>
```

#### 实现

```ts
// your-dialog.ts
export { default as DialogContent } from 'DialogContent.vue'
export { DialogRoot as Dialog, DialogTrigger } from 'reka-ui'
```

```vue
<!-- DialogContent.vue -->
<script setup lang="ts">
import { DialogClose, DialogContent, type DialogContentEmits, type DialogContentProps, DialogOverlay, DialogPortal, useEmitAsProps, } from 'reka-ui'
import { Cross2Icon } from '@radix-icons/vue'

const props = defineProps<DialogContentProps>()
const emits = defineEmits<DialogContentEmits>()

const emitsAsProps = useEmitAsProps(emits)
</script>

<template>
  <DialogPortal>
    <DialogOverlay />
    <DialogContent v-bind="{ ...props, ...emitsAsProps }">
      <slot />

      <DialogClose>
        <Cross2Icon />
        <span class="sr-only">Close</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
```
