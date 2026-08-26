<script setup lang="ts">
import type { Member } from './team'
import { AvatarFallback, AvatarImage, AvatarRoot, HoverCardArrow, HoverCardContent, HoverCardPortal, HoverCardRoot, HoverCardTrigger } from 'reka-ui'
import { computed, ref } from 'vue'
import MemberCard from './MemberCard.vue'
import { initials, team } from './team'

const VISIBLE = 4

const shown = computed(() => team.slice(0, VISIBLE))
const overflow = computed(() => team.slice(VISIBLE))

// One key per member, so each card knows whether it is the open one.
const openMember = ref<Member>()

const avatarClass = 'inline-flex size-9 select-none items-center justify-center overflow-hidden rounded-full bg-muted ring-2 ring-card transition-transform hover:z-10 hover:-translate-y-1'
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <div class="flex -space-x-2">
      <HoverCardRoot
        v-for="member in shown"
        :key="member.id"
        :open-delay="150"
        @update:open="openMember = $event ? member : undefined"
      >
        <HoverCardTrigger
          as="button"
          type="button"
          :class="avatarClass"
          :aria-label="member.name"
        >
          <AvatarRoot class="size-full">
            <AvatarImage
              v-if="member.avatar"
              class="size-full object-cover"
              :src="member.avatar"
              :alt="member.name"
            />
            <!-- `delay-ms` holds the fallback back briefly so a fast image does
                 not flash initials first. -->
            <AvatarFallback
              class="grid size-full place-items-center text-xs font-medium text-muted-foreground"
              :delay-ms="200"
            >
              {{ initials(member.name) }}
            </AvatarFallback>
          </AvatarRoot>
        </HoverCardTrigger>

        <HoverCardPortal>
          <HoverCardContent
            class="z-[100] w-[17rem] rounded-xl border border-muted bg-card p-4 shadow-lg data-[side=bottom]:animate-slideUpAndFade data-[side=top]:animate-slideDownAndFade"
            :side-offset="8"
          >
            <MemberCard
              :member="member"
              :active="openMember?.id === member.id"
            />
            <HoverCardArrow
              class="fill-card stroke-muted"
              :width="12"
              :height="6"
            />
          </HoverCardContent>
        </HoverCardPortal>
      </HoverCardRoot>

      <HoverCardRoot
        v-if="overflow.length"
        :open-delay="150"
      >
        <HoverCardTrigger
          as="button"
          type="button"
          class="text-xs font-medium text-muted-foreground"
          :class="[avatarClass]"
          :aria-label="`${overflow.length} more team members`"
        >
          +{{ overflow.length }}
        </HoverCardTrigger>
        <HoverCardPortal>
          <HoverCardContent
            class="z-[100] w-[14rem] rounded-xl border border-muted bg-card p-2 shadow-lg data-[side=bottom]:animate-slideUpAndFade data-[side=top]:animate-slideDownAndFade"
            :side-offset="8"
          >
            <p class="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Also on this team
            </p>
            <div
              v-for="member in overflow"
              :key="member.id"
              class="flex items-center gap-2 rounded-md px-2 py-1.5"
            >
              <AvatarRoot class="inline-flex size-6 items-center justify-center overflow-hidden rounded-full bg-muted">
                <AvatarImage
                  v-if="member.avatar"
                  class="size-full object-cover"
                  :src="member.avatar"
                  :alt="member.name"
                />
                <AvatarFallback class="grid size-full place-items-center text-[10px] font-medium text-muted-foreground">
                  {{ initials(member.name) }}
                </AvatarFallback>
              </AvatarRoot>
              <span class="truncate text-sm text-foreground">{{ member.name }}</span>
            </div>
            <HoverCardArrow
              class="fill-card stroke-muted"
              :width="12"
              :height="6"
            />
          </HoverCardContent>
        </HoverCardPortal>
      </HoverCardRoot>
    </div>

    <p class="text-xs text-muted-foreground">
      Hover or tab to an avatar — the profile loads on first open.
    </p>
  </div>
</template>
