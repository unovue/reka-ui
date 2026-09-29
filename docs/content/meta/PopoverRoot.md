<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'defaultOpen',
    'description': '<p>The open state of the popover when it is initially rendered. Use when you do not need to control its open state.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'modal',
    'description': '<p>The modality of the popover. When set to true, interaction with outside elements will be disabled and only popover content will be visible to screen readers.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'open',
    'description': '<p>The controlled open state of the popover.</p>\n',
    'type': 'boolean',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:open',
    'description': '<p>Event handler called when the open state of the popover changes.</p>\n',
    'type': '[value: boolean]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'open',
    'description': '<p>Current open state</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'close',
    'description': '<p>Close the popover</p>\n',
    'type': '(): void'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `defaultOpen` | The open state of the popover when it is initially rendered. Use when you do not need to control its open state. | `boolean` | No | `false` |
| `modal` | The modality of the popover. When set to true, interaction with outside elements will be disabled and only popover content will be visible to screen readers. | `boolean` | No | `false` |
| `open` | The controlled open state of the popover. | `boolean` | No | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `update:open` | Event handler called when the open state of the popover changes. | `[value: boolean]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `open` | Current open state | `boolean` |
| `close` | Close the popover | `(): void` |

</llm-only>
