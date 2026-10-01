<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'altText',
    'description': '<p>A short description for an alternate way to carry out the action. For screen reader users\nwho will not be able to navigate to the button easily/quickly.</p>\n<p>A rendered action requires <code>altText</code>, unless the toast passed to <code>ToastRoot</code> has <code>actionProps.altText</code>.</p>\n',
    'type': 'string',
    'required': false
  },
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
    'name': 'closeOnClick',
    'description': '<p>Whether the action should close the toast when clicked.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `altText` | A short description for an alternate way to carry out the action. For screen reader users who will not be able to navigate to the button easily/quickly. A rendered action requires altText, unless the toast passed to ToastRoot has actionProps.altText. | `string` | No | - |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"button"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `closeOnClick` | Whether the action should close the toast when clicked. | `boolean` | No | `true` |

</llm-only>
