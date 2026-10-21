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
    'name': 'for',
    'description': '<p>The id of the element the label is associated with.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'nativeLabel',
    'description': '<p>Whether the label renders a native <code>label</code> element. Set to <code>false</code> when\nrendering another element (e.g. <code>as=&quot;div&quot;</code>): it then drops <code>for</code>, focuses\nthe control on click, and relies on the control\'s <code>aria-labelledby</code>.</p>\n<p>Useful for button controls like <code>SelectTrigger</code>, where a native label\nwould forward clicks and <code>:hover</code> to the button.</p>\n',
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
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `for` | The id of the element the label is associated with. | `string` | No | - |
| `nativeLabel` | Whether the label renders a native label element. Set to false when rendering another element (e.g. as="div"): it then drops for, focuses the control on click, and relies on the control's aria-labelledby. Useful for button controls like SelectTrigger, where a native label would forward clicks and :hover to the button. | `boolean` | No | `true` |

</llm-only>
