<!-- This file was automatic generated. Do not edit it manually -->

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
    'name': 'defaultPlaceholder',
    'description': '<p>The default placeholder date</p>\n',
    'type': 'DateValue',
    'required': false
  },
  {
    'name': 'defaultValue',
    'description': '<p>The default value for the calendar</p>\n',
    'type': 'DateRange',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>The reading direction of the date field when applicable. &lt;br&gt; If omitted, inherits globally from <code>ConfigProvider</code> or assumes LTR (left-to-right) reading mode.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>Whether or not the date field is disabled</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'granularity',
    'description': '<p>The granularity to use for formatting times. Defaults to day if a CalendarDate is provided, otherwise defaults to minute. The field will render segments for each part of the date up to and including the specified granularity</p>\n',
    'type': '\'day\' | \'hour\' | \'minute\' | \'second\'',
    'required': false
  },
  {
    'name': 'hideTimeZone',
    'description': '<p>Whether or not to hide the time zone segment of the field</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'hourCycle',
    'description': '<p>The hour cycle used for formatting times. Defaults to the local preference</p>\n',
    'type': '12 | 24',
    'required': false
  },
  {
    'name': 'id',
    'description': '<p>Id of the element</p>\n',
    'type': 'string',
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
    'description': '<p>The controlled checked state of the calendar. Can be bound as <code>v-model</code>.</p>\n',
    'type': 'DateRange | null',
    'required': false
  },
  {
    'name': 'name',
    'description': '<p>The name of the field. Submitted with its owning form as part of a name/value pair.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'placeholder',
    'description': '<p>The placeholder date, which is used to determine what month to display when no date is selected. This updates as the user navigates the calendar and can be used to programmatically control the calendar view</p>\n',
    'type': 'DateValue',
    'required': false
  },
  {
    'name': 'readonly',
    'description': '<p>Whether or not the date field is readonly</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'required',
    'description': '<p>When <code>true</code>, indicates that the user must set the value before the owning form can be submitted.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'step',
    'description': '<p>The stepping interval for the time fields. Defaults to <code>1</code>.</p>\n',
    'type': 'DateStep',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called whenever the model value changes</p>\n',
    'type': '[DateRange]'
  },
  {
    'name': 'update:placeholder',
    'description': '<p>Event handler called whenever the placeholder value changes</p>\n',
    'type': '[date: DateValue]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '',
    'type': 'DateRange | null'
  },
  {
    'name': 'segments',
    'description': '',
    'type': '{ start: { part: SegmentPart; value: string; }[]; end: { part: SegmentPart; value: string; }[]; }'
  }
]" />

<MethodsTable :data="[
  {
    'name': 'isDateUnavailable',
    'description': '<p>A function that returns whether or not a date is unavailable</p>\n',
    'type': 'Matcher'
  },
  {
    'name': 'setFocusedElement',
    'description': '',
    'type': '(el: HTMLElement) => void'
  }
]" />
