import { reactive } from 'vue'

// Module-level registry shared by every `DismissableLayer` in the app.
export const context = reactive({
  layersRoot: new Set<HTMLElement>(),
  layersWithOutsidePointerEventsDisabled: new Set<HTMLElement>(),
  branches: new Set<HTMLElement>(),
})
