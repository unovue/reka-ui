<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
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
    'description': '<p>The accessible label for the year picker</p>\n',
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
    'description': '<p>The default value for the year picker</p>\n',
    'type': 'DateValue',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>The reading direction of the calendar when applicable. If omitted, inherits globally from <code>ConfigProvider</code> or assumes LTR.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>Whether the year picker is disabled</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'initialFocus',
    'description': '<p>If true, the year picker will focus the selected year, today, or the first year of the range on mount</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'isYearDisabled',
    'description': '<p>A function that returns whether or not a year is disabled</p>\n',
    'type': 'Matcher',
    'required': false
  },
  {
    'name': 'isYearUnavailable',
    'description': '<p>A function that returns whether or not a year is unavailable</p>\n',
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
    'description': '<p>The controlled selected year value of the year picker. Can be bound as <code>v-model</code>.</p>\n',
    'type': 'DateValue | DateValue[] | null',
    'required': false
  },
  {
    'name': 'multiple',
    'description': '<p>Whether multiple years can be selected</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'nextPage',
    'description': '<p>A function that returns the next page of the year picker. Receives the current placeholder as an argument.</p>\n',
    'type': '((placeholder: DateValue) =&gt; DateValue)',
    'required': false
  },
  {
    'name': 'placeholder',
    'description': '<p>The placeholder date, which is used to determine what year range to display when no date is selected</p>\n',
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
    'description': '<p>A function that returns the previous page of the year picker. Receives the current placeholder as an argument.</p>\n',
    'type': '((placeholder: DateValue) =&gt; DateValue)',
    'required': false
  },
  {
    'name': 'readonly',
    'description': '<p>Whether the year picker is readonly</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'yearsPerPage',
    'description': '<p>Number of years to display per page</p>\n',
    'type': 'number',
    'required': false,
    'default': '12'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called whenever the model value changes</p>\n',
    'type': '[date: DateValue | DateValue[]]'
  },
  {
    'name': 'update:placeholder',
    'description': '<p>Event handler called whenever the placeholder value changes</p>\n',
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
    'description': '<p>The grid of years</p>\n',
    'type': 'Grid&lt;DateValue&gt;'
  },
  {
    'name': 'locale',
    'description': '<p>The year picker locale</p>\n',
    'type': 'string'
  },
  {
    'name': 'modelValue',
    'description': '<p>The current selected value</p>\n',
    'type': 'DateValue | DateValue[] | undefined'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `calendarLabel` | The accessible label for the year picker | `string` | No | - |
| `defaultPlaceholder` | The default placeholder date | `DateValue` | No | - |
| `defaultValue` | The default value for the year picker | `DateValue` | No | - |
| `dir` | The reading direction of the calendar when applicable. If omitted, inherits globally from ConfigProvider or assumes LTR. | `"ltr" \| "rtl"` | No | - |
| `disabled` | Whether the year picker is disabled | `boolean` | No | `false` |
| `initialFocus` | If true, the year picker will focus the selected year, today, or the first year of the range on mount | `boolean` | No | `false` |
| `isYearDisabled` | A function that returns whether or not a year is disabled | `Matcher` | No | - |
| `isYearUnavailable` | A function that returns whether or not a year is unavailable | `Matcher` | No | - |
| `locale` | The locale to use for formatting dates | `string` | No | - |
| `maxValue` | The maximum date that can be selected | `DateValue` | No | - |
| `minValue` | The minimum date that can be selected | `DateValue` | No | - |
| `modelValue` | The controlled selected year value of the year picker. Can be bound as v-model. | `DateValue \| DateValue[] \| null` | No | - |
| `multiple` | Whether multiple years can be selected | `boolean` | No | `false` |
| `nextPage` | A function that returns the next page of the year picker. Receives the current placeholder as an argument. | `((placeholder: DateValue) => DateValue)` | No | - |
| `placeholder` | The placeholder date, which is used to determine what year range to display when no date is selected | `DateValue` | No | - |
| `preventDeselect` | Whether or not to prevent the user from deselecting a date without selecting another date first | `boolean` | No | `false` |
| `prevPage` | A function that returns the previous page of the year picker. Receives the current placeholder as an argument. | `((placeholder: DateValue) => DateValue)` | No | - |
| `readonly` | Whether the year picker is readonly | `boolean` | No | `false` |
| `yearsPerPage` | Number of years to display per page | `number` | No | `12` |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `update:modelValue` | Event handler called whenever the model value changes | `[date: DateValue \| DateValue[]]` |
| `update:placeholder` | Event handler called whenever the placeholder value changes | `[date: DateValue]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `date` | The current date of the placeholder | `DateValue` |
| `grid` | The grid of years | `Grid<DateValue>` |
| `locale` | The year picker locale | `string` |
| `modelValue` | The current selected value | `DateValue \| DateValue[] \| undefined` |

</llm-only>
