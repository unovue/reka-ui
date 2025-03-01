<script setup lang="ts">
// import { VPTeamMembers } from 'vitepress/theme-without-fonts'
import { teamMembers } from '../contributors'
import Contributors from './Contributors.vue'
</script>

<template>
  <div class="content px-6 sm:px-[48px] lg:px-[64px]">
    <div class="mx-auto w-full container max-w-[1152px]">
      <main class="w-full">
        <div class="vp-doc flex flex-col items-center mt-10">
          <h2
            id="meet-the-team"
            class="opacity-50 font-medium pt-10 pb-2"
          >
            {{ $t('meet-the-team') }}
          </h2>
          <div class="w-full">
            <VPTeamMembers
              size="small"
              :members="teamMembers"
            />
          </div>
          <h2
            id="the-team"
            class="op50 font-medium pt-5 pb-2"
          >
            {{ $t('contributors') }}
          </h2>
          <i18n-t
            keypath="join-thne-community-and-get-involved"
            class="text-lg max-w-200 text-center leading-7"
          >
            <Contributors />
            <br>
            <a
              href="https://chat.unovue.com"
              rel="noopener noreferrer"
            >{{ $t('join-the-community') }}</a>
          </i18n-t>
        </div>
      </main>
    </div>
  </div>
</template>
