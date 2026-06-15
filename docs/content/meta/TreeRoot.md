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
    'name': 'composition',
    'description': '<p>Pierre composition hooks for header and context menu rendering.</p>\n',
    'type': 'FileTreeCompositionOptions',
    'required': false
  },
  {
    'name': 'defaultExpanded',
    'description': '<p>Expanded paths used when the Pierre tree is initially created.</p>\n',
    'type': 'string[]',
    'required': false
  },
  {
    'name': 'defaultValue',
    'description': '<p>The selected paths when initially rendered. Use when you do not need to control the selection state.</p>\n',
    'type': 'string[]',
    'required': false
  },
  {
    'name': 'density',
    'description': '<p>Built-in density preset or density factor.</p>\n',
    'type': 'FileTreeDensity',
    'required': false
  },
  {
    'name': 'expanded',
    'description': '<p>Expanded paths used when the Pierre tree is initially created.</p>\n',
    'type': 'string[]',
    'required': false
  },
  {
    'name': 'flattenEmptyDirectories',
    'description': '<p>Whether empty directories should be collapsed into their visible descendants.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'getChildren',
    'description': '<p>This function receives each object item and should return its children.</p>\n',
    'type': '((val: Record&lt;string, any&gt;) =&gt; Record&lt;string, any&gt;[])',
    'required': false,
    'default': 'val.children'
  },
  {
    'name': 'getKey',
    'description': '<p>This function receives each object item and should return a stable path segment for that item.</p>\n',
    'type': '(val: Record&lt;string, any&gt;): string',
    'required': false
  },
  {
    'name': 'gitStatus',
    'description': '<p>Git status entries shown alongside file paths.</p>\n',
    'type': 'readonly GitStatusEntry[]',
    'required': false
  },
  {
    'name': 'initialExpansion',
    'description': '<p>Controls the initial expansion behavior.</p>\n',
    'type': 'FileTreeInitialExpansion',
    'required': false
  },
  {
    'name': 'itemHeight',
    'description': '<p>Estimated item height in pixels.</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'items',
    'description': '<p>Object tree input converted to canonical paths before it is passed to Pierre. Prefer <code>paths</code> for new code.</p>\n',
    'type': 'Record&lt;string, any&gt;[]',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled selected paths of the tree. Can be bound with <code>v-model</code>.</p>\n',
    'type': 'string[]',
    'required': false
  },
  {
    'name': 'overscan',
    'description': '<p>Number of rows rendered outside the visible area.</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'paths',
    'description': '<p>List of canonical paths rendered by the tree.</p>\n',
    'type': 'readonly string[]',
    'required': false
  },
  {
    'name': 'preparedInput',
    'description': '<p>Prepared path input from <code>prepareFileTreeInput</code> or <code>preparePresortedFileTreeInput</code>.</p>\n',
    'type': 'FileTreePreparedInput',
    'required': false
  },
  {
    'name': 'presorted',
    'description': '<p>Whether the provided paths are already sorted.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'renderRowDecoration',
    'description': '<p>Custom row decoration renderer.</p>\n',
    'type': 'FileTreeRowDecorationRenderer',
    'required': false
  },
  {
    'name': 'search',
    'description': '<p>Enables built-in search UI.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'sort',
    'description': '<p>Custom path sorting strategy.</p>\n',
    'type': '\'default\' | FileTreeSortComparator',
    'required': false
  },
  {
    'name': 'stickyFolders',
    'description': '<p>Whether parent folders remain visible while scrolling descendants.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'unsafeCSS',
    'description': '<p>Raw CSS injected into the Pierre tree shadow root.</p>\n',
    'type': 'string',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when selected paths change.</p>\n',
    'type': '[value: string[]]'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `composition` | Pierre composition hooks for header and context menu rendering. | `FileTreeCompositionOptions` | No | - |
| `defaultExpanded` | Expanded paths used when the Pierre tree is initially created. | `string[]` | No | - |
| `defaultValue` | The selected paths when initially rendered. Use when you do not need to control the selection state. | `string[]` | No | - |
| `density` | Built-in density preset or density factor. | `FileTreeDensity` | No | - |
| `expanded` | Expanded paths used when the Pierre tree is initially created. | `string[]` | No | - |
| `flattenEmptyDirectories` | Whether empty directories should be collapsed into their visible descendants. | `boolean` | No | - |
| `getChildren` | This function receives each object item and should return its children. | `((val: Record<string, any>) => Record<string, any>[])` | No | `val.children` |
| `getKey` | This function receives each object item and should return a stable path segment for that item. | `(val: Record<string, any>): string` | No | - |
| `gitStatus` | Git status entries shown alongside file paths. | `readonly GitStatusEntry[]` | No | - |
| `initialExpansion` | Controls the initial expansion behavior. | `FileTreeInitialExpansion` | No | - |
| `itemHeight` | Estimated item height in pixels. | `number` | No | - |
| `items` | Object tree input converted to canonical paths before it is passed to Pierre. Prefer paths for new code. | `Record<string, any>[]` | No | - |
| `modelValue` | The controlled selected paths of the tree. Can be bound with v-model. | `string[]` | No | - |
| `overscan` | Number of rows rendered outside the visible area. | `number` | No | - |
| `paths` | List of canonical paths rendered by the tree. | `readonly string[]` | No | - |
| `preparedInput` | Prepared path input from prepareFileTreeInput or preparePresortedFileTreeInput. | `FileTreePreparedInput` | No | - |
| `presorted` | Whether the provided paths are already sorted. | `boolean` | No | - |
| `renderRowDecoration` | Custom row decoration renderer. | `FileTreeRowDecorationRenderer` | No | - |
| `search` | Enables built-in search UI. | `boolean` | No | - |
| `sort` | Custom path sorting strategy. | `"default" \| FileTreeSortComparator` | No | - |
| `stickyFolders` | Whether parent folders remain visible while scrolling descendants. | `boolean` | No | - |
| `unsafeCSS` | Raw CSS injected into the Pierre tree shadow root. | `string` | No | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `update:modelValue` | Event handler called when selected paths change. | `[value: string[]]` |

</llm-only>
