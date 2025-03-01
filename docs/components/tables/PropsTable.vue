<script setup lang="ts">
import { ProseCodeInline, ProseTable, ProseTbody, ProseTd, ProseTh, ProseThead, ProseTr } from '../prose'
import { Icon } from '@iconify/vue'

type PropDef = {
  name?: string
  required?: boolean
  default?: string | boolean
  type: string
  typeSimple: string
  description?: string
}

interface PropsTableProps {
  data: PropDef[]
}
const props = defineProps<PropsTableProps>()
</script>

<template>
  <ProseTable>
    <!-- <div class="absolute top-0 right-2 w-8 h-8 rounded-full border flex items-center justify-center">
      <Icon icon="ph:sliders-light" />
    </div> -->

    <ProseThead>
      <ProseTr>
        <ProseTh class="w-1/6">
          <span>{{ $t('prop') }}</span>
        </ProseTh>
        <ProseTh class="w-1/6">
          <span>{{ $t('default') }}</span>
        </ProseTh>
        <ProseTh class="w-2/3">
          <span>{{ $t('type') }}</span>
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
          <div
            v-if="prop.default"
            class="flex  h-full items-start gap-1"
          >
            <ProseCodeInline variant="secondary">
              {{ prop.default }}
            </ProseCodeInline>
          </div>
          <template v-else>
            <div
              as="{AccessibleIcon}"
              label="No default value"
            >
              <Icon icon="radix-icons:divider-horizontal" />
            </div>
          </template>
        </ProseTd>

        <ProseTd>
          <div class="flex flex-col">
            <ProseCodeInline
              variant="secondary"
              class="w-max"
            >
              {{ prop.typeSimple ? prop.typeSimple : prop.type }}
            </ProseCodeInline>
            <div
              class="[&_p]:mt-0 [&_p]:mb-0 flex flex-col gap-2 mt-2 text-sm text-muted-foreground"
              v-html="prop.description"
            />
          </div>
        </ProseTd>
      </ProseTr>
    </ProseTbody>
  </ProseTable>
</template>
