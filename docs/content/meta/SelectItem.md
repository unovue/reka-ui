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
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with the item.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'textValue',
    'description': '<p>Optional text used for typeahead purposes.</p>\n<p>By default the typeahead behavior will use the <code>.textContent</code> of the <code>SelectItemText</code> part.</p>\n<p>Use this when the content is complex, or you have non-textual content inside.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'value',
    'description': '<p>The value given as data when submitted with a <code>name</code>. In a single select, <code>null</code> is the empty value, so pressing an\nitem with a <code>null</code> value clears the selection, and an empty string is allowed but a selected <code>\'\'</code>\nstill shows the placeholder. In a <code>multiple</code> select, <code>null</code> and <code>\'\'</code> are ordinary values that toggle in the array.</p>\n',
    'type': 'AcceptableValue',
    'required': true
  }
]" />

<EmitsTable :data="[
  {
    'name': 'select',
    'description': '<p>Event handler called when the selecting item. &lt;br&gt; It can be prevented by calling <code>event.preventDefault</code>.</p>\n',
    'type': '[event: SelectEvent&lt;AcceptableValue&gt;]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'selected',
    'description': '<p>Whether the item is currently selected</p>\n',
    'type': 'boolean'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by `asChild`. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `disabled` | When `true`, prevents the user from interacting with the item. | `boolean` | No | - |
| `textValue` | Optional text used for typeahead purposes. By default the typeahead behavior will use the `.textContent` of the `SelectItemText` part. Use this when the content is complex, or you have non-textual content inside. | `string` | No | - |
| `value` | The value given as data when submitted with a `name`. In a single select, `null` is the empty value, so pressing an item with a `null` value clears the selection, and an empty string is allowed but a selected `''` still shows the placeholder. In a `multiple` select, `null` and `''` are ordinary values that toggle in the array. | `AcceptableValue` | Yes | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `select` | Event handler called when the selecting item. \<br> It can be prevented by calling `event.preventDefault`. | `[event: SelectEvent<AcceptableValue>]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `selected` | Whether the item is currently selected | `boolean` |

</llm-only>
