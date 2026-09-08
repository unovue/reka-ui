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
    'description': '<p>The accessible label for the calendar</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'defaultPlaceholder',
    'description': '<p>The default placeholder date</p>\n',
    'type': 'TemporalDate',
    'required': false
  },
  {
    'name': 'defaultValue',
    'description': '<p>The default value for the calendar</p>\n',
    'type': 'TemporalDate',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>The reading direction of the calendar when applicable. &lt;br&gt; If omitted, inherits globally from <code>ConfigProvider</code> or assumes LTR (left-to-right) reading mode.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>Whether the calendar is disabled</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'disableDaysOutsideCurrentView',
    'description': '<p>Whether or not to disable days outside the current view.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'fixedWeeks',
    'description': '<p>Whether or not to always display 6 weeks in the calendar</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'initialFocus',
    'description': '<p>If true, the calendar will focus the selected day, today, or the first day of the month depending on what is visible when the calendar is mounted</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'isDateDisabled',
    'description': '<p>A function that returns whether or not a date is disabled</p>\n',
    'type': 'Matcher',
    'required': false
  },
  {
    'name': 'isDateUnavailable',
    'description': '<p>A function that returns whether or not a date is unavailable</p>\n',
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
    'type': 'TemporalDate',
    'required': false
  },
  {
    'name': 'minValue',
    'description': '<p>The minimum date that can be selected</p>\n',
    'type': 'TemporalDate',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled selected value of the calendar</p>\n',
    'type': 'TemporalDate | TemporalDate[]',
    'required': false
  },
  {
    'name': 'multiple',
    'description': '<p>Whether multiple dates can be selected</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'nextPage',
    'description': '<p>A function that returns the next page of the calendar. It receives the current placeholder as an argument inside the component.</p>\n',
    'type': '((placeholder: TemporalDate) =&gt; TemporalDate)',
    'required': false
  },
  {
    'name': 'numberOfMonths',
    'description': '<p>The number of months to display at once</p>\n',
    'type': 'number',
    'required': false,
    'default': '1'
  },
  {
    'name': 'pagedNavigation',
    'description': '<p>This property causes the previous and next buttons to navigate by the number of months displayed at once, rather than one month</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'placeholder',
    'description': '<p>The placeholder date, which is used to determine what month to display when no date is selected</p>\n',
    'type': 'TemporalDate',
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
    'description': '<p>A function that returns the previous page of the calendar. It receives the current placeholder as an argument inside the component.</p>\n',
    'type': '((placeholder: TemporalDate) =&gt; TemporalDate)',
    'required': false
  },
  {
    'name': 'readonly',
    'description': '<p>Whether the calendar is readonly</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'weekdayFormat',
    'description': '<p>The format to use for the weekday strings provided via the weekdays slot prop</p>\n',
    'type': '\'narrow\' | \'short\' | \'long\'',
    'required': false,
    'default': '\'narrow\''
  },
  {
    'name': 'weekStartsOn',
    'description': '<p>The day of the week to start the calendar on</p>\n',
    'type': '0 | 1 | 2 | 3 | 4 | 5 | 6',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called whenever the model value changes</p>\n',
    'type': '[date: TemporalDate] | [dates: TemporalDate[]]'
  },
  {
    'name': 'update:placeholder',
    'description': '<p>Event handler called whenever the placeholder value changes</p>\n',
    'type': '[date: TemporalDate]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'date',
    'description': '<p>The current date of the placeholder</p>\n',
    'type': 'TemporalDate'
  },
  {
    'name': 'grid',
    'description': '<p>The grid of dates</p>\n',
    'type': 'Grid&lt;TemporalDate&gt;[]'
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
  },
  {
    'name': 'modelValue',
    'description': '<p>The current date of the calendar</p>\n',
    'type': 'TemporalDate | TemporalDate[] | undefined'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `calendarLabel` | The accessible label for the calendar | `string` | No | - |
| `defaultPlaceholder` | The default placeholder date | `TemporalDate` | No | - |
| `defaultValue` | The default value for the calendar | `TemporalDate` | No | - |
| `dir` | The reading direction of the calendar when applicable. <br> If omitted, inherits globally from ConfigProvider or assumes LTR (left-to-right) reading mode. | `"ltr" \| "rtl"` | No | - |
| `disabled` | Whether the calendar is disabled | `boolean` | No | `false` |
| `disableDaysOutsideCurrentView` | Whether or not to disable days outside the current view. | `boolean` | No | `false` |
| `fixedWeeks` | Whether or not to always display 6 weeks in the calendar | `boolean` | No | `false` |
| `initialFocus` | If true, the calendar will focus the selected day, today, or the first day of the month depending on what is visible when the calendar is mounted | `boolean` | No | `false` |
| `isDateDisabled` | A function that returns whether or not a date is disabled | `Matcher` | No | - |
| `isDateUnavailable` | A function that returns whether or not a date is unavailable | `Matcher` | No | - |
| `locale` | The locale to use for formatting dates | `string` | No | - |
| `maxValue` | The maximum date that can be selected | `TemporalDate` | No | - |
| `minValue` | The minimum date that can be selected | `TemporalDate` | No | - |
| `modelValue` | The controlled selected value of the calendar | `TemporalDate \| TemporalDate[]` | No | - |
| `multiple` | Whether multiple dates can be selected | `boolean` | No | `false` |
| `nextPage` | A function that returns the next page of the calendar. It receives the current placeholder as an argument inside the component. | `((placeholder: TemporalDate) => TemporalDate)` | No | - |
| `numberOfMonths` | The number of months to display at once | `number` | No | `1` |
| `pagedNavigation` | This property causes the previous and next buttons to navigate by the number of months displayed at once, rather than one month | `boolean` | No | `false` |
| `placeholder` | The placeholder date, which is used to determine what month to display when no date is selected | `TemporalDate` | No | - |
| `preventDeselect` | Whether or not to prevent the user from deselecting a date without selecting another date first | `boolean` | No | `false` |
| `prevPage` | A function that returns the previous page of the calendar. It receives the current placeholder as an argument inside the component. | `((placeholder: TemporalDate) => TemporalDate)` | No | - |
| `readonly` | Whether the calendar is readonly | `boolean` | No | `false` |
| `weekdayFormat` | The format to use for the weekday strings provided via the weekdays slot prop | `"narrow" \| "short" \| "long"` | No | `"narrow"` |
| `weekStartsOn` | The day of the week to start the calendar on | `0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6` | No | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `update:modelValue` | Event handler called whenever the model value changes | `[date: TemporalDate] \| [dates: TemporalDate[]]` |
| `update:placeholder` | Event handler called whenever the placeholder value changes | `[date: TemporalDate]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `date` | The current date of the placeholder | `TemporalDate` |
| `grid` | The grid of dates | `Grid<TemporalDate>[]` |
| `weekDays` | The days of the week | `string[]` |
| `weekStartsOn` | The start of the week | `0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6` |
| `locale` | The calendar locale | `string` |
| `fixedWeeks` | Whether or not to always display 6 weeks in the calendar | `boolean` |
| `modelValue` | The current date of the calendar | `TemporalDate \| TemporalDate[] \| undefined` |

</llm-only>
