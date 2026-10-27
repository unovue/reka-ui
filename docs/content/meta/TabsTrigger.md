<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>The element or component this component should render as. Can be overwritten by <code>asChild</code>.</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'button\''
  },
  {
    'name': 'asChild',
    'description': '<p>Change the default rendered element for the one passed as a child, merging their props and behavior.</p>\n<p>Read our <a href=\'https://www.reka-ui.com/docs/guides/composition\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with the tab.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'id',
    'description': '<p>Id of the element, which the content with the same <code>value</code> points its\n<code>aria-labelledby</code> at. Defaults to one derived from the Root\'s id and <code>value</code>.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'value',
    'description': '<p>A unique value that associates the trigger with a content.</p>\n',
    'type': 'string | number',
    'required': true
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by `asChild`. | `AsTag \| Component` | No | `"button"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `disabled` | When `true`, prevents the user from interacting with the tab. | `boolean` | No | `false` |
| `id` | Id of the element, which the content with the same `value` points its `aria-labelledby` at. Defaults to one derived from the Root's id and `value`. | `string` | No | - |
| `value` | A unique value that associates the trigger with a content. | `string \| number` | Yes | - |

</llm-only>
