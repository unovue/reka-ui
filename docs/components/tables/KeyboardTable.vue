<script setup lang="ts">
import { ProseTable, ProseTbody, ProseTd, ProseTh, ProseThead, ProseTr } from '../prose'

type KeyboardDef = {
  keys: string[]
  description: string
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
        <ProseTh class="">
          <span>Key</span>
        </ProseTh>
        <ProseTh class="">
          <span>Description</span>
        </ProseTh>
      </ProseTr>
    </ProseThead>
    <ProseTbody>
      <ProseTr
        v-for="(prop, index) in props.data"
        :key="`${prop}-${index}`"
      >
        <ProseTd>
          <div class="flex items-center gap-1">
            <kbd
              v-for="(key, propIndex) in prop.keys"
              :key="`${key}-${propIndex}`"
            >
              {{ key }}
            </kbd>
          </div>
        </ProseTd>
        <ProseTd class="">
          <div class="flex items-center gap-1">
            <span v-html="prop.description" />
          </div>
        </ProseTd>
      </ProseTr>
    </ProseTbody>
  </ProseTable>
</template>
