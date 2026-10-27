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
    'name': 'defaultTriggerId',
    'description': '<p>The id of the trigger that owns a menu that starts open (with <code>defaultOpen</code> and a <code>handle</code>).</p>\n',
    'type': 'string | null',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>The reading direction of the combobox when applicable.</p>\n<p>If omitted, inherits globally from <code>ConfigProvider</code> or assumes LTR (left-to-right) reading mode.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'handle',
    'description': '<p>A handle from <code>createDropdownMenuHandle()</code> that connects detached\n<code>DropdownMenuTrigger</code>s rendered anywhere in the app. The menu anchors to,\nreturns focus to and exposes the <code>payload</code> of the trigger that opened it.</p>\n',
    'type': 'DropdownMenuHandle&lt;Payload&gt;',
    'required': false
  },
  {
    'name': 'modal',
    'description': '<p>The modality of the dropdown menu.</p>\n<p>When <code>true</code>, page scroll is locked, the rest of the page (except the\ntrigger) is covered by an internal backdrop that closes the menu on press,\nand only the menu content is visible to screen readers.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  },
  {
    'name': 'open',
    'description': '<p>The controlled open state of the menu. Can be used as <code>v-model:open</code>.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'triggerId',
    'description': '<p>The id of the trigger that owns the menu, for a controlled menu with\ndetached triggers. Use with <code>open</code>.</p>\n',
    'type': 'string | null',
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
  },
  {
    'name': 'payload',
    'description': '<p>The <code>payload</code> of the detached trigger that opened the menu</p>\n',
    'type': 'Payload'
  },
  {
    'name': 'activeTriggerId',
    'description': '<p>The id of the detached trigger that opened the menu</p>\n',
    'type': 'string | null'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `defaultOpen` | The open state of the dropdown menu when it is initially rendered. Use when you do not need to control its open state. | `boolean` | No | - |
| `defaultTriggerId` | The id of the trigger that owns a menu that starts open (with defaultOpen and a handle). | `string \| null` | No | - |
| `dir` | The reading direction of the combobox when applicable. If omitted, inherits globally from ConfigProvider or assumes LTR (left-to-right) reading mode. | `"ltr" \| "rtl"` | No | - |
| `handle` | A handle from createDropdownMenuHandle() that connects detached DropdownMenuTriggers rendered anywhere in the app. The menu anchors to, returns focus to and exposes the payload of the trigger that opened it. | `DropdownMenuHandle<Payload>` | No | - |
| `modal` | The modality of the dropdown menu. When true, page scroll is locked, the rest of the page (except the trigger) is covered by an internal backdrop that closes the menu on press, and only the menu content is visible to screen readers. | `boolean` | No | `true` |
| `open` | The controlled open state of the menu. Can be used as v-model:open. | `boolean` | No | - |
| `triggerId` | The id of the trigger that owns the menu, for a controlled menu with detached triggers. Use with open. | `string \| null` | No | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `beforeUpdate:open` | Called before the open state of the submenu changes; details.cancel() vetoes the change. | `[payload: boolean, details: ChangeEventDetails<MenuOpenChangeReason, Event>]` |
| `update:open` | Event handler called when the open state of the submenu changes. | `[payload: boolean, details: ChangeEventDetails<MenuOpenChangeReason, Event>]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `open` | Current open state | `boolean` |
| `payload` | The payload of the detached trigger that opened the menu | `Payload` |
| `activeTriggerId` | The id of the detached trigger that opened the menu | `string \| null` |

</llm-only>
