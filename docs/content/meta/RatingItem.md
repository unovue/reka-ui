<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>The element or component this component should render as. Can be overwritten by <code>asChild</code>.</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'label\''
  },
  {
    'name': 'asChild',
    'description': '<p>Change the default rendered element for the one passed as a child, merging their props and behavior.</p>\n<p>Read our <a href=\'https://www.reka-ui.com/docs/guides/composition\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'item',
    'description': '<p>The 1-based index of this item within the rating (e.g. the 3rd star).</p>\n',
    'type': 'number',
    'required': true
  }
]" />

<SlotsTable :data="[
  {
    'name': 'steps',
    'description': '',
    'type': 'number[]'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"label"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `item` | The 1-based index of this item within the rating (e.g. the 3rd star). | `number` | Yes | - |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `steps` |  | `number[]` |

</llm-only>
