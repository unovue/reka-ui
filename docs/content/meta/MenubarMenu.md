<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'value',
    'description': '<p>A unique value that associates the item with an active value when the navigation menu is controlled.</p>\n<p>This prop is managed automatically when uncontrolled.</p>\n',
    'type': 'string',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:openComplete',
    'description': '<p>Event handler called after the open or close animations of the content have finished.</p>\n',
    'type': '[value: boolean]'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `value` | A unique value that associates the item with an active value when the navigation menu is controlled. This prop is managed automatically when uncontrolled. | `string` | No | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `update:openComplete` | Event handler called after the open or close animations of the content have finished. | `[value: boolean]` |

</llm-only>
