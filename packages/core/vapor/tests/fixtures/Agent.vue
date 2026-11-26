<script setup vapor lang="ts">
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger, CheckboxRoot, DialogContent, DialogPortal, DialogRoot, DialogTitle, DialogTrigger, RadioGroupItem, RadioGroupRoot, SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport, SliderRange, SliderRoot, SliderThumb, SliderTrack, SwitchRoot, TabsContent, TabsList, TabsRoot, TabsTrigger, TagsInputInput, TagsInputItem, TagsInputItemText, TagsInputRoot, ToggleGroupItem, ToggleGroupRoot } from '#reka'
import { ref } from 'vue'

const on = ref(false)
const tags = ref(['a'])
</script>

<template>
  <SwitchRoot
    id="wire"
    v-model="on"
    aria-label="Wire"
  />
  <CheckboxRoot aria-label="Agree" />
  <TabsRoot default-value="one">
    <TabsList aria-label="Tabs">
      <TabsTrigger value="one">
        One
      </TabsTrigger>
    </TabsList>
    <TabsContent value="one">
      Panel
    </TabsContent>
  </TabsRoot>
  <RadioGroupRoot aria-label="Radios">
    <RadioGroupItem value="a">
      A
    </RadioGroupItem>
  </RadioGroupRoot>
  <AccordionRoot type="single">
    <AccordionItem value="a">
      <AccordionHeader>
        <AccordionTrigger>Section</AccordionTrigger>
      </AccordionHeader>
      <AccordionContent>Body</AccordionContent>
    </AccordionItem>
  </AccordionRoot>
  <ToggleGroupRoot
    type="single"
    aria-label="Toggles"
  >
    <ToggleGroupItem value="a">
      A
    </ToggleGroupItem>
  </ToggleGroupRoot>
  <SliderRoot
    :default-value="[40]"
    aria-label="Level"
  >
    <SliderTrack>
      <SliderRange />
    </SliderTrack>
    <SliderThumb aria-label="Level" />
  </SliderRoot>
  <TagsInputRoot v-model="tags">
    <TagsInputItem
      v-for="tag in tags"
      :key="tag"
      :value="tag"
    >
      <TagsInputItemText />
    </TagsInputItem>
    <TagsInputInput aria-label="Tags" />
  </TagsInputRoot>
  <SelectRoot default-value="a">
    <SelectTrigger aria-label="Fruit">
      <SelectValue />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent>
        <SelectViewport>
          <SelectItem value="a">
            <SelectItemText>Apple</SelectItemText>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
  <DialogRoot>
    <DialogTrigger>Open</DialogTrigger>
    <DialogPortal>
      <DialogContent>
        <DialogTitle>Title</DialogTitle>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
