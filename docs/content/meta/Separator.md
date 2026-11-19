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
    'name': 'decorative',
    'description': '<p>Whether or not the component is purely decorative. &lt;br&gt;When <code>true</code>, accessibility-related attributes\nare updated so that that the rendered element is removed from the accessibility tree.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'orientation',
    'description': '<p>Orientation of the component.</p>\n<p>Either <code>vertical</code> or <code>horizontal</code>. Defaults to <code>horizontal</code>.</p>\n',
    'type': '\'vertical\' | \'horizontal\'',
    'required': false,
    'default': '\'horizontal\''
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `decorative` | Whether or not the component is purely decorative. <br>When true, accessibility-related attributes are updated so that that the rendered element is removed from the accessibility tree. | `boolean` | No | - |
| `orientation` | Orientation of the component. Either vertical or horizontal. Defaults to horizontal. | `"vertical" \| "horizontal"` | No | `"horizontal"` |

</llm-only>
