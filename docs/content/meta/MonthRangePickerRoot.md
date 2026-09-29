<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'allowNonContiguousRanges',
    'description': '<p>When combined with <code>isMonthUnavailable</code>, determines whether non-contiguous ranges may be selected.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'as',
    'description': '<p>The element or component this component should render as. Can be overwritten by <code>asChild</code>.</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'div\''
  },
  {
    'name': 'asChild',
    'description': '<p>Change the default rendered element for the one passed as a child, merging their props and behavior.</p>\n<p>Read our <a href=\'https://www.reka-ui.com/docs/guides/composition\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'calendarLabel',
    'description': '<p>The accessible label for the calendar</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'defaultPlaceholder',
    'description': '<p>The default placeholder date</p>\n',
    'type': 'DateValue',
    'required': false
  },
  {
    'name': 'defaultValue',
    'description': '<p>The default value for the calendar</p>\n',
    'type': 'DateRange',
    'required': false,
    'default': '{ start: undefined, end: undefined }'
  },
  {
    'name': 'dir',
    'description': '<p>The reading direction of the calendar when applicable.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>Whether or not the calendar is disabled</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'fixedDate',
    'description': '<p>Which part of the range should be fixed</p>\n',
    'type': '\'start\' | \'end\'',
    'required': false
  },
  {
    'name': 'initialFocus',
    'description': '<p>If true, the calendar will focus the selected month on mount</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'isMonthDisabled',
    'description': '<p>A function that returns whether or not a month is disabled</p>\n',
    'type': 'Matcher',
    'required': false
  },
  {
    'name': 'isMonthUnavailable',
    'description': '<p>A function that returns whether or not a month is unavailable</p>\n',
    'type': 'Matcher',
    'required': false
  },
  {
    'name': 'locale',
    'description': '<p>The locale to use for formatting dates</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'maximumMonths',
    'description': '<p>The maximum number of months that can be selected in a range</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'maxValue',
    'description': '<p>The maximum date that can be selected</p>\n',
    'type': 'DateValue',
    'required': false
  },
  {
    'name': 'minValue',
    'description': '<p>The minimum date that can be selected</p>\n',
    'type': 'DateValue',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled selected month range of the month range picker. Can be bound as <code>v-model</code>.</p>\n',
    'type': 'DateRange | null',
    'required': false
  },
  {
    'name': 'nextPage',
    'description': '<p>A function that returns the next page of the calendar.</p>\n',
    'type': '((placeholder: DateValue) =&gt; DateValue)',
    'required': false
  },
  {
    'name': 'placeholder',
    'description': '<p>The placeholder date, which is used to determine what year to display when no date is selected.</p>\n',
    'type': 'DateValue',
    'required': false
  },
  {
    'name': 'preventDeselect',
    'description': '<p>Whether or not to prevent the user from deselecting a date without selecting another date first</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'prevPage',
    'description': '<p>A function that returns the previous page of the calendar.</p>\n',
    'type': '((placeholder: DateValue) =&gt; DateValue)',
    'required': false
  },
  {
    'name': 'readonly',
    'description': '<p>Whether or not the calendar is readonly</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called whenever the model value changes</p>\n',
    'type': '[date: DateRange]'
  },
  {
    'name': 'update:placeholder',
    'description': '<p>Event handler called whenever the placeholder value changes</p>\n',
    'type': '[date: DateValue]'
  },
  {
    'name': 'update:startValue',
    'description': '<p>Event handler called whenever the start value changes</p>\n',
    'type': '[date: DateValue]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'date',
    'description': '<p>The current date of the placeholder</p>\n',
    'type': 'DateValue'
  },
  {
    'name': 'grid',
    'description': '<p>The grid of months</p>\n',
    'type': 'Grid&lt;DateValue&gt;'
  },
  {
    'name': 'locale',
    'description': '<p>The calendar locale</p>\n',
    'type': 'string'
  },
  {
    'name': 'modelValue',
    'description': '<p>The current date range</p>\n',
    'type': 'DateRange'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `allowNonContiguousRanges` | When combined with isMonthUnavailable, determines whether non-contiguous ranges may be selected. | `boolean` | No | `false` |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `calendarLabel` | The accessible label for the calendar | `string` | No | - |
| `defaultPlaceholder` | The default placeholder date | `DateValue` | No | - |
| `defaultValue` | The default value for the calendar | `DateRange` | No | `{ start: undefined, end: undefined }` |
| `dir` | The reading direction of the calendar when applicable. | `"ltr" \| "rtl"` | No | - |
| `disabled` | Whether or not the calendar is disabled | `boolean` | No | `false` |
| `fixedDate` | Which part of the range should be fixed | `"start" \| "end"` | No | - |
| `initialFocus` | If true, the calendar will focus the selected month on mount | `boolean` | No | `false` |
| `isMonthDisabled` | A function that returns whether or not a month is disabled | `Matcher` | No | - |
| `isMonthUnavailable` | A function that returns whether or not a month is unavailable | `Matcher` | No | - |
| `locale` | The locale to use for formatting dates | `string` | No | - |
| `maximumMonths` | The maximum number of months that can be selected in a range | `number` | No | - |
| `maxValue` | The maximum date that can be selected | `DateValue` | No | - |
| `minValue` | The minimum date that can be selected | `DateValue` | No | - |
| `modelValue` | The controlled selected month range of the month range picker. Can be bound as v-model. | `DateRange \| null` | No | - |
| `nextPage` | A function that returns the next page of the calendar. | `((placeholder: DateValue) => DateValue)` | No | - |
| `placeholder` | The placeholder date, which is used to determine what year to display when no date is selected. | `DateValue` | No | - |
| `preventDeselect` | Whether or not to prevent the user from deselecting a date without selecting another date first | `boolean` | No | `false` |
| `prevPage` | A function that returns the previous page of the calendar. | `((placeholder: DateValue) => DateValue)` | No | - |
| `readonly` | Whether or not the calendar is readonly | `boolean` | No | `false` |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `update:modelValue` | Event handler called whenever the model value changes | `[date: DateRange]` |
| `update:placeholder` | Event handler called whenever the placeholder value changes | `[date: DateValue]` |
| `update:startValue` | Event handler called whenever the start value changes | `[date: DateValue]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `date` | The current date of the placeholder | `DateValue` |
| `grid` | The grid of months | `Grid<DateValue>` |
| `locale` | The calendar locale | `string` |
| `modelValue` | The current date range | `DateRange` |

</llm-only>
