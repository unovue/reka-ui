<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>The element or component this component should render as. Can be overwritten by <code>asChild</code>.</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'ul\''
  },
  {
    'name': 'asChild',
    'description': '<p>Change the default rendered element for the one passed as a child, merging their props and behavior.</p>\n<p>Read our <a href=\'https://www.reka-ui.com/docs/guides/composition\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'bubbleSelect',
    'description': '<p>When <code>true</code>, selecting children will update the parent state. Requires <code>multiple</code> to be <code>true</code>.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'defaultExpanded',
    'description': '<p>The value of the expanded tree when initially rendered. Use when you do not need to control the state of the expanded tree</p>\n',
    'type': 'string[]',
    'required': false
  },
  {
    'name': 'defaultValue',
    'description': '<p>The value of the tree when initially rendered. Use when you do not need to control the state of the tree</p>\n',
    'type': '(M extends true ? U[] : U)',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>The reading direction of the listbox when applicable. &lt;br&gt; If omitted, inherits globally from <code>ConfigProvider</code> or assumes LTR (left-to-right) reading mode.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with tree</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'expanded',
    'description': '<p>The controlled value of the expanded item. Can be binded with <code>v-model</code>.</p>\n',
    'type': 'string[]',
    'required': false
  },
  {
    'name': 'getChildren',
    'description': '<p>This function is passed the index of each item and should return a list of children for that item</p>\n',
    'type': '((val: T) =&gt; T[])',
    'required': false,
    'default': 'val.children'
  },
  {
    'name': 'getKey',
    'description': '<p>This function is passed the index of each item and should return a unique key for that item</p>\n',
    'type': '(val: T): string',
    'required': true
  },
  {
    'name': 'items',
    'description': '<p>List of items</p>\n',
    'type': 'T[]',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled value of the tree. Can be binded with <code>v-model</code>.</p>\n',
    'type': '(M extends true ? U[] : U)',
    'required': false
  },
  {
    'name': 'multiple',
    'description': '<p>Whether multiple options can be selected or not.</p>\n',
    'type': 'boolean | M',
    'required': false
  },
  {
    'name': 'propagateSelect',
    'description': '<p>When <code>true</code>, selecting parent will select the descendants. Requires <code>multiple</code> to be <code>true</code>.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'selectionBehavior',
    'description': '<p>How multiple selection should behave in the collection.</p>\n',
    'type': '\'replace\' | \'toggle\'',
    'required': false,
    'default': '\'toggle\''
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:expanded',
    'description': '',
    'type': '[val: string[]]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the value of the toggle changes.</p>\n',
    'type': '[val: M extends true ? U[] : U]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'flattenItems',
    'description': '',
    'type': 'FlattenedItem&lt;T&gt;[]'
  },
  {
    'name': 'modelValue',
    'description': '',
    'type': 'M extends true ? U[] : U'
  },
  {
    'name': 'expanded',
    'description': '',
    'type': 'string[]'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"ul"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `bubbleSelect` | When true, selecting children will update the parent state. Requires multiple to be true. | `boolean` | No | - |
| `defaultExpanded` | The value of the expanded tree when initially rendered. Use when you do not need to control the state of the expanded tree | `string[]` | No | - |
| `defaultValue` | The value of the tree when initially rendered. Use when you do not need to control the state of the tree | `(M extends true ? U[] : U)` | No | - |
| `dir` | The reading direction of the listbox when applicable. <br> If omitted, inherits globally from ConfigProvider or assumes LTR (left-to-right) reading mode. | `"ltr" \| "rtl"` | No | - |
| `disabled` | When true, prevents the user from interacting with tree | `boolean` | No | - |
| `expanded` | The controlled value of the expanded item. Can be binded with v-model. | `string[]` | No | - |
| `getChildren` | This function is passed the index of each item and should return a list of children for that item | `((val: T) => T[])` | No | `val.children` |
| `getKey` | This function is passed the index of each item and should return a unique key for that item | `(val: T): string` | Yes | - |
| `items` | List of items | `T[]` | No | - |
| `modelValue` | The controlled value of the tree. Can be binded with v-model. | `(M extends true ? U[] : U)` | No | - |
| `multiple` | Whether multiple options can be selected or not. | `boolean \| M` | No | - |
| `propagateSelect` | When true, selecting parent will select the descendants. Requires multiple to be true. | `boolean` | No | - |
| `selectionBehavior` | How multiple selection should behave in the collection. | `"replace" \| "toggle"` | No | `"toggle"` |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `update:expanded` |  | `[val: string[]]` |
| `update:modelValue` | Event handler called when the value of the toggle changes. | `[val: M extends true ? U[] : U]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `flattenItems` |  | `FlattenedItem<T>[]` |
| `modelValue` |  | `M extends true ? U[] : U` |
| `expanded` |  | `string[]` |

</llm-only>
