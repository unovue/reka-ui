<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>The element or component this component should render as. Can be overwritten by <code>asChild</code>.</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'div\''
  },
  {
    'name': 'asChild',
    'description': '<p>Change the default rendered element for the one passed as a child, merging their props and behavior.</p>\n<p>Read our <a href=\'https://www.reka-ui.com/docs/guides/composition\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'currentTabStopId',
    'description': '<p>The controlled value of the current stop item. Can be binded as <code>v-model</code>.</p>\n',
    'type': 'string | null',
    'required': false
  },
  {
    'name': 'defaultCurrentTabStopId',
    'description': '<p>The value of the current stop item.</p>\n<p>Use when you do not need to control the state of the stop item.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>The direction of navigation between items.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'loop',
    'description': '<p>Whether keyboard navigation should loop around</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'orientation',
    'description': '<p>The orientation of the group.\nMainly so arrow navigation is done accordingly (left &amp; right vs. up &amp; down)</p>\n',
    'type': '\'vertical\' | \'horizontal\'',
    'required': false
  },
  {
    'name': 'preventScrollOnEntryFocus',
    'description': '<p>When <code>true</code>, will prevent scrolling to the focus item when focused.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'entryFocus',
    'description': '<p>Event handler called when container is being focused. Can be prevented.</p>\n',
    'type': '[event: Event]'
  },
  {
    'name': 'update:currentTabStopId',
    'description': '',
    'type': '[value: string | null]'
  }
]" />

<MethodsTable :data="[
  {
    'name': 'getItems',
    'description': '',
    'type': '(includeDisabledItem?: boolean) =&gt; { ref: HTMLElement; value?: any; }[]'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `currentTabStopId` | The controlled value of the current stop item. Can be binded as v-model. | `string \| null` | No | - |
| `defaultCurrentTabStopId` | The value of the current stop item. Use when you do not need to control the state of the stop item. | `string` | No | - |
| `dir` | The direction of navigation between items. | `"ltr" \| "rtl"` | No | - |
| `loop` | Whether keyboard navigation should loop around | `boolean` | No | `false` |
| `orientation` | The orientation of the group. Mainly so arrow navigation is done accordingly (left & right vs. up & down) | `"vertical" \| "horizontal"` | No | - |
| `preventScrollOnEntryFocus` | When true, will prevent scrolling to the focus item when focused. | `boolean` | No | `false` |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `entryFocus` | Event handler called when container is being focused. Can be prevented. | `[event: Event]` |
| `update:currentTabStopId` |  | `[value: string \| null]` |

**Methods**

| Name | Description | Type |
| --- | --- | --- |
| `getItems` |  | `(includeDisabledItem?: boolean) => { ref: HTMLElement; value?: any; }[]` |

</llm-only>
