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
    'type': 'DateRange',
    'required': false,
    'default': '{ start: undefined, end: undefined }'
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
    'name': 'granularity',
    'description': '<p>The unit both ends of the range commit: a day, a month or a year. Views finer than this are unreachable.</p>\n',
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
    'name': 'isDateHighlightable',
    'description': '<p>A function that returns whether or not a date is highlightable</p>\n',
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
    'name': 'maximumDays',
    'description': '<p>The maximum number of days in the range (inclusive). Alias of <code>maximumLength</code> for day ranges.</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'maximumLength',
    'description': '<p>The maximum length of the range (inclusive), counted in units of <code>granularity</code>: days, months or years.</p>\n',
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
    'name': 'maxView',
    'description': '<p>The coarsest view <code>RangeCalendarViewTrigger</code> can switch to.</p>\n',
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
    'description': '<p>The controlled selected date range of the calendar. Can be bound as <code>v-model</code>.</p>\n',
    'type': 'DateRange | null',
    'required': false
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
    'description': '<p>The placeholder date, which is used to determine what page to display when no date is selected. This updates as the user navigates the calendar and can be used to programmatically control the calendar view</p>\n',
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
    'description': '<p>Whether or not the calendar is readonly</p>\n',
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
    'type': '[date: DateRange, details: ChangeEventDetails&lt;RangeCalendarChangeReason, Event&gt;]'
  },
  {
    'name': 'beforeUpdate:placeholder',
    'description': '<p>Event handler called before the placeholder changes; <code>details.cancel()</code> vetoes the change.</p>\n',
    'type': '[date: DateValue, details: ChangeEventDetails&lt;RangeCalendarChangeReason, Event&gt;]'
  },
  {
    'name': 'beforeUpdate:view',
    'description': '<p>Event handler called before the view changes; <code>details.cancel()</code> vetoes the change.</p>\n',
    'type': '[view: CalendarUnit, details: ChangeEventDetails&lt;RangeCalendarChangeReason, Event&gt;]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called whenever the model value changes</p>\n',
    'type': '[date: DateRange, details: ChangeEventDetails&lt;RangeCalendarChangeReason, Event&gt;]'
  },
  {
    'name': 'update:placeholder',
    'description': '<p>Event handler called whenever the placeholder value changes</p>\n',
    'type': '[date: DateValue, details: ChangeEventDetails&lt;RangeCalendarChangeReason, Event&gt;]'
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
  },
  {
    'name': 'update:view',
    'description': '<p>Event handler called whenever the view changes</p>\n',
    'type': '[view: CalendarUnit, details: ChangeEventDetails&lt;RangeCalendarChangeReason, Event&gt;]'
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
    'description': '<p>The current date range</p>\n',
    'type': 'DateRange'
  },
  {
    'name': 'view',
    'description': '<p>The active view</p>\n',
    'type': '\'day\' | \'month\' | \'year\''
  },
  {
    'name': 'granularity',
    'description': '<p>The unit both ends of the range commit</p>\n',
    'type': 'CalendarUnit'
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
| `columns` | The number of cells per row in the month and year views | `number` | No | `4` |
| `defaultPlaceholder` | The default placeholder date | `DateValue` | No | - |
| `defaultValue` | The default value for the calendar | `DateRange` | No | `{ start: undefined, end: undefined }` |
| `defaultView` | The view shown initially. Defaults to granularity. | `"day" \| "month" \| "year"` | No | - |
| `dir` | The reading direction of the calendar when applicable. <br> If omitted, inherits globally from ConfigProvider or assumes LTR (left-to-right) reading mode. | `"ltr" \| "rtl"` | No | - |
| `disabled` | Whether or not the calendar is disabled | `boolean` | No | `false` |
| `disableDaysOutsideCurrentView` | Whether or not to disable days outside the current view. | `boolean` | No | `false` |
| `fixedDate` | Which part of the range should be fixed | `"start" \| "end"` | No | - |
| `fixedWeeks` | Whether or not to always display 6 weeks in the calendar | `boolean` | No | `false` |
| `granularity` | The unit both ends of the range commit: a day, a month or a year. Views finer than this are unreachable. | `"day" \| "month" \| "year"` | No | `"day"` |
| `initialFocus` | If true, the calendar will focus the selected day, today, or the first day of the month depending on what is visible when the calendar is mounted | `boolean` | No | `false` |
| `isDateDisabled` | A function that returns whether or not a date is disabled. Receives the unit of the cell being tested as its second argument. | `Matcher` | No | - |
| `isDateHighlightable` | A function that returns whether or not a date is highlightable | `Matcher` | No | - |
| `isDateUnavailable` | A function that returns whether or not a date is unavailable. Receives the unit of the cell being tested as its second argument. | `Matcher` | No | - |
| `locale` | The locale to use for formatting dates | `string` | No | - |
| `maximumDays` | The maximum number of days in the range (inclusive). Alias of maximumLength for day ranges. | `number` | No | - |
| `maximumLength` | The maximum length of the range (inclusive), counted in units of granularity: days, months or years. | `number` | No | - |
| `maxValue` | The maximum date that can be selected | `DateValue` | No | - |
| `maxView` | The coarsest view RangeCalendarViewTrigger can switch to. | `"day" \| "month" \| "year"` | No | `"year"` |
| `minValue` | The minimum date that can be selected | `DateValue` | No | - |
| `modelValue` | The controlled selected date range of the calendar. Can be bound as v-model. | `DateRange \| null` | No | - |
| `nextPage` | A function that returns the next page of the calendar. It receives the current placeholder and the active view. | `CalendarPageFunction` | No | - |
| `numberOfMonths` | The number of months to display at once in the day view | `number` | No | `1` |
| `pagedNavigation` | This property causes the previous and next buttons to navigate by the number of months displayed at once, rather than one month | `boolean` | No | `false` |
| `placeholder` | The placeholder date, which is used to determine what page to display when no date is selected. This updates as the user navigates the calendar and can be used to programmatically control the calendar view | `DateValue` | No | - |
| `preventDeselect` | Whether or not to prevent the user from deselecting a date without selecting another date first | `boolean` | No | `false` |
| `prevPage` | A function that returns the previous page of the calendar. It receives the current placeholder and the active view. | `CalendarPageFunction` | No | - |
| `readonly` | Whether or not the calendar is readonly | `boolean` | No | `false` |
| `view` | The controlled view: the unit the calendar currently shows. Can be bound as v-model:view. | `"day" \| "month" \| "year"` | No | - |
| `weekdayFormat` | The format to use for the weekday strings provided via the weekdays slot prop | `"narrow" \| "short" \| "long"` | No | `"narrow"` |
| `weekStartsOn` | The day of the week to start the calendar on | `0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6` | No | - |
| `yearsPerPage` | The number of years to display per page in the year view | `number` | No | `12` |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `beforeUpdate:modelValue` | Event handler called before the model value changes; details.cancel() vetoes the change. | `[date: DateRange, details: ChangeEventDetails<RangeCalendarChangeReason, Event>]` |
| `beforeUpdate:placeholder` | Event handler called before the placeholder changes; details.cancel() vetoes the change. | `[date: DateValue, details: ChangeEventDetails<RangeCalendarChangeReason, Event>]` |
| `beforeUpdate:view` | Event handler called before the view changes; details.cancel() vetoes the change. | `[view: CalendarUnit, details: ChangeEventDetails<RangeCalendarChangeReason, Event>]` |
| `update:modelValue` | Event handler called whenever the model value changes | `[date: DateRange, details: ChangeEventDetails<RangeCalendarChangeReason, Event>]` |
| `update:placeholder` | Event handler called whenever the placeholder value changes | `[date: DateValue, details: ChangeEventDetails<RangeCalendarChangeReason, Event>]` |
| `update:startValue` | Event handler called whenever the start value changes | `[date: DateValue]` |
| `update:validModelValue` | Event handler called whenever there is a new validModel | `[date: DateRange]` |
| `update:view` | Event handler called whenever the view changes | `[view: CalendarUnit, details: ChangeEventDetails<RangeCalendarChangeReason, Event>]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `date` | The current date of the placeholder | `DateValue` |
| `grid` | The rendered page(s) of the active view | `CalendarGridData[]` |
| `weekDays` | The days of the week (day view only) | `string[]` |
| `weekStartsOn` | The start of the week | `0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6` |
| `locale` | The calendar locale | `string` |
| `fixedWeeks` | Whether or not to always display 6 weeks in the calendar | `boolean` |
| `modelValue` | The current date range | `DateRange` |
| `view` | The active view | `"day" \| "month" \| "year"` |
| `granularity` | The unit both ends of the range commit | `CalendarUnit` |

</llm-only>
