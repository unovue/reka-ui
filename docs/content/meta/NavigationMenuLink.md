<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'active',
    'description': '<p>Used to identify the link as the currently active page.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'as',
    'description': '<p>The element or component this component should render as. Can be overwritten by <code>asChild</code>.</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'a\''
  },
  {
    'name': 'asChild',
    'description': '<p>Change the default rendered element for the one passed as a child, merging their props and behavior.</p>\n<p>Read our <a href=\'https://www.reka-ui.com/docs/guides/composition\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'select',
    'description': '<p>Event handler called when the user selects a link (via mouse or keyboard).</p>\n<p>Calling <code>event.preventDefault</code> in this handler will prevent the navigation menu from closing when selecting that link.</p>\n',
    'type': '[payload: CustomEvent&lt;{ originalEvent: Event; }&gt;]'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `active` | Used to identify the link as the currently active page. | `boolean` | No | - |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"a"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `select` | Event handler called when the user selects a link (via mouse or keyboard). Calling event.preventDefault in this handler will prevent the navigation menu from closing when selecting that link. | `[payload: CustomEvent<{ originalEvent: Event; }>]` |

</llm-only>
