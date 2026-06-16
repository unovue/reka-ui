<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'defaultOpen',
    'description': '<p>The open state of the dialog when it is initially rendered. Use when you do not need to control its open state.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'modal',
    'description': '<p>The modality of the dialog When set to <code>true</code>, &lt;br&gt;\ninteraction with outside elements will be disabled and only dialog content will be visible to screen readers.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  },
  {
    'name': 'open',
    'description': '<p>The controlled open state of the dialog. Can be binded as <code>v-model:open</code>.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'unmountOnHide',
    'description': '<p>When set to <code>false</code>, the dialog content will not be unmounted when closed, but instead hidden with CSS. Useful for SEO or when you want to improve performance by not remounting the component on every open.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:open',
    'description': '<p>Event handler called when the open state of the dialog changes.</p>\n',
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
    'description': '<p>Close the dialog</p>\n',
    'type': '(): void'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `defaultOpen` | The open state of the dialog when it is initially rendered. Use when you do not need to control its open state. | `boolean` | No | `false` |
| `modal` | The modality of the dialog When set to true, <br> interaction with outside elements will be disabled and only dialog content will be visible to screen readers. | `boolean` | No | `true` |
| `open` | The controlled open state of the dialog. Can be binded as v-model:open. | `boolean` | No | - |
| `unmountOnHide` | When set to `false`, the dialog content will not be unmounted when closed, but instead hidden with CSS. Useful for SEO or when you want to improve performance by not remounting the component on every open. | `boolean` | No | `true` |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `update:open` | Event handler called when the open state of the dialog changes. | `[value: boolean]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `open` | Current open state | `boolean` |
| `close` | Close the dialog | `(): void` |

</llm-only>
