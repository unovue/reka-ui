/*
  * Implementation ported from https://github.com/melt-ui/melt-ui/blob/develop/src/lib/internal/helpers/date/utils.ts
*/

import type { TemporalDateTime } from '@/temporal/types'

export type TimeValue = TemporalDateTime

export type Granularity = 'day' | 'hour' | 'minute' | 'second'
export type TimeGranularity = 'hour' | 'minute' | 'second'
