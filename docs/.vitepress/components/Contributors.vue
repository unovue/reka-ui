<script setup lang="ts">
import { } from 'vue'
import { contributors } from '../contributors'
import { AvatarFallback, AvatarImage, AvatarRoot, TooltipContent, TooltipRoot, TooltipTrigger } from 'reka-ui'

function getInitials(name: string) {
  return name.match(/\b[A-Z]/gi) // Match the first letter of each word, if it’s an alphabet character
    ?.join('') // Join the matched characters to form initials
    ?? name[0] // Default to the first character if no match
}
</script>

<template>
  <div class="flex flex-wrap gap-2 justify-center my-8 not-prose">
    <TooltipRoot
      v-for="{ name, avatar } of contributors"
      :key="name"
      :delay-duration="0"
      :disable-hoverable-content="true"
      :data-id="name"
    >
      <TooltipTrigger as-child>
        <AvatarRoot as-child>
          <a
            :href="`https://github.com/${name}`"
            class="m-0 -ml-3"
            rel="noopener noreferrer"
            :aria-label="`${name} on GitHub`"
            target="_blank"
          >
            <div class="h-12 w-12 outline-[4px] outline outline-background rounded-full overflow-hidden bg-card flex items-center justify-center">
              <AvatarImage
                :src="avatar"
                :alt="`${name}'s avatar`"
              />
              <AvatarFallback
                class="text-center uppercase text-sm font-semibold"
                :delay-ms="1000"
              >
                {{ getInitials(name) }}
              </AvatarFallback>
            </div>
          </a>
        </AvatarRoot>
      </TooltipTrigger>

      <TooltipContent
        class="text-xs font-semibold  px-2 py-1 rounded bg-card border border-muted"
        side="bottom"
      >
        {{ name }}
      </TooltipContent>
    </TooltipRoot>
  </div>
</template>
