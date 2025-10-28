<script setup lang="ts">

</script>

<template>
  <div class="w-full flex flex-col items-center">
    <div class="max-w-6xl w-full grid grid-cols-3 gap-4 pt-40 pb-40">
      <Card>
        <AccordionTailwind />
      </Card>
      <Card>
        <AlertDialogTailwind />
      </Card>
      <Card>
        <AspectRatioTailwind />
      </Card>
      <Card class="col-span-2">
        <NavigationMenuTailwind />
      </Card>
      <Card>
        <CollapsibleTailwind />
      </Card>
      <Card>
        <AvatarTailwind />
      </Card>
      <Card>
        <CheckboxTailwind />
      </Card>
      <Card>
        <ComboboxTailwind />
      </Card>
      <Card>
        <ScrollAreaTailwind />
      </Card>
      <Card class="col-span-2">
        <ContextMenuTailwind />
      </Card>
      <Card class="col-span-2">
        <DialogTailwind />
      </Card>
      <Card>
        <DropdownMenuTailwind />
      </Card>
      <Card>
        <MenubarTailwind />
      </Card>
      <Card>
        <HoverCardTailwind />
      </Card>
      <Card>
        <LabelTailwind />
      </Card>
      <Card>
        <PopoverTailwind />
      </Card>
      <Card>
        <ProgressTailwind />
      </Card>
      <Card>
        <RadioGroupTailwind />
      </Card>
      <Card>
        <SelectTailwind />
      </Card>
      <!-- <Card>
        <SelectMultiple />
      </Card> -->
      <Card>
        <SeparatorTailwind />
      </Card>
      <Card>
        <SliderTailwind />
      </Card>
      <Card>
        <SwitchTailwind />
      </Card>
      <Card>
        <TabsTailwind />
      </Card>
      <Card>
        <ToggleTailwind />
      </Card>
      <Card>
        <ToggleGroupTailwind />
      </Card>
      <Card class="col-span-2">
        <ToolbarTailwind />
      </Card>
      <Card>
        <TooltipTailwind />
      </Card>
    </div>
  </div>
</template>

<style>
body {
  @apply bg-black text-white;
}
</style>
