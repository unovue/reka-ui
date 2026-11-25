<script setup vapor lang="ts">
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger, NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuRoot, NavigationMenuTrigger, NavigationMenuViewport, PopoverContent, PopoverRoot, PopoverTrigger, Primitive, RadioGroupItem, RadioGroupRoot, ScrollAreaRoot, ScrollAreaViewport, ScrollAreaVirtualizer } from '#reka'
import { ref } from 'vue'

// `asChild` DOM adoption (the template form) as the parent's props and the child's root change
const withListener = ref(true)
const clicks = ref(0)
const checked = ref(true)
const parentClass = ref('shared parent')
const color = ref('blue')
const swapped = ref(false)
const swapClicks = ref(0)
const afterLeaves = ref(0)

// A row, a radio item and popover content whose slot root swaps while they stay mounted
const rowSwapped = ref(false)
const radio = ref('a')
const radioSwapped = ref(false)
const popoverOpen = ref(false)
const popoverSwapped = ref(false)

// Presence follows a content whose `as` changes while it stays open
const collapsibleOpen = ref(true)
const contentTag = ref('div')

const nav = ref('')
const rows = Array.from({ length: 100 }, (_, i) => `Row ${i}`)

defineExpose({ withListener, checked, parentClass, color, swapped, rowSwapped, radioSwapped, popoverOpen, popoverSwapped, collapsibleOpen, contentTag, nav })
</script>

<template>
  <Primitive
    as-child
    v-bind="withListener ? { onClick: () => clicks++ } : {}"
  >
    <button id="listener">
      listener
    </button>
  </Primitive>
  <span id="clicks">{{ clicks }}</span>

  <Primitive
    as-child
    :checked="checked"
  >
    <input
      id="checkbox"
      type="checkbox"
      aria-label="Adopted checkbox"
    >
  </Primitive>

  <Primitive
    as-child
    :class="parentClass"
  >
    <span
      id="classes"
      class="shared"
    />
  </Primitive>

  <Primitive
    as-child
    style="display: none"
  >
    <span id="string-style">hidden</span>
  </Primitive>

  <Primitive
    as-child
    :style="{ color }"
  >
    <span
      id="child-style"
      style="color: red"
    >red</span>
  </Primitive>

  <Primitive
    as-child
    data-adopted="yes"
    @click="swapClicks++"
    @after-leave="afterLeaves++"
  >
    <button
      v-if="!swapped"
      id="root-a"
    >
      a
    </button>
    <button
      v-else
      id="root-b"
    >
      b
    </button>
  </Primitive>
  <span id="swap-clicks">{{ swapClicks }}</span>
  <span id="after-leaves">{{ afterLeaves }}</span>

  <ScrollAreaRoot style="width: 200px; height: 100px">
    <ScrollAreaViewport style="width: 100%; height: 100%">
      <ScrollAreaVirtualizer
        v-slot="{ option }"
        :options="rows"
        :estimate-size="20"
      >
        <div
          v-if="!rowSwapped"
          class="row-a"
          style="height: 20px"
        >
          {{ option }}
        </div>
        <article
          v-else
          class="row-b"
          style="height: 20px"
        >
          {{ option }}
        </article>
      </ScrollAreaVirtualizer>
    </ScrollAreaViewport>
  </ScrollAreaRoot>

  <RadioGroupRoot
    v-model="radio"
    aria-label="Swapping radios"
  >
    <RadioGroupItem
      id="radio-a"
      value="a"
    >
      A
    </RadioGroupItem>
    <RadioGroupItem
      value="b"
      as-child
    >
      <button
        v-if="!radioSwapped"
        id="radio-b1"
      >
        B
      </button>
      <button
        v-else
        id="radio-b2"
      >
        B
      </button>
    </RadioGroupItem>
  </RadioGroupRoot>

  <PopoverRoot v-model:open="popoverOpen">
    <PopoverTrigger id="popover-trigger">
      Popover
    </PopoverTrigger>
    <PopoverContent
      as-child
      aria-label="Swapping content"
    >
      <div
        v-if="!popoverSwapped"
        id="popover-a"
      >
        A
      </div>
      <section
        v-else
        id="popover-b"
      >
        B
      </section>
    </PopoverContent>
  </PopoverRoot>

  <CollapsibleRoot
    v-model:open="collapsibleOpen"
    :unmount-on-hide="true"
  >
    <CollapsibleTrigger id="collapsible-trigger">
      Toggle
    </CollapsibleTrigger>
    <CollapsibleContent
      id="collapsible-content"
      :as="contentTag"
    >
      Content
    </CollapsibleContent>
  </CollapsibleRoot>

  <NavigationMenuRoot
    v-model="nav"
    :unmount-on-hide="false"
    :delay-duration="0"
  >
    <NavigationMenuList>
      <NavigationMenuItem value="one">
        <NavigationMenuTrigger id="nav-trigger">
          One
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <p style="width: 120px; height: 40px">
            One
          </p>
        </NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>
    <NavigationMenuViewport id="nav-viewport" />
  </NavigationMenuRoot>
</template>
