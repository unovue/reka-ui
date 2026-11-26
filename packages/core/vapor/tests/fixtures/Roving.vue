<script setup vapor lang="ts">
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
  RadioGroupIndicator,
  RadioGroupItem,
  RadioGroupRoot,
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
  ToggleGroupItem,
  ToggleGroupRoot,
} from '#reka'
import { ref } from 'vue'

const tab = ref('a')
const radio = ref('r1')
const formats = ref<string[]>([])
const section = ref<string>()
</script>

<template>
  <!-- arrow keys select, as the test drives them (v3 defaults to manual activation) -->
  <TabsRoot
    v-model="tab"
    activation-mode="automatic"
  >
    <TabsList
      id="tabs-list"
      aria-label="Sections"
    >
      <TabsTrigger
        id="tab-a"
        value="a"
      >
        A
      </TabsTrigger>
      <TabsTrigger
        id="tab-b"
        value="b"
      >
        B
      </TabsTrigger>
      <!-- asChild, both forms -->
      <TabsTrigger
        value="c"
        as-child
      >
        <button
          id="tab-c"
          data-state="mine"
        >
          C
        </button>
      </TabsTrigger>
      <!-- @vue-expect-error the slot types don't list `props` yet (see the Vapor guide) -->
      <TabsTrigger
        v-slot="{ props }"
        value="d"
        as-child
      >
        <button
          v-bind="props"
          id="tab-d"
        >
          D
        </button>
      </TabsTrigger>
    </TabsList>
    <TabsContent
      id="panel-a"
      value="a"
    >
      Panel A
    </TabsContent>
    <TabsContent
      id="panel-b"
      value="b"
    >
      Panel B
    </TabsContent>
    <TabsContent
      id="panel-c"
      value="c"
    >
      Panel C
    </TabsContent>
    <TabsContent
      id="panel-d"
      value="d"
    >
      Panel D
    </TabsContent>
  </TabsRoot>
  <span id="tab">{{ tab }}</span>

  <form
    id="form"
    @submit.prevent
  >
    <RadioGroupRoot
      id="radio"
      v-model="radio"
      name="density"
      aria-label="Density"
    >
      <RadioGroupItem
        v-for="v in ['r1', 'r2', 'r3']"
        :id="`radio-${v}`"
        :key="v"
        :value="v"
        :aria-label="v"
      >
        <RadioGroupIndicator :id="`radio-indicator-${v}`">
          o
        </RadioGroupIndicator>
      </RadioGroupItem>
    </RadioGroupRoot>
  </form>
  <span id="radio-value">{{ radio }}</span>

  <ToggleGroupRoot
    id="toggle-group"
    v-model="formats"
    type="multiple"
    aria-label="Formatting"
  >
    <ToggleGroupItem
      id="tg-bold"
      value="bold"
      aria-label="Bold"
    >
      B
    </ToggleGroupItem>
    <ToggleGroupItem
      value="italic"
      as-child
    >
      <button
        id="tg-italic"
        aria-label="Italic"
        data-state="mine"
      >
        I
      </button>
    </ToggleGroupItem>
    <!-- @vue-expect-error the slot types don't list `props` yet (see the Vapor guide) -->
    <ToggleGroupItem
      v-slot="{ props }"
      value="underline"
      as-child
    >
      <button
        v-bind="props"
        id="tg-underline"
        aria-label="Underline"
      >
        U
      </button>
    </ToggleGroupItem>
  </ToggleGroupRoot>
  <span id="formats">{{ formats.join() }}</span>

  <AccordionRoot
    v-model="section"
    type="single"
    collapsible
  >
    <AccordionItem
      v-for="v in ['one', 'two']"
      :key="v"
      :value="v"
    >
      <AccordionHeader>
        <AccordionTrigger :id="`acc-${v}`">
          {{ v }}
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionContent :id="`acc-content-${v}`">
        Content {{ v }}
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="three">
      <!-- @vue-expect-error the slot types don't list `props` yet (see the Vapor guide) -->
      <AccordionHeader
        v-slot="{ props }"
        as-child
      >
        <h3
          v-bind="props"
          id="acc-header-slotted"
        >
          <AccordionTrigger as-child>
            <button
              id="acc-three"
              data-state="mine"
            >
              three
            </button>
          </AccordionTrigger>
        </h3>
      </AccordionHeader>
      <AccordionContent id="acc-content-three">
        Content three
      </AccordionContent>
    </AccordionItem>
  </AccordionRoot>
  <span id="section">{{ section }}</span>
</template>
