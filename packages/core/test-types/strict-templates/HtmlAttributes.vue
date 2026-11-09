<script setup lang="ts">
// Fixture for `tsconfig.json` here: every element below must type-check with
// `strictTemplates` against the built package, using only attributes and listeners
// `PrimitiveHTMLAttributes` types. Never rendered.
import type { ListboxItemSelectEvent } from 'reka-ui'
import {
  CheckboxGroupRoot,
  CheckboxRoot,
  ColorSwatch,
  DateFieldRoot,
  DialogContent,
  DialogRoot,
  Label,
  ListboxItem,
  ListboxRoot,
  ListboxVirtualizer,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuRoot,
  parseColor,
  Primitive,
  SplitterGroup,
  ToggleGroupItem,
  ToggleGroupRoot,
  TreeItem,
  TreeRoot,
} from 'reka-ui'

declare const date: import('reka-ui').DateValue

function onClick(event: MouseEvent) {
  return event.button
}
function onListboxSelect(event: ListboxItemSelectEvent<string>) {
  return event.detail.value
}
</script>

<template>
  <!-- Global attributes, `data-*`, `class` / `style` and a DOM listener -->
  <NavigationMenuRoot
    id="main-nav"
    aria-label="Main"
    data-testid="nav"
    class="nav"
    :style="{ color: 'red' }"
    @click="onClick"
  >
    <NavigationMenuList
      role="menubar"
      tabindex="0"
    >
      <NavigationMenuLink
        aria-current="page"
        @select="(event) => event.detail.originalEvent"
      />
    </NavigationMenuList>
  </NavigationMenuRoot>

  <DialogRoot>
    <DialogContent
      id="dialog"
      aria-label="Settings"
      aria-describedby="dialog-description"
      data-size="lg"
      class="dialog open"
      :class="[]"
      style="width: 20rem"
      @click="onClick"
      @keydown.esc="() => {}"
    />
  </DialogRoot>

  <!-- A plain Primitive and a Primitive-based part -->
  <Primitive
    as="section"
    aria-labelledby="title"
    data-section
    class="section"
    @click="onClick"
  />
  <Label
    id="label"
    for="input"
    aria-hidden="false"
    data-part="label"
    style="color: red"
    @click="onClick"
  >
    Name
  </Label>

  <!-- Components with a `value` / `disabled` prop of their own -->
  <CheckboxRoot
    id="terms"
    value="yes"
    disabled
    aria-label="Accept"
    data-field
    class="checkbox"
    @click="onClick"
  />
  <ToggleGroupRoot
    type="single"
    aria-label="Alignment"
    data-group
  >
    <ToggleGroupItem
      id="left"
      value="left"
      :disabled="false"
      aria-label="Left"
      class="item"
      @click="onClick"
    />
  </ToggleGroupRoot>

  <!-- Parts whose props do not build on PrimitiveProps -->
  <CheckboxGroupRoot
    aria-label="Toppings"
    class="group"
    @click="onClick"
  />
  <ListboxRoot>
    <ListboxVirtualizer
      :options="['a']"
      aria-label="Options"
      class="virtualizer"
    />
  </ListboxRoot>

  <!-- An emit named like a DOM event keeps the emit's payload -->
  <ListboxRoot aria-label="Fruits">
    <ListboxItem
      value="apple"
      data-fruit
      @select="onListboxSelect"
      @click="onClick"
    />
  </ListboxRoot>
  <TreeRoot
    :items="[{ id: 'a' }]"
    :get-key="(item) => item.id"
  >
    <TreeItem
      :value="{ id: 'a' }"
      :level="1"
      aria-label="A"
      @select="(event) => event.detail.originalEvent"
      @toggle="(event) => event.detail.isExpanded"
    />
  </TreeRoot>

  <!-- A component's own prop wins over the HTML attribute of the same name -->
  <SplitterGroup
    :id="null"
    direction="horizontal"
    aria-label="Panels"
  />
  <DateFieldRoot
    :placeholder="date"
    aria-label="Date"
  />
  <ColorSwatch
    :color="parseColor('#ff0000')"
    aria-label="Red"
  />
  <!-- @vue-expect-error `dir` is `Direction` -->
  <NavigationMenuRoot dir="sideways" />

  <!-- Still strict: anything outside the typed set is an error -->
  <!-- @vue-expect-error not a prop or an HTML attribute -->
  <DialogContent not-an-attribute="x" />
  <!-- @vue-expect-error `href` is an `<a>` attribute, not a global one -->
  <NavigationMenuLink href="/docs" />
</template>
