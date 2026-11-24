<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>

<SlotsTable :data="[
  {
    'name': 'validity',
    'description': '<p>The field\'s validity. <code>valid</code> is <code>null</code> until the field has a validity to report.</p>\n',
    'type': 'FieldValidityState'
  },
  {
    'name': 'errors',
    'description': '<p>All current error messages.</p>\n',
    'type': 'string[]'
  },
  {
    'name': 'error',
    'description': '<p>The first error message, or an empty string.</p>\n',
    'type': 'string'
  },
  {
    'name': 'value',
    'description': '<p>The value validity was last computed for.</p>\n',
    'type': 'unknown'
  },
  {
    'name': 'initialValue',
    'description': '<p>The control\'s initial value.</p>\n',
    'type': 'unknown'
  }
]" />
</llm-exclude>

<llm-only>

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `validity` | The field's validity. valid is null until the field has a validity to report. | `FieldValidityState` |
| `errors` | All current error messages. | `string[]` |
| `error` | The first error message, or an empty string. | `string` |
| `value` | The value validity was last computed for. | `unknown` |
| `initialValue` | The control's initial value. | `unknown` |

</llm-only>
