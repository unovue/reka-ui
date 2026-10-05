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
  }
]" />

<SlotsTable :data="[
  {
    'name': 'headingValue',
    'description': '<p>Heading of the active view (<code>September 2026</code>, <code>2026</code>, <code>2020 - 2031</code>)</p>\n',
    'type': 'string'
  },
  {
    'name': 'view',
    'description': '<p>The active view</p>\n',
    'type': '\'day\' | \'month\' | \'year\''
  },
  {
    'name': 'disabled',
    'description': '<p>Whether the trigger is disabled (at <code>maxView</code>, or the calendar is disabled)</p>\n',
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

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `headingValue` | Heading of the active view (September 2026, 2026, 2020 - 2031) | `string` |
| `view` | The active view | `"day" \| "month" \| "year"` |
| `disabled` | Whether the trigger is disabled (at maxView, or the calendar is disabled) | `boolean` |

</llm-only>
