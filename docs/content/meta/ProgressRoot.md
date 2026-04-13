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
    'name': 'getValueLabel',
    'description': '<p>A function to get the accessible label text in a human-readable format.</p>\n<p>If not provided, the value label will be read as the numeric value as a percentage of the max value.</p>\n',
    'type': '((value: number | null, max: number) =&gt; string)',
    'required': false,
    'default': 'isNumber(value) ? `${Math.round((value / max) * DEFAULT_MAX)}%` : undefined'
  },
  {
    'name': 'getValueText',
    'description': '<p>A function to get the accessible value text representing the current value in a human-readable format.</p>\n',
    'type': '((value: number | null, max: number) =&gt; string)',
    'required': false
  },
  {
    'name': 'max',
    'description': '<p>The maximum progress value.</p>\n',
    'type': 'number',
    'required': false,
    'default': 'DEFAULT_MAX'
  },
  {
    'name': 'modelValue',
    'description': '<p>The progress value. Can be bind as <code>v-model</code>.</p>\n',
    'type': 'number | null',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:max',
    'description': '<p>Event handler called when the max value changes</p>\n',
    'type': '[value: number]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the progress value changes</p>\n',
    'type': '[value: string[]]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>Current input values</p>\n',
    'type': 'number | null | undefined'
  }
]" />

<MethodsTable :data="[
  {
    'name': 'getValueLabel',
    'description': '<p>A function to get the accessible label text in a human-readable format.</p>\n<p>If not provided, the value label will be read as the numeric value as a percentage of the max value.</p>\n',
    'type': '(value: number | null | undefined, max: number) =&gt; string | undefined'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `getValueLabel` | A function to get the accessible label text in a human-readable format. If not provided, the value label will be read as the numeric value as a percentage of the max value. | `((value: number \| null, max: number) => string)` | No | `isNumber(value) ? `${Math.round((value / max) * DEFAULT_MAX)}%` : undefined` |
| `getValueText` | A function to get the accessible value text representing the current value in a human-readable format. | `((value: number \| null, max: number) => string)` | No | - |
| `max` | The maximum progress value. | `number` | No | `DEFAULT_MAX` |
| `modelValue` | The progress value. Can be bind as v-model. | `number \| null` | No | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `update:max` | Event handler called when the max value changes | `[value: number]` |
| `update:modelValue` | Event handler called when the progress value changes | `[value: string[]]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `modelValue` | Current input values | `number \| null \| undefined` |

**Methods**

| Name | Description | Type |
| --- | --- | --- |
| `getValueLabel` | A function to get the accessible label text in a human-readable format. If not provided, the value label will be read as the numeric value as a percentage of the max value. | `(value: number \| null \| undefined, max: number) => string \| undefined` |

</llm-only>
