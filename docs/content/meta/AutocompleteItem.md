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
    'description': '<p>A string representation of the item contents.</p>\n<p>If the children are not plain text, then the <code>textValue</code> prop must also be set to a plain text representation, which is used to filter the items and for typeahead.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'value',
    'description': '<p>The value of the item, of the root\'s item type <code>T</code> (<code>string</code> by default). Selecting the item writes <code>displayValue(value)</code> into the input, else <code>String(value)</code>.</p>\n',
    'type': 'T',
    'required': true
  }
]" />

<EmitsTable :data="[
  {
    'name': 'select',
    'description': '<p>Event handler called when the selecting item. &lt;br&gt; It can be prevented by calling <code>event.preventDefault</code>.</p>\n',
    'type': '[event: SelectEvent&lt;T&gt;]'
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
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `disabled` | When true, prevents the user from interacting with the item. | `boolean` | No | - |
| `textValue` | A string representation of the item contents. If the children are not plain text, then the textValue prop must also be set to a plain text representation, which is used to filter the items and for typeahead. | `string` | No | - |
| `value` | The value of the item, of the root's item type T (string by default). Selecting the item writes displayValue(value) into the input, else String(value). | `T` | Yes | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `select` | Event handler called when the selecting item. <br> It can be prevented by calling event.preventDefault. | `[event: SelectEvent<T>]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `selected` | Whether the item is currently selected | `boolean` |

</llm-only>
