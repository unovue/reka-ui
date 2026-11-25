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
    'description': '<p>Whether the item is currently expanded</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'isSelected',
    'description': '<p>Whether the item is currently selected</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'isIndeterminate',
    'description': '<p>Whether some, but not all, of the item\'s descendants are selected. Only computed for items with children when <code>bubbleSelect</code> or <code>propagateSelect</code> is enabled on the root, <code>undefined</code> otherwise.</p>\n',
    'type': 'boolean | undefined'
  },
  {
    'name': 'isDisabled',
    'description': '<p>Whether the item is disabled, either by its own <code>disabled</code> prop or by the root</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'handleToggle',
    'description': '<p>Toggle the expanded state of the item</p>\n',
    'type': '(): void'
  },
  {
    'name': 'handleSelect',
    'description': '<p>Toggle the selected state of the item</p>\n',
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
| `isExpanded` | Whether the item is currently expanded | `boolean` |
| `isSelected` | Whether the item is currently selected | `boolean` |
| `isIndeterminate` | Whether some, but not all, of the item's descendants are selected. Only computed for items with children when bubbleSelect or propagateSelect is enabled on the root, undefined otherwise. | `boolean \| undefined` |
| `isDisabled` | Whether the item is disabled, either by its own disabled prop or by the root | `boolean` |
| `handleToggle` | Toggle the expanded state of the item | `(): void` |
| `handleSelect` | Toggle the selected state of the item | `(): void` |

</llm-only>
