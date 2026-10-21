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
    'name': 'by',
    'description': '<p>Use this to compare objects by a particular field, or pass your own comparison function for complete control over how objects are compared.</p>\n',
    'type': 'string | ((a: T, b: T) =&gt; boolean)',
    'required': false
  },
  {
    'name': 'defaultValue',
    'description': '<p>The value of the selected tag(s) when initially rendered. Use when you do not need to control the selection.</p>\n',
    'type': 'T | T[]',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>The reading direction of the tag group when applicable. &lt;br&gt; If omitted, inherits globally from <code>ConfigProvider</code> or assumes LTR (left-to-right) reading mode.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with the tag group and all its tags.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'disallowEmptySelection',
    'description': '<p>When <code>true</code>, the user cannot deselect the last selected tag.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'escapeKeyBehavior',
    'description': '<p>Whether pressing &lt;kbd&gt;Escape&lt;/kbd&gt; clears the selection.</p>\n',
    'type': '\'none\' | \'clearSelection\'',
    'required': false,
    'default': '\'clearSelection\''
  },
  {
    'name': 'loop',
    'description': '<p>When <code>true</code>, keyboard navigation will loop from last tag to first, and vice versa.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled value of the selected tag(s). Can be binded with <code>v-model</code>. An array when <code>selectionMode</code> is <code>multiple</code>.</p>\n',
    'type': 'T | T[]',
    'required': false
  },
  {
    'name': 'selectionMode',
    'description': '<p>The type of selection that is allowed. Tags are not selectable when <code>none</code>.</p>\n',
    'type': '\'single\' | \'multiple\' | \'none\'',
    'required': false,
    'default': '\'none\''
  }
]" />

<EmitsTable :data="[
  {
    'name': 'remove',
    'description': '<p>Event handler called when the user removes tags, with the values to remove.\nTags are only removable when this event has a listener; remove the values from your own list to remove the tags.</p>\n',
    'type': '[values: T[]]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the selection changes.</p>\n',
    'type': '[value: T | T[]]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>Current selected value(s)</p>\n',
    'type': 'T | T[] | undefined'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `by` | Use this to compare objects by a particular field, or pass your own comparison function for complete control over how objects are compared. | `string \| ((a: T, b: T) => boolean)` | No | - |
| `defaultValue` | The value of the selected tag(s) when initially rendered. Use when you do not need to control the selection. | `T \| T[]` | No | - |
| `dir` | The reading direction of the tag group when applicable. <br> If omitted, inherits globally from ConfigProvider or assumes LTR (left-to-right) reading mode. | `"ltr" \| "rtl"` | No | - |
| `disabled` | When true, prevents the user from interacting with the tag group and all its tags. | `boolean` | No | - |
| `disallowEmptySelection` | When true, the user cannot deselect the last selected tag. | `boolean` | No | - |
| `escapeKeyBehavior` | Whether pressing <kbd>Escape</kbd> clears the selection. | `"none" \| "clearSelection"` | No | `"clearSelection"` |
| `loop` | When true, keyboard navigation will loop from last tag to first, and vice versa. | `boolean` | No | `true` |
| `modelValue` | The controlled value of the selected tag(s). Can be binded with v-model. An array when selectionMode is multiple. | `T \| T[]` | No | - |
| `selectionMode` | The type of selection that is allowed. Tags are not selectable when none. | `"single" \| "multiple" \| "none"` | No | `"none"` |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `remove` | Event handler called when the user removes tags, with the values to remove. Tags are only removable when this event has a listener; remove the values from your own list to remove the tags. | `[values: T[]]` |
| `update:modelValue` | Event handler called when the selection changes. | `[value: T \| T[]]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `modelValue` | Current selected value(s) | `T \| T[] \| undefined` |

</llm-only>
