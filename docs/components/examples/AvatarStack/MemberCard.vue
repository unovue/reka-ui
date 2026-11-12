<script setup lang="ts">
import type { Member } from './team'
import { Icon } from '@iconify/vue'
import { AvatarFallback, AvatarImage, AvatarRoot } from 'reka-ui'
import { ref, watch } from 'vue'
import { initials, loadProfile } from './team'

const props = defineProps<{
  member: Member
  /** Only fetch once the card is actually open. */
  active: boolean
}>()

const profile = ref<Awaited<ReturnType<typeof loadProfile>>>()
const pending = ref(false)

// Fires on first open only; the result is cached for the life of the card.
watch(() => props.active, async (isActive) => {
  if (!isActive || profile.value || pending.value)
    return

  pending.value = true
  profile.value = await loadProfile(props.member)
  pending.value = false
}, { immediate: true })
</script>

<template>
  <div class="flex flex-col gap-3">
    <AvatarRoot class="inline-flex size-12 select-none items-center justify-center overflow-hidden rounded-full bg-muted">
      <AvatarImage
        v-if="member.avatar"
        class="size-full object-cover"
        :src="member.avatar"
        :alt="member.name"
      />
      <AvatarFallback
        class="grid size-full place-items-center text-sm font-medium text-muted-foreground"
        :delay-ms="200"
      >
        {{ initials(member.name) }}
      </AvatarFallback>
    </AvatarRoot>

    <div>
      <p class="text-sm font-medium text-foreground">
        {{ member.name }}
      </p>
      <p class="text-xs text-muted-foreground">
        @{{ member.handle }} · {{ member.role }}
      </p>
    </div>

    <p class="text-sm leading-snug text-foreground">
      {{ member.bio }}
    </p>

    <div class="flex h-4 items-center gap-4 text-xs text-muted-foreground">
      <template v-if="profile">
        <span><strong class="font-medium text-foreground">{{ profile.followers }}</strong> followers</span>
        <span><strong class="font-medium text-foreground">{{ profile.projects }}</strong> projects</span>
      </template>
      <span
        v-else
        class="flex items-center gap-1.5"
      >
        <Icon
          icon="lucide:loader-circle"
          class="size-3 animate-spin"
        />
        Loading profile…
      </span>
    </div>
  </div>
</template>
