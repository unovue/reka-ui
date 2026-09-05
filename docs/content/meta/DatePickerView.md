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
    'name': 'view',
    'description': '<p>The view this part renders. Its content is shown only while the root\'s <code>view</code> matches.</p>\n',
    'type': '\'day\' | \'month\' | \'year\'',
    'required': true
  }
]" />

<SlotsTable :data="[
  {
    'name': 'grid',
    'description': '<p>The rendered page(s) of this view</p>\n',
    'type': 'CalendarGridData[]'
  },
  {
    'name': 'weekDays',
    'description': '<p>The days of the week (day view only)</p>\n',
    'type': 'string[]'
  },
  {
    'name': 'view',
    'description': '<p>This view\'s unit</p>\n',
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
| `view` | The view this part renders. Its content is shown only while the root's view matches. | `"day" \| "month" \| "year"` | Yes | - |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `grid` | The rendered page(s) of this view | `CalendarGridData[]` |
| `weekDays` | The days of the week (day view only) | `string[]` |
| `view` | This view's unit | `"day" \| "month" \| "year"` |

</llm-only>
