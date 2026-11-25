<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>

<SlotsTable :data="[
  {
    'name': 'date',
    'description': '<p>The current date of the placeholder</p>\n',
    'type': 'DateValue'
  },
  {
    'name': 'grid',
    'description': '<p>The grid of dates</p>\n',
    'type': 'Grid&lt;DateValue&gt;[]'
  },
  {
    'name': 'weekDays',
    'description': '<p>The days of the week</p>\n',
    'type': 'string[]'
  },
  {
    'name': 'weekStartsOn',
    'description': '<p>The start of the week</p>\n',
    'type': '0 | 1 | 2 | 3 | 4 | 5 | 6'
  },
  {
    'name': 'locale',
    'description': '<p>The calendar locale</p>\n',
    'type': 'string'
  },
  {
    'name': 'fixedWeeks',
    'description': '<p>Whether or not to always display 6 weeks in the calendar</p>\n',
    'type': 'boolean'
  }
]" />
</llm-exclude>

<llm-only>

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `date` | The current date of the placeholder | `DateValue` |
| `grid` | The grid of dates | `Grid<DateValue>[]` |
| `weekDays` | The days of the week | `string[]` |
| `weekStartsOn` | The start of the week | `0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6` |
| `locale` | The calendar locale | `string` |
| `fixedWeeks` | Whether or not to always display 6 weeks in the calendar | `boolean` |

</llm-only>
