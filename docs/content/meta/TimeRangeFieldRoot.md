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
    'name': 'defaultPlaceholder',
    'description': '<p>The default placeholder time</p>\n',
    'type': 'TimeValue',
    'required': false
  },
  {
    'name': 'defaultValue',
    'description': '<p>The default value for the field</p>\n',
    'type': 'TimeRange',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>The reading direction of the time field when applicable. &lt;br&gt; If omitted, inherits globally from <code>ConfigProvider</code> or assumes LTR (left-to-right) reading mode.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>Whether or not the time field is disabled</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'granularity',
    'description': '<p>The granularity to use for formatting times. Defaults to minute. The field will render segments for each part of the time up to and including the specified granularity</p>\n',
    'type': '\'hour\' | \'minute\' | \'second\'',
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
    'name': 'isTimeUnavailable',
    'description': '<p>A function that returns whether or not a time is unavailable</p>\n',
    'type': 'Matcher',
    'required': false
  },
  {
    'name': 'locale',
    'description': '<p>The locale to use for formatting times</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'maxValue',
    'description': '<p>The maximum time that can be selected</p>\n',
    'type': 'TimeValue',
    'required': false
  },
  {
    'name': 'minValue',
    'description': '<p>The minimum time that can be selected</p>\n',
    'type': 'TimeValue',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled checked state of the field. Can be bound as <code>v-model</code>.</p>\n',
    'type': 'TimeRange | null',
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
    'description': '<p>The placeholder time, which is used to determine what time to display when no time is selected. This updates as the user navigates the field</p>\n',
    'type': 'TimeValue',
    'required': false
  },
  {
    'name': 'readonly',
    'description': '<p>Whether or not the time field is readonly</p>\n',
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
    'type': '[date: TimeRange]'
  },
  {
    'name': 'update:placeholder',
    'description': '<p>Event handler called whenever the placeholder value changes</p>\n',
    'type': '[date: TimeValue]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>The current time of the field</p>\n',
    'type': 'TimeRange | undefined'
  },
  {
    'name': 'segments',
    'description': '<p>The time field segment contents</p>\n',
    'type': '{ start: { part: SegmentPart; value: string; }[]; end: { part: SegmentPart; value: string; }[]; }'
  },
  {
    'name': 'isInvalid',
    'description': '<p>Value if the input is invalid</p>\n',
    'type': 'boolean'
  }
]" />

<MethodsTable :data="[
  {
    'name': 'setFocusedElement',
    'description': '<p>Helper to set the focused element inside the TimeRangeField</p>\n',
    'type': '(el: HTMLElement) =&gt; void'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `defaultPlaceholder` | The default placeholder time | `TimeValue` | No | - |
| `defaultValue` | The default value for the field | `TimeRange` | No | - |
| `dir` | The reading direction of the time field when applicable. <br> If omitted, inherits globally from ConfigProvider or assumes LTR (left-to-right) reading mode. | `"ltr" \| "rtl"` | No | - |
| `disabled` | Whether or not the time field is disabled | `boolean` | No | `false` |
| `granularity` | The granularity to use for formatting times. Defaults to minute. The field will render segments for each part of the time up to and including the specified granularity | `"hour" \| "minute" \| "second"` | No | - |
| `hideTimeZone` | Whether or not to hide the time zone segment of the field | `boolean` | No | - |
| `hourCycle` | The hour cycle used for formatting times. Defaults to the local preference | `12 \| 24` | No | - |
| `id` | Id of the element | `string` | No | - |
| `isTimeUnavailable` | A function that returns whether or not a time is unavailable | `Matcher` | No | - |
| `locale` | The locale to use for formatting times | `string` | No | - |
| `maxValue` | The maximum time that can be selected | `TimeValue` | No | - |
| `minValue` | The minimum time that can be selected | `TimeValue` | No | - |
| `modelValue` | The controlled checked state of the field. Can be bound as v-model. | `TimeRange \| null` | No | - |
| `name` | The name of the field. Submitted with its owning form as part of a name/value pair. | `string` | No | - |
| `placeholder` | The placeholder time, which is used to determine what time to display when no time is selected. This updates as the user navigates the field | `TimeValue` | No | - |
| `readonly` | Whether or not the time field is readonly | `boolean` | No | `false` |
| `required` | When true, indicates that the user must set the value before the owning form can be submitted. | `boolean` | No | - |
| `step` | The stepping interval for the time fields. Defaults to 1. | `DateStep` | No | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `update:modelValue` | Event handler called whenever the model value changes | `[date: TimeRange]` |
| `update:placeholder` | Event handler called whenever the placeholder value changes | `[date: TimeValue]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `modelValue` | The current time of the field | `TimeRange \| undefined` |
| `segments` | The time field segment contents | `{ start: { part: SegmentPart; value: string; }[]; end: { part: SegmentPart; value: string; }[]; }` |
| `isInvalid` | Value if the input is invalid | `boolean` |

**Methods**

| Name | Description | Type |
| --- | --- | --- |
| `setFocusedElement` | Helper to set the focused element inside the TimeRangeField | `(el: HTMLElement) => void` |

</llm-only>
