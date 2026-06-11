<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>The element or component this component should render as. Can be overwritten by <code>asChild</code>.</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': 'DIFFS_TAG_NAME'
  },
  {
    'name': 'asChild',
    'description': '<p>Change the default rendered element for the one passed as a child, merging their props and behavior.</p>\n<p>Read our <a href=\'https://www.reka-ui.com/docs/guides/composition\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'lineAnnotations',
    'description': '<p>Annotations keyed by side and rendered line number.</p>\n',
    'type': 'DiffLineAnnotation&lt;LAnnotation&gt;[]',
    'required': false
  },
  {
    'name': 'options',
    'description': '<p>Pierre diff-rendering options for layout, theming, line diffs, headers, and interaction hooks.</p>\n',
    'type': 'FileDiffOptions&lt;LAnnotation&gt;',
    'required': false
  },
  {
    'name': 'patch',
    'description': '<p>A raw unified or Git patch string containing a single file diff.</p>\n',
    'type': 'string',
    'required': true
  },
  {
    'name': 'prerenderedHTML',
    'description': '<p>Server-rendered Pierre markup to hydrate before client updates take over.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'selectedLines',
    'description': '<p>Line range to highlight as selected.</p>\n',
    'type': 'SelectedLineRange | null',
    'required': false
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `DIFFS_TAG_NAME` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `lineAnnotations` | Annotations keyed by side and rendered line number. | `DiffLineAnnotation<LAnnotation>[]` | No | - |
| `options` | Pierre diff-rendering options for layout, theming, line diffs, headers, and interaction hooks. | `FileDiffOptions<LAnnotation>` | No | - |
| `patch` | A raw unified or Git patch string containing a single file diff. | `string` | Yes | - |
| `prerenderedHTML` | Server-rendered Pierre markup to hydrate before client updates take over. | `string` | No | - |
| `selectedLines` | Line range to highlight as selected. | `SelectedLineRange \| null` | No | - |

</llm-only>
