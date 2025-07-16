<script setup lang="ts">
import { ProseCodeInline, ProseTable, ProseTbody, ProseTd, ProseTh, ProseThead, ProseTr } from '../prose'

type PropDef = {
  name?: string
  required?: boolean
  type: string
  typeSimple: string
  description?: string
}

interface EmitsTableProps {
  data: PropDef[]
}
const props = defineProps<EmitsTableProps>()
</script>

<template>
  <ProseTable>
    <!-- <div class="absolute top-0 right-2 w-8 h-8 rounded-full border flex items-center justify-center text-[var(--vp-c-text-2)] bg-[var(--vp-button-alt-bg)] border-[var(--vp-c-gray-soft)]">
      <Icon icon="ph:at-light" />
    </div> -->
    <ProseThead>
      <ProseTr>
        <ProseTh class="w-1/3">
          <span>Emit</span>
        </ProseTh>
        <ProseTh>
          <span>Payload</span>
        </ProseTh>
      </ProseTr>
    </ProseThead>
    <ProseTbody>
      <ProseTr
        v-for="(prop, index) in data"
        :key="`${prop.name}-${index}`"
      >
        <ProseTd>
          <div class="flex h-full items-start gap-1">
            <ProseCodeInline>
              {{ prop.name }}{{ prop.required ? "*" : null }}
            </ProseCodeInline>
          </div>
        </ProseTd>
        <ProseTd>
          <ProseCodeInline variant="secondary">
            {{ prop.type }}
          </ProseCodeInline>
          <div
            class="[&_p]:mt-0 [&_p]:mb-2 flex flex-col gap-2  mt-2 text-sm text-muted-foreground"
            v-html="prop.description"
          />
        </ProseTd>
      </ProseTr>
    </ProseTbody>
  </ProseTable>
</template>
