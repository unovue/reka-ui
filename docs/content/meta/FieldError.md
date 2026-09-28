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
    'name': 'forceMount',
    'description': '<p>Used to force mounting when more control is needed. Useful when controlling animation with Vue animation libraries.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'id',
    'description': '<p>Id of the element. Auto-generated when not provided.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'match',
    'description': '<p>Restricts when this error renders:</p>\n<ul>\n<li>a <code>ValidityState</code> key (e.g. <code>&quot;valueMissing&quot;</code>) — renders when that constraint fails.</li>\n<li><code>true</code> — always renders, letting an external library control visibility.</li>\n<li>omitted — renders whenever the field is invalid.</li>\n</ul>\n',
    'type': 'boolean | keyof ValidityState',
    'required': false
  }
]" />

<SlotsTable :data="[
  {
    'name': 'errors',
    'description': '<p>The error messages this part displays.</p>\n',
    'type': 'string[]'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `forceMount` | Used to force mounting when more control is needed. Useful when controlling animation with Vue animation libraries. | `boolean` | No | - |
| `id` | Id of the element. Auto-generated when not provided. | `string` | No | - |
| `match` | Restricts when this error renders:  a ValidityState key (e.g. "valueMissing") — renders when that constraint fails. true — always renders, letting an external library control visibility. omitted — renders whenever the field is invalid. | `boolean \| keyof ValidityState` | No | - |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `errors` | The error messages this part displays. | `string[]` |

</llm-only>
