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
    'name': 'value',
    'description': '<p>The date value of the cell: a day, the first day of a month, or the first day of a year</p>\n',
    'type': 'DateValue',
    'required': true
  }
]" />

<SlotsTable :data="[
  {
    'name': 'cellValue',
    'description': '<p>Formatted cell text: <code>5</code>, <code>Sep</code>, <code>2026</code></p>\n',
    'type': 'string'
  },
  {
    'name': 'disabled',
    'description': '<p>Current disable state</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'selected',
    'description': '<p>Current selected state</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'today',
    'description': '<p>Whether the cell is today / the current month / the current year</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'outsideView',
    'description': '<p>Whether the cell belongs to a neighbouring page (a leading/trailing day)</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'outsideVisibleView',
    'description': '<p>Whether the cell\'s unit is outside the rendered page(s)</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'unavailable',
    'description': '<p>Current unavailable state</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'view',
    'description': '<p>The unit the cell renders</p>\n',
    'type': '\'day\' | \'month\' | \'year\''
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `value` | The date value of the cell: a day, the first day of a month, or the first day of a year | `DateValue` | Yes | - |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `cellValue` | Formatted cell text: 5, Sep, 2026 | `string` |
| `disabled` | Current disable state | `boolean` |
| `selected` | Current selected state | `boolean` |
| `today` | Whether the cell is today / the current month / the current year | `boolean` |
| `outsideView` | Whether the cell belongs to a neighbouring page (a leading/trailing day) | `boolean` |
| `outsideVisibleView` | Whether the cell's unit is outside the rendered page(s) | `boolean` |
| `unavailable` | Current unavailable state | `boolean` |
| `view` | The unit the cell renders | `"day" \| "month" \| "year"` |

</llm-only>
