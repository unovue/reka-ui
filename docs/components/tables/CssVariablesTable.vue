<script setup lang="ts">
import { ProseCodeInline, ProseTable, ProseTbody, ProseTd, ProseTh, ProseThead, ProseTr } from '../prose'

type KeyboardDef = {
  cssVariable: string
  description: string[]
}

interface DataAttributesTableProps {
  data: KeyboardDef[]
}
const props = defineProps<DataAttributesTableProps>()
</script>

<template>
  <ProseTable>
    <ProseThead>
      <ProseTr>
        <ProseTh class="w-[45%]">
          <span>{{ $t('css-variable') }}</span>
        </ProseTh>
        <ProseTh class="w-[55%]">
          <span>{{ $t('description') }}</span>
        </ProseTh>
      </ProseTr>
    </ProseThead>
    <ProseTbody>
      <ProseTr
        v-for="(prop, index) in props.data"
        :key="`${prop.cssVariable}-${index}`"
      >
        <ProseTd>
          <ProseCodeInline class="!whitespace-normal py-1 text-[13px]">
            {{ prop.cssVariable }}
          </ProseCodeInline>
        </ProseTd>
        <ProseTd class="">
          <div class="flex items-center gap-1">
            <span
              size="2"
              class="leading-5"
              v-html="prop.description"
            />
          </div>
        </ProseTd>
      </ProseTr>
    </ProseTbody>
  </ProseTable>
</template>
