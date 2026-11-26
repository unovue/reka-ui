import type { ProgressRoot } from '.'
import { expectTypeOf } from 'vitest'

type ProgressProps = InstanceType<typeof ProgressRoot>['$props']

expectTypeOf<NonNullable<ProgressProps['onUpdate:modelValue']>>()
  .parameter(0)
  .toEqualTypeOf<number | null | undefined>()
