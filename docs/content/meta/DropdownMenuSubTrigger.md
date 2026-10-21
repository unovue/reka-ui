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
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with the item.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'graceDuration',
    'description': '<p>How long (in milliseconds) the pointer is given to reach the submenu after leaving the trigger.\nWhile it moves towards the submenu within this time, hovering other items won\'t close the submenu.\nIncrease it for users who move the pointer slowly or on devices under heavy load.</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'textValue',
    'description': '<p>Optional text used for typeahead purposes. By default the typeahead behavior will use the <code>.textContent</code> of the item. &lt;br&gt;\nUse this when the content is complex, or you have non-textual content inside.</p>\n',
    'type': 'string',
    'required': false
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `disabled` | When true, prevents the user from interacting with the item. | `boolean` | No | - |
| `graceDuration` | How long (in milliseconds) the pointer is given to reach the submenu after leaving the trigger. While it moves towards the submenu within this time, hovering other items won't close the submenu. Increase it for users who move the pointer slowly or on devices under heavy load. | `number` | No | - |
| `textValue` | Optional text used for typeahead purposes. By default the typeahead behavior will use the .textContent of the item. <br> Use this when the content is complex, or you have non-textual content inside. | `string` | No | - |

</llm-only>
