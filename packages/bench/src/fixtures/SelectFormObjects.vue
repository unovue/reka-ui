<script setup>
import { SelectContent, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from 'reka-ui'
// SelectFormObjects: named Selects in a form with 1,000 object values and no `by`. Each model change rebuilds the
// native options, so an update that scans the options per option shows here; SelectLarge has no form or objects.
import { ref } from 'vue'

defineProps({ n: { type: Number, default: 3 } })
const opts = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Option ${i}` }))
const models = ref({})
</script>

<template>
  <form>
    <div
      v-for="i in n"
      :key="i"
      class="ci"
    >
      <SelectRoot
        v-model="models[i]"
        :name="`select-${i}`"
      >
        <SelectTrigger class="trg">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectPortal>
          <SelectContent position="popper">
            <SelectViewport>
              <SelectItem
                v-for="o in opts"
                :key="o.id"
                :value="o"
              >
                <SelectItemText>{{ o.name }}</SelectItemText>
              </SelectItem>
            </SelectViewport>
          </SelectContent>
        </SelectPortal>
      </SelectRoot>
    </div>
  </form>
</template>
