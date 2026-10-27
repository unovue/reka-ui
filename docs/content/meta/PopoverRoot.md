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
    'description': '<p>The modality of the popover. When <code>true</code>, page scroll is locked, the rest of\nthe page (except the trigger) is covered by an internal backdrop that\ncloses the popover on press, and only the popover content is visible to\nscreen readers.</p>\n',
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
    'name': 'beforeUpdate:open',
    'description': '<p>Event handler called before the open state of the popover changes; <code>details.cancel()</code> keeps the current state.</p>\n',
    'type': '[value: boolean, details: ChangeEventDetails&lt;PopoverOpenChangeReason, Event&gt;]'
  },
  {
    'name': 'update:open',
    'description': '<p>Event handler called when the open state of the popover changes.</p>\n',
    'type': '[value: boolean, details: ChangeEventDetails&lt;PopoverOpenChangeReason, Event&gt;]'
  },
  {
    'name': 'update:openComplete',
    'description': '<p>Event handler called after the open or close animations of the content have finished.</p>\n',
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
| `modal` | The modality of the popover. When true, page scroll is locked, the rest of the page (except the trigger) is covered by an internal backdrop that closes the popover on press, and only the popover content is visible to screen readers. | `boolean` | No | `false` |
| `open` | The controlled open state of the popover. | `boolean` | No | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `beforeUpdate:open` | Event handler called before the open state of the popover changes; details.cancel() keeps the current state. | `[value: boolean, details: ChangeEventDetails<PopoverOpenChangeReason, Event>]` |
| `update:open` | Event handler called when the open state of the popover changes. | `[value: boolean, details: ChangeEventDetails<PopoverOpenChangeReason, Event>]` |
| `update:openComplete` | Event handler called after the open or close animations of the content have finished. | `[value: boolean]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `open` | Current open state | `boolean` |
| `close` | Close the popover | `(): void` |

</llm-only>
