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
    'name': 'autoSaveId',
    'description': '<p>Unique id used to auto-save group arrangement via <code>localStorage</code>. Ignored while <code>layout</code> is controlled.</p>\n',
    'type': 'string | null',
    'required': false,
    'default': 'null'
  },
  {
    'name': 'direction',
    'description': '<p>The group orientation of splitter.</p>\n',
    'type': '\'vertical\' | \'horizontal\'',
    'required': true
  },
  {
    'name': 'id',
    'description': '<p>Group id; falls back to <code>useId</code> when not provided.</p>\n',
    'type': 'string | null',
    'required': false
  },
  {
    'name': 'keyboardResizeBy',
    'description': '<p>Step size when arrow key was pressed.</p>\n',
    'type': 'number | null',
    'required': false,
    'default': '10'
  },
  {
    'name': 'layout',
    'description': '<p>The controlled layout: one size per panel, in each panel\'s <code>sizeUnit</code> (the\nvalues <code>@layout</code> reports). Can be bound as <code>v-model:layout</code>. A layout the\nconstraints reject is applied as corrected and the correction emitted; an\narray whose length differs from the panel count is ignored.</p>\n',
    'type': 'number[]',
    'required': false
  },
  {
    'name': 'storage',
    'description': '<p>Custom storage API; defaults to localStorage</p>\n',
    'type': 'PanelGroupStorage',
    'required': false,
    'default': 'defaultStorage'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'beforeUpdate:layout',
    'description': '<p>Event handler called before a <code>drag</code>, <code>keyboard</code> or <code>imperative-action</code> layout change; <code>details.cancel()</code> vetoes it. Structural changes (<code>panel-change</code>, <code>group-resize</code>) skip it.</p>\n',
    'type': '[value: number[], details: ChangeEventDetails&lt;SplitterLayoutChangeReason, Event&gt;]'
  },
  {
    'name': 'layout',
    'description': '<p>Event handler called when group layout changes</p>\n',
    'type': '[val: number[]]'
  },
  {
    'name': 'update:layout',
    'description': '<p>Event handler called when the layout changes.</p>\n',
    'type': '[value: number[], details: ChangeEventDetails&lt;SplitterLayoutChangeReason, Event&gt;]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'layout',
    'description': '<p>Current size of layout</p>\n',
    'type': 'number[]'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `autoSaveId` | Unique id used to auto-save group arrangement via localStorage. Ignored while layout is controlled. | `string \| null` | No | `null` |
| `direction` | The group orientation of splitter. | `"vertical" \| "horizontal"` | Yes | - |
| `id` | Group id; falls back to useId when not provided. | `string \| null` | No | - |
| `keyboardResizeBy` | Step size when arrow key was pressed. | `number \| null` | No | `10` |
| `layout` | The controlled layout: one size per panel, in each panel's sizeUnit (the values @layout reports). Can be bound as v-model:layout. A layout the constraints reject is applied as corrected and the correction emitted; an array whose length differs from the panel count is ignored. | `number[]` | No | - |
| `storage` | Custom storage API; defaults to localStorage | `PanelGroupStorage` | No | `defaultStorage` |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `beforeUpdate:layout` | Event handler called before a drag, keyboard or imperative-action layout change; details.cancel() vetoes it. Structural changes (panel-change, group-resize) skip it. | `[value: number[], details: ChangeEventDetails<SplitterLayoutChangeReason, Event>]` |
| `layout` | Event handler called when group layout changes | `[val: number[]]` |
| `update:layout` | Event handler called when the layout changes. | `[value: number[], details: ChangeEventDetails<SplitterLayoutChangeReason, Event>]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `layout` | Current size of layout | `number[]` |

</llm-only>
