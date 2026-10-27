<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>The current date range of the field</p>\n',
    'type': 'DateRange'
  },
  {
    'name': 'segments',
    'description': '<p>The date field segment contents</p>\n',
    'type': 'Record&lt;DateRangeType, { part: SegmentPart; value: string; }[]&gt;'
  }
]" />
</llm-exclude>

<llm-only>

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `modelValue` | The current date range of the field | `DateRange` |
| `segments` | The date field segment contents | `Record<DateRangeType, { part: SegmentPart; value: string; }[]>` |

</llm-only>
