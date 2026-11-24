<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'addOnBlur',
    'description': '<p>When <code>true</code> allow adding tags blur input</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'addOnPaste',
    'description': '<p>When <code>true</code>, allow adding tags on paste. Work in conjunction with delimiter prop.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'addOnTab',
    'description': '<p>When <code>true</code> allow adding tags on tab keydown</p>\n',
    'type': 'boolean',
    'required': false
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
    'name': 'convertValue',
    'description': '<p>Convert the input value to the desired type. Mandatory when using objects as values and using <code>TagsInputInput</code></p>\n',
    'type': '((value: string) =&gt; T)',
    'required': false
  },
  {
    'name': 'defaultValue',
    'description': '<p>The value of the tags that should be added. Use when you do not need to control the state of the tags input</p>\n',
    'type': 'T[]',
    'required': false,
    'default': '[]'
  },
  {
    'name': 'delimiter',
    'description': '<p>The character or regular expression to trigger the addition of a new tag. Also used to split tags for <code>@paste</code> event</p>\n',
    'type': 'string | RegExp',
    'required': false,
    'default': '\',\''
  },
  {
    'name': 'dir',
    'description': '<p>The reading direction of the combobox when applicable. &lt;br&gt; If omitted, inherits globally from <code>ConfigProvider</code> or assumes LTR (left-to-right) reading mode.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with the tags input.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'displayValue',
    'description': '<p>Display the value of the tag. Useful when you want to apply modifications to the value like adding a suffix or when using object as values</p>\n',
    'type': '((value: T) =&gt; string)',
    'required': false,
    'default': 'value.toString()'
  },
  {
    'name': 'duplicate',
    'description': '<p>When <code>true</code>, allow duplicated tags.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'id',
    'description': '',
    'type': 'string',
    'required': false
  },
  {
    'name': 'max',
    'description': '<p>Maximum number of tags.</p>\n',
    'type': 'number',
    'required': false,
    'default': '0'
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled value of the tags input. Can be bind as <code>v-model</code>.</p>\n',
    'type': 'T[] | null',
    'required': false
  },
  {
    'name': 'name',
    'description': '<p>The name of the field. Submitted with its owning form as part of a name/value pair.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'required',
    'description': '<p>When <code>true</code>, indicates that the user must set the value before the owning form can be submitted.</p>\n',
    'type': 'boolean',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'addTag',
    'description': '<p>Event handler called when tag is added</p>\n',
    'type': '[payload: T]'
  },
  {
    'name': 'invalid',
    'description': '<p>Event handler called when the value is invalid</p>\n',
    'type': '[payload: T]'
  },
  {
    'name': 'removeTag',
    'description': '<p>Event handler called when tag is removed</p>\n',
    'type': '[payload: T]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the value changes</p>\n',
    'type': '[payload: T[]]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>Current input values</p>\n',
    'type': 'string | number | bigint | Record&lt;string, any&gt;'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `addOnBlur` | When true allow adding tags blur input | `boolean` | No | - |
| `addOnPaste` | When true, allow adding tags on paste. Work in conjunction with delimiter prop. | `boolean` | No | - |
| `addOnTab` | When true allow adding tags on tab keydown | `boolean` | No | - |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `convertValue` | Convert the input value to the desired type. Mandatory when using objects as values and using TagsInputInput | `((value: string) => T)` | No | - |
| `defaultValue` | The value of the tags that should be added. Use when you do not need to control the state of the tags input | `T[]` | No | `[]` |
| `delimiter` | The character or regular expression to trigger the addition of a new tag. Also used to split tags for @paste event | `string \| RegExp` | No | `","` |
| `dir` | The reading direction of the combobox when applicable. <br> If omitted, inherits globally from ConfigProvider or assumes LTR (left-to-right) reading mode. | `"ltr" \| "rtl"` | No | - |
| `disabled` | When true, prevents the user from interacting with the tags input. | `boolean` | No | - |
| `displayValue` | Display the value of the tag. Useful when you want to apply modifications to the value like adding a suffix or when using object as values | `((value: T) => string)` | No | `value.toString()` |
| `duplicate` | When true, allow duplicated tags. | `boolean` | No | - |
| `id` |  | `string` | No | - |
| `max` | Maximum number of tags. | `number` | No | `0` |
| `modelValue` | The controlled value of the tags input. Can be bind as v-model. | `T[] \| null` | No | - |
| `name` | The name of the field. Submitted with its owning form as part of a name/value pair. | `string` | No | - |
| `required` | When true, indicates that the user must set the value before the owning form can be submitted. | `boolean` | No | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `addTag` | Event handler called when tag is added | `[payload: T]` |
| `invalid` | Event handler called when the value is invalid | `[payload: T]` |
| `removeTag` | Event handler called when tag is removed | `[payload: T]` |
| `update:modelValue` | Event handler called when the value changes | `[payload: T[]]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `modelValue` | Current input values | `string \| number \| bigint \| Record<string, any>` |

</llm-only>
