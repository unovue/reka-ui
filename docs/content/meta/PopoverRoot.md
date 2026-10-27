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
    'name': 'defaultTriggerId',
    'description': '<p>The id of the trigger that owns a popover that starts open (with <code>defaultOpen</code> and a <code>handle</code>).</p>\n',
    'type': 'string | null',
    'required': false
  },
  {
    'name': 'handle',
    'description': '<p>A handle from <code>createPopoverHandle()</code> that connects detached\n<code>PopoverTrigger</code>s rendered anywhere in the app. The popover anchors to,\nreturns focus to and exposes the <code>payload</code> of the trigger that opened it.</p>\n',
    'type': 'PopoverHandle&lt;Payload&gt;',
    'required': false
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
  },
  {
    'name': 'triggerId',
    'description': '<p>The id of the trigger that owns the popover, for a controlled popover with\ndetached triggers. Use with <code>open</code>.</p>\n',
    'type': 'string | null',
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
  },
  {
    'name': 'payload',
    'description': '<p>The <code>payload</code> of the detached trigger that opened the popover</p>\n',
    'type': 'Payload'
  },
  {
    'name': 'activeTriggerId',
    'description': '<p>The id of the detached trigger that opened the popover</p>\n',
    'type': 'string | null'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `defaultOpen` | The open state of the popover when it is initially rendered. Use when you do not need to control its open state. | `boolean` | No | `false` |
| `defaultTriggerId` | The id of the trigger that owns a popover that starts open (with defaultOpen and a handle). | `string \| null` | No | - |
| `handle` | A handle from createPopoverHandle() that connects detached PopoverTriggers rendered anywhere in the app. The popover anchors to, returns focus to and exposes the payload of the trigger that opened it. | `PopoverHandle<Payload>` | No | - |
| `modal` | The modality of the popover. When true, page scroll is locked, the rest of the page (except the trigger) is covered by an internal backdrop that closes the popover on press, and only the popover content is visible to screen readers. | `boolean` | No | `false` |
| `open` | The controlled open state of the popover. | `boolean` | No | - |
| `triggerId` | The id of the trigger that owns the popover, for a controlled popover with detached triggers. Use with open. | `string \| null` | No | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `beforeUpdate:open` | Event handler called before the open state of the popover changes; details.cancel() keeps the current state. | `[value: boolean, details: ChangeEventDetails<PopoverOpenChangeReason, Event>]` |
| `update:open` | Event handler called when the open state of the popover changes. | `[value: boolean, details: ChangeEventDetails<PopoverOpenChangeReason, Event>]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `open` | Current open state | `boolean` |
| `close` | Close the popover | `(): void` |
| `payload` | The payload of the detached trigger that opened the popover | `Payload` |
| `activeTriggerId` | The id of the detached trigger that opened the popover | `string \| null` |

</llm-only>
