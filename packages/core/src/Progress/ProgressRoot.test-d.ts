import type { ProgressRoot } from '.'
import { expectTypeOf } from 'vitest'

type ProgressProps = InstanceType<typeof ProgressRoot>['$props']

// v3 emits `null` (never `undefined`) for indeterminate progress.
expectTypeOf<NonNullable<ProgressProps['onUpdate:modelValue']>>()
  .parameter(0)
  .toEqualTypeOf<number | null>()
