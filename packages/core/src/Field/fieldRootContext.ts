import type { FieldRootContext } from './FieldRoot.vue'
import { createRekaContext } from '@/shared/createContext'

// Kept apart from `FieldRoot.vue` so a control that only reads the field's
// context doesn't pull in the FieldRoot component and its validation.
export const [injectFieldRootContext, provideFieldRootContext]
  = createRekaContext<FieldRootContext>('FieldRoot')
