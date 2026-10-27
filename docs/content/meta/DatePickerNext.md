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
    'name': 'nextPage',
    'description': '<p>A function that returns the next page of the calendar, used instead of the default step. It receives the current placeholder and the active view, and applies in every view; render the button inside a <code>DatePickerView</code> to scope it to one view.</p>\n',
    'type': 'CalendarPageFunction',
    'required': false
  }
]" />

<SlotsTable :data="[
  {
    'name': 'disabled',
    'description': '<p>Current disable state</p>\n',
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
| `nextPage` | A function that returns the next page of the calendar, used instead of the default step. It receives the current placeholder and the active view, and applies in every view; render the button inside a `DatePickerView` to scope it to one view. | `CalendarPageFunction` | No | - |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `disabled` | Current disable state | `boolean` |

</llm-only>
