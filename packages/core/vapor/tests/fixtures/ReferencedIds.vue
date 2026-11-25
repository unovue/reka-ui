<script setup vapor lang="ts">
import { DialogContent, DialogDescription, DialogRoot, DialogTitle, ListboxContent, ListboxGroup, ListboxGroupLabel, ListboxItem, ListboxRoot, SelectContent, SelectGroup, SelectItem, SelectItemText, SelectLabel, SelectRoot, SelectTrigger, SelectViewport, StepperItem, StepperRoot, StepperTitle, StepperTrigger } from '#reka'
import { ref } from 'vue'

const titleId = ref('my-title')
const descriptionId = ref('my-description')
const showFirst = ref(true)
const childId = ref('child-title')
defineExpose({ titleId, descriptionId, showFirst, childId })
</script>

<template>
  <!-- A consumer id on the title and description, which can change or become empty -->
  <DialogRoot
    :open="true"
    :modal="false"
  >
    <DialogContent data-testid="dialog">
      <DialogTitle
        :id="titleId"
        data-testid="title"
      >
        Title
      </DialogTitle>
      <DialogDescription
        :id="descriptionId"
        data-testid="description"
      >
        Description
      </DialogDescription>
    </DialogContent>
  </DialogRoot>

  <!-- Two titles with their own ids, then a plain one: the first claim wins, the plain one keeps the generated id -->
  <DialogRoot
    :open="true"
    :modal="false"
  >
    <DialogContent data-testid="dialog-2">
      <DialogTitle
        v-if="showFirst"
        id="first-id"
      >
        First
      </DialogTitle>
      <DialogTitle id="second-id">
        Second
      </DialogTitle>
      <DialogTitle data-testid="plain-title">
        Plain
      </DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogContent>
  </DialogRoot>

  <!-- asChild: the id on the child element -->
  <DialogRoot
    :open="true"
    :modal="false"
  >
    <DialogContent data-testid="dialog-3">
      <DialogTitle as-child>
        <h2 :id="childId">
          Title
        </h2>
      </DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogContent>
  </DialogRoot>

  <!-- The referring part renders before the label -->
  <SelectRoot :default-open="true">
    <SelectTrigger>Open</SelectTrigger>
    <SelectContent position="popper">
      <SelectViewport>
        <SelectGroup data-testid="select-group">
          <SelectItem
            value="a"
            data-testid="select-item"
          >
            <SelectItemText id="my-item-text">
              A
            </SelectItemText>
          </SelectItem>
          <SelectLabel id="my-group-label">
            Group
          </SelectLabel>
        </SelectGroup>
      </SelectViewport>
    </SelectContent>
  </SelectRoot>

  <ListboxRoot>
    <ListboxContent>
      <ListboxGroup data-testid="listbox-group">
        <ListboxGroupLabel as-child>
          <span id="child-label">Group</span>
        </ListboxGroupLabel>
        <ListboxItem value="a">
          A
        </ListboxItem>
      </ListboxGroup>
    </ListboxContent>
  </ListboxRoot>

  <StepperRoot :default-value="1">
    <StepperItem :step="1">
      <StepperTrigger data-testid="step-trigger" />
      <StepperTitle id="step-title">
        Title
      </StepperTitle>
    </StepperItem>
  </StepperRoot>
</template>
