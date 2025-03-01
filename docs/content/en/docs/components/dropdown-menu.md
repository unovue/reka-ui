---

title: Dropdown Menu
description: Displays a menu to the user—such as a set of actions or functions—triggered by a button.
name: dropdown-menu
aria: https://www.w3.org/WAI/ARIA/apg/patterns/menubutton
---

# DropdownMenu

<Description>
Displays a menu to the user—such as a set of actions or functions—triggered by a button.
</Description>

<ComponentPreview name="DropdownMenu" />

## Features

<Highlights
  :features="[
    'Can be controlled or uncontrolled.',
    'Supports submenus with configurable reading direction.',
    'Supports items, labels, groups of items.',
    'Supports checkable items (single or multiple) with optional indeterminate state.',
    'Supports modal and non-modal modes.',
    'Customize side, alignment, offsets, collision handling.',
    'Optionally render a pointing arrow.',
    'Focus is fully managed.',
    'Full keyboard navigation.',
    'Typeahead support.',
    'Dismissing and layering behavior is highly customizable.',
  ]"
/>

## Installation

Install the component from your command line.

<InstallationTabs value="reka-ui" />

## Anatomy

Import all parts and piece them together.

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

## API Reference

### Root

Contains all the parts of a dropdown menu.

<!-- @include: @/meta/DropdownMenuRoot.md -->

### Trigger

The button that toggles the dropdown menu. By default, the `DropdownMenuContent` will position itself against the trigger.

<!-- @include: @/meta/DropdownMenuTrigger.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Portal

When used, portals the content part into the `body`.

<!-- @include: @/meta/DropdownMenuPortal.md -->

### Content

The component that pops out when the dropdown menu is open.

<!-- @include: @/meta/DropdownMenuContent.md -->

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
      description: 'The <Code>transform-origin</Code> computed from the content and arrow positions/offsets'
    },
    {
      cssVariable: '--reka-dropdown-menu-content-available-width',
      description: 'The remaining width between the trigger and the boundary edge'
    },
    {
      cssVariable: '--reka-dropdown-menu-content-available-height',
      description: 'The remaining height between the trigger and the boundary edge'
    },
    {
      cssVariable: '--reka-dropdown-menu-trigger-width',
      description: 'The width of the trigger',
    },
    {
      cssVariable: '--reka-dropdown-menu-trigger-height',
      description: 'The height of the trigger',
    },
  ]"
/>

### Arrow

An optional arrow element to render alongside the dropdown menu. This can be used to help visually link the trigger with the `DropdownMenuContent`. Must be rendered inside `DropdownMenuContent`.

<!-- @include: @/meta/DropdownMenuArrow.md -->

### Item

The component that contains the dropdown menu items.

<!-- @include: @/meta/DropdownMenuItem.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-orientation]',
      values: ['vertical', 'horizontal'],
    },
    {
      attribute: '[data-highlighted]',
      values: 'Present when highlighted',
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### Group

Used to group multiple `DropdownMenuItem`s.

<!-- @include: @/meta/DropdownMenuGroup.md -->

### Label

Used to render a label. It won't be focusable using arrow keys.

<!-- @include: @/meta/DropdownMenuLabel.md -->

### CheckboxItem

An item that can be controlled and rendered like a checkbox.

<!-- @include: @/meta/DropdownMenuCheckboxItem.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['checked', 'unchecked', 'indeterminate'],
    },
    {
      attribute: '[data-highlighted]',
      values: 'Present when highlighted',
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### RadioGroup

Used to group multiple `DropdownMenuRadioItem`s.

<!-- @include: @/meta/DropdownMenuRadioGroup.md -->

### RadioItem

An item that can be controlled and rendered like a radio.

<!-- @include: @/meta/DropdownMenuRadioItem.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['checked', 'unchecked', 'indeterminate'],
    },
    {
      attribute: '[data-highlighted]',
      values: 'Present when highlighted',
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

### ItemIndicator

Renders when the parent `DropdownMenuCheckboxItem` or `DropdownMenuRadioItem` is checked. You can style this element directly, or you can use it as a wrapper to put an icon into, or both.

<!-- @include: @/meta/DropdownMenuItemIndicator.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['checked', 'unchecked', 'indeterminate'],
    },
  ]"
/>

### Separator

Used to visually separate items in the dropdown menu.

<!-- @include: @/meta/DropdownMenuSeparator.md -->

### Sub

Contains all the parts of a submenu.

<!-- @include: @/meta/DropdownMenuSub.md -->

### SubTrigger

An item that opens a submenu. Must be rendered inside `DropdownMenuSub`.

<!-- @include: @/meta/DropdownMenuSubTrigger.md -->

