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
    'name': 'columns',
    'description': '<p>The number of cells per row in the month and year views</p>\n',
    'type': 'number',
    'required': false,
    'default': '4'
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
    'type': 'DateValue | DateValue[]',
    'required': false
  },
  {
    'name': 'defaultView',
    'description': '<p>The view shown initially. Defaults to <code>granularity</code>.</p>\n',
    'type': '\'day\' | \'month\' | \'year\'',
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
    'name': 'granularity',
    'description': '<p>The unit a selection commits: a day, a month or a year. Views finer than this are unreachable.</p>\n',
    'type': '\'day\' | \'month\' | \'year\'',
    'required': false,
    'default': '\'day\''
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
    'description': '<p>A function that returns whether or not a date is disabled. Receives the unit of the cell being tested as its second argument.</p>\n',
    'type': 'Matcher',
    'required': false
  },
  {
    'name': 'isDateUnavailable',
    'description': '<p>A function that returns whether or not a date is unavailable. Receives the unit of the cell being tested as its second argument.</p>\n',
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
    'name': 'maxView',
    'description': '<p>The coarsest view <code>CalendarViewTrigger</code> can switch to.</p>\n',
    'type': '\'day\' | \'month\' | \'year\'',
    'required': false,
    'default': '\'year\''
  },
  {
    'name': 'minValue',
    'description': '<p>The minimum date that can be selected</p>\n',
    'type': 'DateValue',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled selected date value of the calendar. Can be bound as <code>v-model</code>.</p>\n',
    'type': 'DateValue | DateValue[] | null',
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
    'description': '<p>A function that returns the next page of the calendar. It receives the current placeholder and the active view.</p>\n',
    'type': 'CalendarPageFunction',
    'required': false
  },
  {
    'name': 'numberOfMonths',
    'description': '<p>The number of months to display at once in the day view</p>\n',
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
    'description': '<p>The placeholder date, which is used to determine what page to display when no date is selected</p>\n',
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
    'description': '<p>A function that returns the previous page of the calendar. It receives the current placeholder and the active view.</p>\n',
    'type': 'CalendarPageFunction',
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
    'name': 'view',
    'description': '<p>The controlled view: the unit the calendar currently shows. Can be bound as <code>v-model:view</code>.</p>\n',
    'type': '\'day\' | \'month\' | \'year\'',
    'required': false
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
  },
  {
    'name': 'yearsPerPage',
    'description': '<p>The number of years to display per page in the year view</p>\n',
    'type': 'number',
    'required': false,
    'default': '12'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'beforeUpdate:modelValue',
    'description': '<p>Event handler called before the model value changes; <code>details.cancel()</code> vetoes the change.</p>\n',
    'type': '[date: CalendarModelValue, details: ChangeEventDetails&lt;CalendarChangeReason, Event&gt;]'
  },
  {
    'name': 'beforeUpdate:placeholder',
    'description': '<p>Event handler called before the placeholder changes; <code>details.cancel()</code> vetoes the change.</p>\n',
    'type': '[date: DateValue, details: ChangeEventDetails&lt;CalendarChangeReason, Event&gt;]'
  },
  {
    'name': 'beforeUpdate:view',
    'description': '<p>Event handler called before the view changes; <code>details.cancel()</code> vetoes the change.</p>\n',
    'type': '[view: CalendarUnit, details: ChangeEventDetails&lt;CalendarChangeReason, Event&gt;]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called whenever the model value changes</p>\n',
    'type': '[date: CalendarModelValue, details: ChangeEventDetails&lt;CalendarChangeReason, Event&gt;]'
  },
  {
    'name': 'update:placeholder',
    'description': '<p>Event handler called whenever the placeholder value changes</p>\n',
    'type': '[date: DateValue, details: ChangeEventDetails&lt;CalendarChangeReason, Event&gt;]'
  },
  {
    'name': 'update:view',
    'description': '<p>Event handler called whenever the view changes</p>\n',
    'type': '[view: CalendarUnit, details: ChangeEventDetails&lt;CalendarChangeReason, Event&gt;]'
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
    'description': '<p>The rendered page(s) of the active view</p>\n',
    'type': 'CalendarGridData[]'
  },
  {
    'name': 'weekDays',
    'description': '<p>The days of the week (day view only)</p>\n',
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
    'description': '<p>The current value of the calendar</p>\n',
    'type': 'CalendarModelValue'
  },
  {
    'name': 'view',
    'description': '<p>The active view</p>\n',
    'type': '\'day\' | \'month\' | \'year\''
  },
  {
    'name': 'granularity',
    'description': '<p>The unit a selection commits</p>\n',
    'type': 'CalendarUnit'
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
| `columns` | The number of cells per row in the month and year views | `number` | No | `4` |
| `defaultPlaceholder` | The default placeholder date | `DateValue` | No | - |
| `defaultValue` | The default value for the calendar | `DateValue \| DateValue[]` | No | - |
| `defaultView` | The view shown initially. Defaults to granularity. | `"day" \| "month" \| "year"` | No | - |
| `dir` | The reading direction of the calendar when applicable. <br> If omitted, inherits globally from ConfigProvider or assumes LTR (left-to-right) reading mode. | `"ltr" \| "rtl"` | No | - |
| `disabled` | Whether the calendar is disabled | `boolean` | No | `false` |
| `disableDaysOutsideCurrentView` | Whether or not to disable days outside the current view. | `boolean` | No | `false` |
| `fixedWeeks` | Whether or not to always display 6 weeks in the calendar | `boolean` | No | `false` |
| `granularity` | The unit a selection commits: a day, a month or a year. Views finer than this are unreachable. | `"day" \| "month" \| "year"` | No | `"day"` |
| `initialFocus` | If true, the calendar will focus the selected day, today, or the first day of the month depending on what is visible when the calendar is mounted | `boolean` | No | `false` |
| `isDateDisabled` | A function that returns whether or not a date is disabled. Receives the unit of the cell being tested as its second argument. | `Matcher` | No | - |
| `isDateUnavailable` | A function that returns whether or not a date is unavailable. Receives the unit of the cell being tested as its second argument. | `Matcher` | No | - |
| `locale` | The locale to use for formatting dates | `string` | No | - |
| `maxValue` | The maximum date that can be selected | `DateValue` | No | - |
| `maxView` | The coarsest view CalendarViewTrigger can switch to. | `"day" \| "month" \| "year"` | No | `"year"` |
| `minValue` | The minimum date that can be selected | `DateValue` | No | - |
| `modelValue` | The controlled selected date value of the calendar. Can be bound as v-model. | `DateValue \| DateValue[] \| null` | No | - |
| `multiple` | Whether multiple dates can be selected | `boolean` | No | `false` |
| `nextPage` | A function that returns the next page of the calendar. It receives the current placeholder and the active view. | `CalendarPageFunction` | No | - |
| `numberOfMonths` | The number of months to display at once in the day view | `number` | No | `1` |
| `pagedNavigation` | This property causes the previous and next buttons to navigate by the number of months displayed at once, rather than one month | `boolean` | No | `false` |
| `placeholder` | The placeholder date, which is used to determine what page to display when no date is selected | `DateValue` | No | - |
| `preventDeselect` | Whether or not to prevent the user from deselecting a date without selecting another date first | `boolean` | No | `false` |
| `prevPage` | A function that returns the previous page of the calendar. It receives the current placeholder and the active view. | `CalendarPageFunction` | No | - |
| `readonly` | Whether the calendar is readonly | `boolean` | No | `false` |
| `view` | The controlled view: the unit the calendar currently shows. Can be bound as v-model:view. | `"day" \| "month" \| "year"` | No | - |
| `weekdayFormat` | The format to use for the weekday strings provided via the weekdays slot prop | `"narrow" \| "short" \| "long"` | No | `"narrow"` |
| `weekStartsOn` | The day of the week to start the calendar on | `0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6` | No | - |
| `yearsPerPage` | The number of years to display per page in the year view | `number` | No | `12` |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `beforeUpdate:modelValue` | Event handler called before the model value changes; details.cancel() vetoes the change. | `[date: CalendarModelValue, details: ChangeEventDetails<CalendarChangeReason, Event>]` |
| `beforeUpdate:placeholder` | Event handler called before the placeholder changes; details.cancel() vetoes the change. | `[date: DateValue, details: ChangeEventDetails<CalendarChangeReason, Event>]` |
| `beforeUpdate:view` | Event handler called before the view changes; details.cancel() vetoes the change. | `[view: CalendarUnit, details: ChangeEventDetails<CalendarChangeReason, Event>]` |
| `update:modelValue` | Event handler called whenever the model value changes | `[date: CalendarModelValue, details: ChangeEventDetails<CalendarChangeReason, Event>]` |
| `update:placeholder` | Event handler called whenever the placeholder value changes | `[date: DateValue, details: ChangeEventDetails<CalendarChangeReason, Event>]` |
| `update:view` | Event handler called whenever the view changes | `[view: CalendarUnit, details: ChangeEventDetails<CalendarChangeReason, Event>]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `date` | The current date of the placeholder | `DateValue` |
| `grid` | The rendered page(s) of the active view | `CalendarGridData[]` |
| `weekDays` | The days of the week (day view only) | `string[]` |
| `weekStartsOn` | The start of the week | `0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6` |
| `locale` | The calendar locale | `string` |
| `fixedWeeks` | Whether or not to always display 6 weeks in the calendar | `boolean` |
| `modelValue` | The current value of the calendar | `CalendarModelValue` |
| `view` | The active view | `"day" \| "month" \| "year"` |
| `granularity` | The unit a selection commits | `CalendarUnit` |

</llm-only>
