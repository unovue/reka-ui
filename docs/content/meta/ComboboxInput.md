<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>The element or component this component should render as. Can be overwritten by <code>asChild</code>.</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'input\''
  },
  {
    'name': 'asChild',
    'description': '<p>Change the default rendered element for the one passed as a child, merging their props and behavior.</p>\n<p>Read our <a href=\'https://www.reka-ui.com/docs/guides/composition\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'autoFocus',
    'description': '<p>Focus on element when mounted.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with item</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'displayValue',
    'description': '<p>The display value of input for selected item. Does not work with <code>multiple</code>.</p>\n',
    'type': '((val: any) =&gt; string)',
    'required': false
  },
  {
    'name': 'focusOnOpen',
    'description': '<p>Whether to move focus to the input when the combobox opens, whether it is opened\nby the trigger, the keyboard or the <code>open</code> prop. &lt;br&gt;\nSet to <code>false</code> to leave focus where it is, for example to keep the on-screen keyboard closed\non touch devices when the input sits inside <code>ComboboxContent</code>. The user can still focus the\ninput to type and navigate. While the combobox is open, <code>ArrowDown</code> / <code>ArrowUp</code> on a focused\n<code>ComboboxTrigger</code> move focus to the input. &lt;br&gt;\nThis is separate from <code>autoFocus</code>, which only focuses the input when it mounts.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled value of the filter. Can be binded with v-model.</p>\n',
    'type': 'string',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the value changes.</p>\n',
    'type': '[string]'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"input"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `autoFocus` | Focus on element when mounted. | `boolean` | No | - |
| `disabled` | When true, prevents the user from interacting with item | `boolean` | No | - |
| `displayValue` | The display value of input for selected item. Does not work with multiple. | `((val: any) => string)` | No | - |
| `focusOnOpen` | Whether to move focus to the input when the combobox opens, whether it is opened by the trigger, the keyboard or the open prop. <br> Set to false to leave focus where it is, for example to keep the on-screen keyboard closed on touch devices when the input sits inside ComboboxContent. The user can still focus the input to type and navigate. While the combobox is open, ArrowDown / ArrowUp on a focused ComboboxTrigger move focus to the input. <br> This is separate from autoFocus, which only focuses the input when it mounts. | `boolean` | No | `true` |
| `modelValue` | The controlled value of the filter. Can be binded with v-model. | `string` | No | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `update:modelValue` | Event handler called when the value changes. | `[string]` |

</llm-only>
