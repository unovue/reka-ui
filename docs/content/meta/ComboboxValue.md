<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'placeholder',
    'description': '<p>The text shown while nothing is selected.</p>\n',
    'type': 'string',
    'required': false
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>The selected value: an array when the combobox is <code>multiple</code>.</p>\n',
    'type': 'AcceptableValue | AcceptableValue[] | undefined'
  },
  {
    'name': 'selectedLabels',
    'description': '<p>The text of each selected value, in order: the root\'s <code>displayValue</code>, then its label in the root\'s <code>items</code>, then\nthe <code>label</code> key of an object value, then the string form of a primitive value. Empty while nothing is selected.</p>\n',
    'type': 'string[]'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `placeholder` | The text shown while nothing is selected. | `string` | No | - |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `modelValue` | The selected value: an array when the combobox is `multiple`. | `AcceptableValue \| AcceptableValue[] \| undefined` |
| `selectedLabels` | The text of each selected value, in order: the root's `displayValue`, then its label in the root's `items`, then the `label` key of an object value, then the string form of a primitive value. Empty while nothing is selected. | `string[]` |

</llm-only>
