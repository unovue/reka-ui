<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'actions',
    'description': '<p>Controlled merge conflict actions, typically returned by Pierre after resolving a conflict.</p>\n',
    'type': '(MergeConflictDiffAction)[]',
    'required': false
  },
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
    'name': 'file',
    'description': '<p>File contents that still contain merge conflict markers.</p>\n',
    'type': 'FileContents',
    'required': false
  },
  {
    'name': 'fileDiff',
    'description': '<p>Precomputed Pierre metadata for an unresolved merge-conflict diff.</p>\n',
    'type': 'FileDiffMetadata',
    'required': false
  },
  {
    'name': 'lineAnnotations',
    'description': '<p>Annotations keyed by side and rendered line number.</p>\n',
    'type': 'DiffLineAnnotation&lt;LAnnotation&gt;[]',
    'required': false
  },
  {
    'name': 'markerRows',
    'description': '<p>Controlled merge conflict marker rows, typically returned by Pierre after resolving a conflict.</p>\n',
    'type': 'MergeConflictMarkerRow[]',
    'required': false
  },
  {
    'name': 'options',
    'description': '<p>Pierre unresolved-file options, including merge conflict action rendering and resolution callbacks.</p>\n',
    'type': 'UnresolvedFileOptions&lt;LAnnotation&gt;',
    'required': false
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

<EmitsTable :data="[
  {
    'name': 'mergeConflictAction',
    'description': '<p>Event handler called when a merge conflict action is requested.</p>\n',
    'type': '[payload: MergeConflictActionPayload]'
  },
  {
    'name': 'mergeConflictResolve',
    'description': '<p>Event handler called with the resolved file when a merge conflict action is applied.</p>\n',
    'type': '[file: FileContents, payload: MergeConflictActionPayload]'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `actions` | Controlled merge conflict actions, typically returned by Pierre after resolving a conflict. | `(MergeConflictDiffAction)[]` | No | - |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `DIFFS_TAG_NAME` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `file` | File contents that still contain merge conflict markers. | `FileContents` | No | - |
| `fileDiff` | Precomputed Pierre metadata for an unresolved merge-conflict diff. | `FileDiffMetadata` | No | - |
| `lineAnnotations` | Annotations keyed by side and rendered line number. | `DiffLineAnnotation<LAnnotation>[]` | No | - |
| `markerRows` | Controlled merge conflict marker rows, typically returned by Pierre after resolving a conflict. | `MergeConflictMarkerRow[]` | No | - |
| `options` | Pierre unresolved-file options, including merge conflict action rendering and resolution callbacks. | `UnresolvedFileOptions<LAnnotation>` | No | - |
| `prerenderedHTML` | Server-rendered Pierre markup to hydrate before client updates take over. | `string` | No | - |
| `selectedLines` | Line range to highlight as selected. | `SelectedLineRange \| null` | No | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `mergeConflictAction` | Event handler called when a merge conflict action is requested. | `[payload: MergeConflictActionPayload]` |
| `mergeConflictResolve` | Event handler called with the resolved file when a merge conflict action is applied. | `[file: FileContents, payload: MergeConflictActionPayload]` |

</llm-only>
