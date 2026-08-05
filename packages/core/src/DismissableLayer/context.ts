import { reactive } from 'vue'

// Module-level registry shared by every `DismissableLayer` in the app, and
// consulted by `useBodyScrollLock` before it releases the body
// `pointer-events` style both own (#2784).
export const context = reactive({
  layersRoot: new Set<HTMLElement>(),
  layersWithOutsidePointerEventsDisabled: new Set<HTMLElement>(),
  originalBodyPointerEvents: undefined as string | undefined,
  branches: new Set<HTMLElement>(),
})
