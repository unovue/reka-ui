<script setup lang="ts">
import { HoverCardArrow, HoverCardContent, HoverCardPortal, HoverCardRoot, HoverCardTrigger } from 'reka-ui'
import { ref } from 'vue'
import './styles.css'

const hoverState = ref(false)
</script>

<template>
  <HoverCardRoot v-model:open="hoverState">
    <HoverCardTrigger
      class="ImageTrigger"
      href="https://twitter.com/unovue"
      target="_blank"
      rel="noreferrer noopener"
    >
      <img
        class="Image normal"
        src="https://pbs.twimg.com/profile_images/1833445381986045952/jwoHkIIq_400x400.jpg"
        alt="Radix UI"
      >
    </HoverCardTrigger>
    <HoverCardPortal>
      <HoverCardContent
        class="HoverCardContent"
        :side-offset="5"
      >
        <div :style="{ display: 'flex', flexDirection: 'column', gap: 7 }">
          <img
            class="Image large"
            src="https://pbs.twimg.com/profile_images/1833445381986045952/jwoHkIIq_400x400.jpg"
            alt="Radix UI"
          >
          <div :style="{ display: 'flex', flexDirection: 'column', gap: 15 }">
            <div>
              <div class="Text bold">
                Radix
              </div>
              <div class="Text faded">
                @radix_ui
              </div>
            </div>
            <div class="Text">
              Components, icons, colors, and templates for building high-quality, accessible UI. Free and open-source.
            </div>
            <div :style="{ display: 'flex', gap: 15 }">
              <div :style="{ display: 'flex', gap: 5 }">
                <div class="Text bold">
                  0
                </div>
                <div class="Text faded">
                  Following
                </div>
              </div>
              <div :style="{ display: 'flex', gap: 5 }">
                <div class="Text bold">
                  2,900
                </div>
                <div class="Text faded">
                  Followers
                </div>
              </div>
            </div>
          </div>
        </div>

        <HoverCardArrow
          class="HoverCardArrow"
          :width="8"
        />
      </HoverCardContent>
    </HoverCardPortal>
  </HoverCardRoot>
</template>
