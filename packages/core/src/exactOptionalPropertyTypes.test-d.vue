<script setup lang="ts">
/**
 * Consumer-side regression guard for `exactOptionalPropertyTypes`.
 *
 * `exactOptionalPropertyTypes.test-d.ts` checks the exported prop types; this
 * file checks what a downstream app actually writes — binding a value that may
 * be `undefined` into a prop, and `v-model`-ing a ref that may hold
 * `undefined`. Both fail to compile as soon as a prop stops accepting an
 * explicit `undefined`, and templates exercise Vue's own prop resolution
 * (`withDefaults`, generics, emits) rather than the declared interface alone.
 *
 * This file is checked by `vue-tsc`; it is never rendered and never published.
 */
import { ref } from 'vue'
import {
  AccordionContent,
  AccordionItem,
  AccordionRoot,
  ComboboxRoot,
  DialogContent,
  DialogRoot,
  Presence,
  Primitive,
  SliderRoot,
  TooltipContent,
  TooltipRoot,
} from './index'

const maybeBoolean = ref<boolean | undefined>()
const maybeString = ref<string | undefined>()
const maybeStrings = ref<string[] | undefined>()
const maybeNumbers = ref<number[] | undefined>()
const maybeElement = ref<HTMLElement | undefined>()
</script>

<template>
  <AccordionRoot
    v-model="maybeString"
    :collapsible="maybeBoolean"
    :disabled="maybeBoolean"
    :default-value="maybeString"
  >
    <AccordionItem
      value="item"
      :disabled="maybeBoolean"
    >
      <AccordionContent :force-mount="maybeBoolean" />
    </AccordionItem>
  </AccordionRoot>

  <ComboboxRoot
    v-model="maybeStrings"
    :open="maybeBoolean"
    :disabled="maybeBoolean"
  />

  <DialogRoot
    v-model:open="maybeBoolean"
    :modal="maybeBoolean"
  >
    <DialogContent
      :force-mount="maybeBoolean"
      :trap-focus="maybeBoolean"
    />
  </DialogRoot>

  <SliderRoot
    v-model="maybeNumbers"
    :disabled="maybeBoolean"
    :min="undefined"
  />

  <TooltipRoot
    :open="maybeBoolean"
    :disabled="maybeBoolean"
  >
    <TooltipContent
      :force-mount="maybeBoolean"
      :collision-boundary="maybeElement"
    />
  </TooltipRoot>

  <Presence
    :present="true"
    :force-mount="maybeBoolean"
  />

  <Primitive
    :as-child="maybeBoolean"
    :as="maybeString"
  />
</template>
