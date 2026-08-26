<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { DropdownMenuContent, DropdownMenuItemIndicator, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuRoot, DropdownMenuTrigger, ToolbarButton, ToolbarRoot, ToolbarSeparator, ToolbarToggleGroup, ToolbarToggleItem, TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
import { computed, ref } from 'vue'

const marks = [
  { value: 'bold', label: 'Bold', icon: 'lucide:bold', shortcut: '⌘B', class: 'font-bold' },
  { value: 'italic', label: 'Italic', icon: 'lucide:italic', shortcut: '⌘I', class: 'italic' },
  { value: 'underline', label: 'Underline', icon: 'lucide:underline', shortcut: '⌘U', class: 'underline underline-offset-4' },
]

const alignments = [
  { value: 'left', label: 'Align left', icon: 'lucide:align-left', class: 'text-left' },
  { value: 'center', label: 'Align centre', icon: 'lucide:align-center', class: 'text-center' },
  { value: 'right', label: 'Align right', icon: 'lucide:align-right', class: 'text-right' },
]

const blocks = [
  { value: 'p', label: 'Paragraph', class: 'text-sm leading-relaxed' },
  { value: 'h1', label: 'Heading 1', class: 'text-2xl font-bold' },
  { value: 'h2', label: 'Heading 2', class: 'text-lg font-semibold' },
  { value: 'quote', label: 'Quote', class: 'text-sm italic border-l-2 border-primary pl-3' },
]

const activeMarks = ref<string[]>(['bold'])
const alignment = ref('left')
const block = ref('p')

// The preview is what turns a toolbar of toggles into something you can read
// the state off — every control here changes the paragraph below it.
const previewClass = computed(() => [
  blocks.find(item => item.value === block.value)!.class,
  alignments.find(item => item.value === alignment.value)!.class,
  ...marks.filter(mark => activeMarks.value.includes(mark.value)).map(mark => mark.class),
])

const activeBlockLabel = computed(() => blocks.find(item => item.value === block.value)!.label)

const itemClass = 'inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 data-[state=on]:bg-muted data-[state=on]:text-foreground'
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <div class="w-full max-w-[560px] overflow-hidden rounded-xl border border-muted bg-card">
      <ToolbarRoot
        class="flex flex-wrap items-center gap-1 border-b border-muted p-1.5"
        aria-label="Formatting options"
      >
        <DropdownMenuRoot>
          <!-- `as-child` keeps the trigger inside the toolbar's roving focus,
               so arrow keys still walk past it. -->
          <DropdownMenuTrigger as-child>
            <ToolbarButton class="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/40">
              {{ activeBlockLabel }}
              <Icon
                icon="lucide:chevron-down"
                class="size-3.5 text-muted-foreground"
              />
            </ToolbarButton>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent
              class="z-[100] min-w-[10rem] rounded-lg border border-muted bg-card p-1 shadow-lg data-[side=bottom]:animate-slideUpAndFade data-[side=top]:animate-slideDownAndFade"
              align="start"
              :side-offset="6"
            >
              <DropdownMenuRadioGroup v-model="block">
                <DropdownMenuRadioItem
                  v-for="item in blocks"
                  :key="item.value"
                  :value="item.value"
                  class="relative flex cursor-default select-none items-center gap-2 rounded-md py-1.5 pl-7 pr-2 text-sm text-foreground outline-none data-[highlighted]:bg-muted"
                >
                  <DropdownMenuItemIndicator class="absolute left-2">
                    <Icon
                      icon="lucide:check"
                      class="size-3.5"
                    />
                  </DropdownMenuItemIndicator>
                  {{ item.label }}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenuRoot>

        <ToolbarSeparator class="mx-1 h-6 w-px bg-muted" />

        <ToolbarToggleGroup
          v-model="activeMarks"
          type="multiple"
          aria-label="Text formatting"
          class="flex items-center gap-1"
        >
          <TooltipRoot
            v-for="mark in marks"
            :key="mark.value"
          >
            <TooltipTrigger as-child>
              <ToolbarToggleItem
                :value="mark.value"
                :class="itemClass"
                :aria-label="mark.label"
              >
                <Icon
                  :icon="mark.icon"
                  class="size-4"
                />
              </ToolbarToggleItem>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent
                class="z-[100] flex items-center gap-2 rounded-md bg-foreground px-2 py-1 text-xs text-background"
                :side-offset="6"
              >
                {{ mark.label }}
                <kbd class="font-mono opacity-60">{{ mark.shortcut }}</kbd>
              </TooltipContent>
            </TooltipPortal>
          </TooltipRoot>
        </ToolbarToggleGroup>

        <ToolbarSeparator class="mx-1 h-6 w-px bg-muted" />

        <ToolbarToggleGroup
          v-model="alignment"
          type="single"
          aria-label="Text alignment"
          class="flex items-center gap-1"
        >
          <TooltipRoot
            v-for="align in alignments"
            :key="align.value"
          >
            <TooltipTrigger as-child>
              <ToolbarToggleItem
                :value="align.value"
                :class="itemClass"
                :aria-label="align.label"
              >
                <Icon
                  :icon="align.icon"
                  class="size-4"
                />
              </ToolbarToggleItem>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent
                class="z-[100] rounded-md bg-foreground px-2 py-1 text-xs text-background"
                :side-offset="6"
              >
                {{ align.label }}
              </TooltipContent>
            </TooltipPortal>
          </TooltipRoot>
        </ToolbarToggleGroup>
      </ToolbarRoot>

      <div class="p-5">
        <p
          class="text-foreground"
          :class="previewClass"
        >
          Headless components give you the behaviour and the accessibility, and leave every pixel to you.
        </p>
      </div>
    </div>
  </TooltipProvider>
</template>
