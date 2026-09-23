<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'allowNonContiguousRanges',
    'description': '<p>When combined with <code>isDateUnavailable</code>, determines whether non-contiguous ranges, i.e. ranges containing unavailable dates, may be selected.</p>\n',
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
    'description': '<p>The reading direction of the calendar when applicable. &lt;br&gt; If omitted, inherits globally from <code>ConfigProvider</code> or assumes LTR (left-to-right) reading mode.</p>\n',
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
    'name': 'disableDaysOutsideCurrentView',
    'description': '<p>Whether or not to disable days outside the current view.</p>\n',
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
    'name': 'isDateHighlightable',
    'description': '<p>A function that returns whether or not a date is hightable</p>\n',
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
    'name': 'maximumDays',
    'description': '<p>The maximum number of days that can be selected in a range</p>\n',
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
    'description': '<p>The controlled selected date range of the calendar. Can be bound as <code>v-model</code>.</p>\n',
    'type': 'DateRange | null',
    'required': false
  },
  {
    'name': 'nextPage',
    'description': '<p>A function that returns the next page of the calendar. It receives the current placeholder as an argument inside the component.</p>\n',
    'type': '((placeholder: DateValue) =&gt; DateValue)',
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
    'description': '<p>The placeholder date, which is used to determine what month to display when no date is selected. This updates as the user navigates the calendar and can be used to programmatically control the calendar view</p>\n',
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
    'description': '<p>A function that returns the previous page of the calendar. It receives the current placeholder as an argument inside the component.</p>\n',
    'type': '((placeholder: DateValue) =&gt; DateValue)',
    'required': false
  },
  {
    'name': 'readonly',
    'description': '<p>Whether or not the calendar is readonly</p>\n',
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
  },
  {
    'name': 'update:validModelValue',
    'description': '<p>Event handler called whenever there is a new validModel</p>\n',
    'type': '[date: DateRange]'
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
| `allowNonContiguousRanges` | When combined with isDateUnavailable, determines whether non-contiguous ranges, i.e. ranges containing unavailable dates, may be selected. | `boolean` | No | `false` |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `calendarLabel` | The accessible label for the calendar | `string` | No | - |
| `defaultPlaceholder` | The default placeholder date | `DateValue` | No | - |
| `defaultValue` | The default value for the calendar | `DateRange` | No | `{ start: undefined, end: undefined }` |
| `dir` | The reading direction of the calendar when applicable. <br> If omitted, inherits globally from ConfigProvider or assumes LTR (left-to-right) reading mode. | `"ltr" \| "rtl"` | No | - |
| `disabled` | Whether or not the calendar is disabled | `boolean` | No | `false` |
| `disableDaysOutsideCurrentView` | Whether or not to disable days outside the current view. | `boolean` | No | `false` |
| `fixedDate` | Which part of the range should be fixed | `"start" \| "end"` | No | - |
| `fixedWeeks` | Whether or not to always display 6 weeks in the calendar | `boolean` | No | `false` |
| `initialFocus` | If true, the calendar will focus the selected day, today, or the first day of the month depending on what is visible when the calendar is mounted | `boolean` | No | `false` |
| `isDateDisabled` | A function that returns whether or not a date is disabled | `Matcher` | No | - |
| `isDateHighlightable` | A function that returns whether or not a date is hightable | `Matcher` | No | - |
| `isDateUnavailable` | A function that returns whether or not a date is unavailable | `Matcher` | No | - |
| `locale` | The locale to use for formatting dates | `string` | No | - |
| `maximumDays` | The maximum number of days that can be selected in a range | `number` | No | - |
| `maxValue` | The maximum date that can be selected | `DateValue` | No | - |
| `minValue` | The minimum date that can be selected | `DateValue` | No | - |
| `modelValue` | The controlled selected date range of the calendar. Can be bound as v-model. | `DateRange \| null` | No | - |
| `nextPage` | A function that returns the next page of the calendar. It receives the current placeholder as an argument inside the component. | `((placeholder: DateValue) => DateValue)` | No | - |
| `numberOfMonths` | The number of months to display at once | `number` | No | `1` |
| `pagedNavigation` | This property causes the previous and next buttons to navigate by the number of months displayed at once, rather than one month | `boolean` | No | `false` |
| `placeholder` | The placeholder date, which is used to determine what month to display when no date is selected. This updates as the user navigates the calendar and can be used to programmatically control the calendar view | `DateValue` | No | - |
| `preventDeselect` | Whether or not to prevent the user from deselecting a date without selecting another date first | `boolean` | No | `false` |
| `prevPage` | A function that returns the previous page of the calendar. It receives the current placeholder as an argument inside the component. | `((placeholder: DateValue) => DateValue)` | No | - |
| `readonly` | Whether or not the calendar is readonly | `boolean` | No | `false` |
| `weekdayFormat` | The format to use for the weekday strings provided via the weekdays slot prop | `"narrow" \| "short" \| "long"` | No | `"narrow"` |
| `weekStartsOn` | The day of the week to start the calendar on | `0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6` | No | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `update:modelValue` | Event handler called whenever the model value changes | `[date: DateRange]` |
| `update:placeholder` | Event handler called whenever the placeholder value changes | `[date: DateValue]` |
| `update:startValue` | Event handler called whenever the start value changes | `[date: DateValue]` |
| `update:validModelValue` | Event handler called whenever there is a new validModel | `[date: DateRange]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `date` | The current date of the placeholder | `DateValue` |
| `grid` | The grid of dates | `Grid<DateValue>[]` |
| `weekDays` | The days of the week | `string[]` |
| `weekStartsOn` | The start of the week | `0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6` |
| `locale` | The calendar locale | `string` |
| `fixedWeeks` | Whether or not to always display 6 weeks in the calendar | `boolean` |
| `modelValue` | The current date range | `DateRange` |

</llm-only>
