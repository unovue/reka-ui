<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>The element or component this component should render as. Can be overwritten by <code>asChild</code>.</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'li\''
  },
  {
    'name': 'asChild',
    'description': '<p>Change the default rendered element for the one passed as a child, merging their props and behavior.</p>\n<p>Read our <a href=\'https://www.reka-ui.com/docs/guides/composition\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with the item.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'level',
    'description': '<p>Level of depth</p>\n',
    'type': 'number',
    'required': true
  },
  {
    'name': 'value',
    'description': '<p>Value given to this item</p>\n',
    'type': 'T',
    'required': true
  }
]" />

<EmitsTable :data="[
  {
    'name': 'select',
    'description': '<p>Event handler called when the selecting item. &lt;br&gt; It can be prevented by calling <code>event.preventDefault</code>.</p>\n',
    'type': '[event: SelectEvent&lt;T&gt;]'
  },
  {
    'name': 'toggle',
    'description': '<p>Event handler called when the selecting item. &lt;br&gt; It can be prevented by calling <code>event.preventDefault</code>.</p>\n',
    'type': '[event: ToggleEvent&lt;T&gt;]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'isExpanded',
    'description': '',
    'type': 'boolean'
  },
  {
    'name': 'isSelected',
    'description': '',
    'type': 'boolean'
  },
  {
    'name': 'isIndeterminate',
    'description': '',
    'type': 'boolean | undefined'
  },
  {
    'name': 'isDisabled',
    'description': '',
    'type': 'boolean'
  },
  {
    'name': 'handleToggle',
    'description': '',
    'type': '(): void'
  },
  {
    'name': 'handleSelect',
    'description': '',
    'type': '(): void'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"li"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `disabled` | When true, prevents the user from interacting with the item. | `boolean` | No | - |
| `level` | Level of depth | `number` | Yes | - |
| `value` | Value given to this item | `T` | Yes | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `select` | Event handler called when the selecting item. <br> It can be prevented by calling event.preventDefault. | `[event: SelectEvent<T>]` |
| `toggle` | Event handler called when the selecting item. <br> It can be prevented by calling event.preventDefault. | `[event: ToggleEvent<T>]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `isExpanded` |  | `boolean` |
| `isSelected` |  | `boolean` |
| `isIndeterminate` |  | `boolean \| undefined` |
| `isDisabled` |  | `boolean` |
| `handleToggle` |  | `(): void` |
| `handleSelect` |  | `(): void` |

</llm-only>
