<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'defaultOpen',
    'description': '<p>The open state of the dropdown menu when it is initially rendered. Use when you do not need to control its open state.</p>\n',
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
    'name': 'beforeUpdate:open',
    'description': '<p>Called before the open state of the submenu changes; <code>details.cancel()</code> vetoes the change.</p>\n',
    'type': '[payload: boolean, details: ChangeEventDetails&lt;MenuOpenChangeReason, Event&gt;]'
  },
  {
    'name': 'update:open',
    'description': '<p>Event handler called when the open state of the submenu changes.</p>\n',
    'type': '[payload: boolean, details: ChangeEventDetails&lt;MenuOpenChangeReason, Event&gt;]'
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
| `defaultOpen` | The open state of the dropdown menu when it is initially rendered. Use when you do not need to control its open state. | `boolean` | No | - |
| `open` | The controlled open state of the menu. Can be used as v-model:open. | `boolean` | No | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `beforeUpdate:open` | Called before the open state of the submenu changes; details.cancel() vetoes the change. | `[payload: boolean, details: ChangeEventDetails<MenuOpenChangeReason, Event>]` |
| `update:open` | Event handler called when the open state of the submenu changes. | `[payload: boolean, details: ChangeEventDetails<MenuOpenChangeReason, Event>]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `open` | Current open state | `boolean` |

</llm-only>
