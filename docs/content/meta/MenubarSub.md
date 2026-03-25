<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'defaultOpen',
    'description': '<p>The open state of the submenu when it is initially rendered. Use when you do not need to control its open state.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'open',
    'description': '<p>The controlled open state of the menu. Can be used as <code>v-model:open</code>.</p>\n',
    'type': 'boolean',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:open',
    'description': '<p>Event handler called when the open state of the submenu changes.</p>\n',
    'type': '[payload: boolean]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'open',
    'description': '<p>Current open state</p>\n',
    'type': 'boolean'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `defaultOpen` | The open state of the submenu when it is initially rendered. Use when you do not need to control its open state. | `boolean` | No | - |
| `open` | The controlled open state of the menu. Can be used as v-model:open. | `boolean` | No | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `update:open` | Event handler called when the open state of the submenu changes. | `[payload: boolean]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `open` | Current open state | `boolean` |

</llm-only>
