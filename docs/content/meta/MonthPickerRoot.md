<!-- This file was automatically generated. Do not edit it manually -->

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
    'description': '<p>The accessible label for the month picker</p>\n',
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
    'description': '<p>The default value for the month picker</p>\n',
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
    'description': '<p>Whether the month picker is disabled</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'initialFocus',
    'description': '<p>If true, the month picker will focus the selected month, today, or the first month of the year on mount</p>\n',
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
    'description': '<p>The controlled selected month value of the month picker. Can be bound as <code>v-model</code>.</p>\n',
    'type': 'DateValue | DateValue[]',
    'required': false
  },
  {
    'name': 'multiple',
    'description': '<p>Whether multiple months can be selected</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'nextPage',
    'description': '<p>A function that returns the next page of the month picker. Receives the current placeholder as an argument.</p>\n',
    'type': '((placeholder: DateValue) =&gt; DateValue)',
    'required': false
  },
  {
    'name': 'placeholder',
    'description': '<p>The placeholder date, which is used to determine what year to display when no date is selected</p>\n',
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
    'description': '<p>A function that returns the previous page of the month picker. Receives the current placeholder as an argument.</p>\n',
    'type': '((placeholder: DateValue) =&gt; DateValue)',
    'required': false
  },
  {
    'name': 'readonly',
    'description': '<p>Whether the month picker is readonly</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
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
    'description': '<p>The grid of months</p>\n',
    'type': 'Grid&lt;DateValue&gt;'
  },
  {
    'name': 'locale',
    'description': '<p>The month picker locale</p>\n',
    'type': 'string'
  },
  {
    'name': 'modelValue',
    'description': '<p>The current selected value</p>\n',
    'type': 'DateValue | DateValue[] | undefined'
  }
]" />

<MethodsTable :data="[
  {
    'name': 'isMonthDisabled',
    'description': '<p>A function that returns whether or not a month is disabled</p>\n',
    'type': 'Matcher'
  },
  {
    'name': 'isMonthUnavailable',
    'description': '<p>A function that returns whether or not a month is unavailable</p>\n',
    'type': 'Matcher'
  }
]" />
