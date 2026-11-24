<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'active',
    'description': '<p>When <code>true</code>, item will be initially focused.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'allowShiftKey',
    'description': '<p>When <code>true</code>, shift + arrow key will allow focusing on next/previous item.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'as',
    'description': '<p>The element or component this component should render as. Can be overwritten by <code>asChild</code>.</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'span\''
  },
  {
    'name': 'asChild',
    'description': '<p>Change the default rendered element for the one passed as a child, merging their props and behavior.</p>\n<p>Read our <a href=\'https://www.reka-ui.com/docs/guides/composition\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'focusable',
    'description': '<p>When <code>false</code>, item will not be focusable.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  },
  {
    'name': 'tabStopId',
    'description': '',
    'type': 'string',
    'required': false
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `active` | When true, item will be initially focused. | `boolean` | No | - |
| `allowShiftKey` | When true, shift + arrow key will allow focusing on next/previous item. | `boolean` | No | - |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"span"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `focusable` | When false, item will not be focusable. | `boolean` | No | `true` |
| `tabStopId` |  | `string` | No | - |

</llm-only>
