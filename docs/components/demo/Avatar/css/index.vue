<script setup lang="ts">
import { AvatarFallback, AvatarImage, AvatarRoot } from 'reka-ui'
import './styles.css'
</script>

<template>
  <div :style="{ display: 'flex', gap: '20px' }">
    <AvatarRoot class="AvatarRoot">
      <AvatarImage
        class="AvatarImage"
        src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?&w=128&h=128&dpr=2&q=80"
        alt="Colm Tuite"
      />
      <AvatarFallback
        class="AvatarFallback"
        :delay-ms="600"
      >
        CT
      </AvatarFallback>
    </AvatarRoot>
    <AvatarRoot class="AvatarRoot">
      <AvatarImage
        class="AvatarImage"
        src="https://images.unsplash.com/photo-1511485977113-f34c92461ad9?ixlib=rb-1.2.1&w=128&h=128&dpr=2&q=80"
        alt="Pedro Duarte"
      />
      <AvatarFallback
        class="AvatarFallback"
        :delay-ms="600"
      >
        JD
      </AvatarFallback>
    </AvatarRoot>
    <AvatarRoot class="AvatarRoot">
      <AvatarFallback class="AvatarFallback">
        PD
      </AvatarFallback>
    </AvatarRoot>
  </div>
</template>