<DataAttributesTable
  :data="[
    {
      attribute: '[data-state]',
      values: ['open', 'closed'],
    },
    {
      attribute: '[data-highlighted]',
      values: 'Present when highlighted',
    },
    {
      attribute: '[data-disabled]',
      values: 'Present when disabled',
    },
  ]"
/>

<CssVariablesTable
  :data="[
    {
      cssVariable: '--reka-dropdown-menu-content-transform-origin',
      description: 'The <Code>transform-origin</Code> computed from the content and arrow positions/offsets',
    },
    {
      cssVariable: '--reka-dropdown-menu-content-available-width',
      description: `
        The remaining width between the trigger and the boundary edge
      `,
    },
    {
      cssVariable: '--reka-dropdown-menu-content-available-height',
      description: 'The remaining height between the trigger and the boundary edge',
    },
    {
      cssVariable: '--reka-dropdown-menu-trigger-width',
      description: 'The width of the trigger',
    },
    {
      cssVariable: '--reka-dropdown-menu-trigger-height',
      description: 'The height of the trigger'
    },
  ]"
/>

### SubContent

The component that pops out when a submenu is open. Must be rendered inside `DropdownMenuSub`.

<!-- @include: @/meta/DropdownMenuSubContent.md -->

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

## Examples

### With submenus

You can create submenus by using `DropdownMenuSub` in combination with its parts.

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

### With disabled items

You can add special styles to disabled items via the `data-disabled` attribute.

```vue line=18
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

### With separators

Use the `Separator` part to add a separator between items.

```vue line=7,18,20
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

### With labels

Use the `Label` part to help label a section.

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

### With checkbox items

Use the `CheckboxItem` part to add an item that can be checked.

```vue line=5,26-31
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

### With radio items

Use the `RadioGroup` and `RadioItem` parts to add an item that can be checked amongst others.

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

### With complex items

You can add extra decorative elements in the `Item` parts, such as images.

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

### Constrain the content/sub-content size

You may want to constrain the width of the content (or sub-content) so that it matches the trigger (or sub-trigger) width. You may also want to constrain its height to not exceed the viewport.

We expose several CSS custom properties such as `--reka-dropdown-menu-trigger-width` and `--reka-dropdown-menu-content-available-height` to support this. Use them to constrain the content dimensions.

```vue line=9-12
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

### Origin-aware animations

We expose a CSS custom property `--reka-dropdown-menu-content-transform-origin`. Use it to animate the content from its computed origin based on `side`, `sideOffset`, `align`, `alignOffset` and any collisions.

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

### Collision-aware animations

We expose `data-side` and `data-align` attributes. Their values will change at runtime to reflect collisions. Use them to create collision and direction-aware animations.

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

## Accessibility

Adheres to the [Menu Button WAI-ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubutton) and uses [roving tabindex](https://www.w3.org/WAI/ARIA/apg/patterns/kbd_roving_tabindex) to manage focus movement among menu items.

### Keyboard Interactions

<KeyboardTable
  :data="[
    {
      keys: ['Space'],
      description: `
        <span>
          When focus is on <Code>DropdownMenuTrigger</Code>, opens the dropdown
          menu and focuses the first item.
          <br />
          When focus is on an item, activates the focused item.
        </span>
      `,
    },
    {
      keys: ['Enter'],
      description: `
        <span>
          When focus is on <Code>DropdownMenuTrigger</Code>, opens the dropdown
          menu and focuses the first item.
          <br />
          When focus is on an item, activates the focused item.
        </span>
      `,
    },
    {
      keys: ['ArrowDown'],
      description: `
        <span>
          When focus is on <Code>DropdownMenuTrigger</Code>, opens the dropdown
          menu.
          <br />
          When focus is on an item, moves focus to the next item.
        </span>
      `,
    },
    {
      keys: ['ArrowUp'],
      description: `
        <span>When focus is on an item, moves focus to the previous item.</span>
      `,
    },
    {
      keys: ['ArrowRight', 'ArrowLeft'],
      description: `
        <span>
          When focus is on <Code>DropdownMenuSubTrigger</Code>, opens or closes
          the submenu depending on reading direction.
        </span>
      `,
    },
    {
      keys: ['Esc'],
      description: `
        <span>
          Closes the dropdown menu and moves focus to{' '}
          <Code>DropdownMenuTrigger</Code>.
        </span>
      `,
    },
  ]"
/>

## Custom APIs

Create your own API by abstracting the primitive parts into your own component.

### Abstract the arrow and item indicators

This example abstracts the `DropdownMenuArrow` and `DropdownMenuItemIndicator` parts. It also wraps implementation details for `CheckboxItem` and `RadioItem`.

#### Usage

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

#### Implementation

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
