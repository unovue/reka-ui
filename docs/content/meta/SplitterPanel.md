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
    'name': 'collapsedSize',
    'description': '<p>The size of panel when it is collapsed; interpreted using <code>sizeUnit</code>.</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'collapsible',
    'description': '<p>Should panel collapse when resized beyond its <code>minSize</code>. When <code>true</code>, it will be collapsed to <code>collapsedSize</code>.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'defaultSize',
    'description': '<p>Initial size of panel, interpreted using <code>sizeUnit</code> (percent by default).</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'id',
    'description': '<p>Panel id (unique within group); falls back to <code>useId</code> when not provided</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'maxSize',
    'description': '<p>The maximum allowable size of panel, interpreted using <code>sizeUnit</code>; defaults to <code>100</code> (percent).</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'minSize',
    'description': '<p>The minimum allowable size of panel, interpreted using <code>sizeUnit</code>; defaults to <code>10</code> (percent).</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'order',
    'description': '<p>The order of panel within group; required for groups with conditionally rendered panels</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'sizeUnit',
    'description': '<p>Unit used for sizing values; <code>%</code> by default, or <code>px</code> for fixed sizing.</p>\n',
    'type': '\'%\' | \'px\'',
    'required': false
  }
]" />

<EmitsTable :data="[
  {
    'name': 'collapse',
    'description': '<p>Event handler called when panel is collapsed.</p>\n',
    'type': '[]'
  },
  {
    'name': 'expand',
    'description': '<p>Event handler called when panel is expanded.</p>\n',
    'type': '[]'
  },
  {
    'name': 'resize',
    'description': '<p>Event handler called when panel is resized; size parameter is a numeric value between 1-100.</p>\n',
    'type': '[size: number, prevSize: number]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'isCollapsed',
    'description': '<p>Is the panel collapsed</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'isExpanded',
    'description': '<p>Is the panel expanded</p>\n',
    'type': 'boolean'
  },
  {
    'name': 'collapse',
    'description': '<p>If panel is <code>collapsible</code>, collapse it fully.</p>\n',
    'type': '(): void'
  },
  {
    'name': 'expand',
    'description': '<p>If panel is currently collapsed, expand it to its most recent size.</p>\n',
    'type': '(): void'
  },
  {
    'name': 'resize',
    'description': '<p>Resize panel to the specified percentage (1 - 100).</p>\n',
    'type': '(size: number): void'
  }
]" />

<MethodsTable :data="[
  {
    'name': 'collapse',
    'description': '<p>If panel is <code>collapsible</code>, collapse it fully.</p>\n',
    'type': '() =&gt; void'
  },
  {
    'name': 'expand',
    'description': '<p>If panel is currently collapsed, expand it to its most recent size.</p>\n',
    'type': '() =&gt; void'
  },
  {
    'name': 'getSize',
    'description': '<p>Gets the current size of the panel (in the panel\'s sizeUnit: percentage for \'%\', pixels for \'px\').</p>\n',
    'type': '() =&gt; number'
  },
  {
    'name': 'resize',
    'description': '<p>Resize panel to the specified size (in the panel\'s sizeUnit: percentage for \'%\', pixels for \'px\').</p>\n',
    'type': '(size: number) =&gt; void'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `collapsedSize` | The size of panel when it is collapsed; interpreted using sizeUnit. | `number` | No | - |
| `collapsible` | Should panel collapse when resized beyond its minSize. When true, it will be collapsed to collapsedSize. | `boolean` | No | - |
| `defaultSize` | Initial size of panel, interpreted using sizeUnit (percent by default). | `number` | No | - |
| `id` | Panel id (unique within group); falls back to useId when not provided | `string` | No | - |
| `maxSize` | The maximum allowable size of panel, interpreted using sizeUnit; defaults to 100 (percent). | `number` | No | - |
| `minSize` | The minimum allowable size of panel, interpreted using sizeUnit; defaults to 10 (percent). | `number` | No | - |
| `order` | The order of panel within group; required for groups with conditionally rendered panels | `number` | No | - |
| `sizeUnit` | Unit used for sizing values; % by default, or px for fixed sizing. | `"%" \| "px"` | No | - |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `collapse` | Event handler called when panel is collapsed. | `[]` |
| `expand` | Event handler called when panel is expanded. | `[]` |
| `resize` | Event handler called when panel is resized; size parameter is a numeric value between 1-100. | `[size: number, prevSize: number]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `isCollapsed` | Is the panel collapsed | `boolean` |
| `isExpanded` | Is the panel expanded | `boolean` |
| `collapse` | If panel is collapsible, collapse it fully. | `(): void` |
| `expand` | If panel is currently collapsed, expand it to its most recent size. | `(): void` |
| `resize` | Resize panel to the specified percentage (1 - 100). | `(size: number): void` |

**Methods**

| Name | Description | Type |
| --- | --- | --- |
| `collapse` | If panel is collapsible, collapse it fully. | `() => void` |
| `expand` | If panel is currently collapsed, expand it to its most recent size. | `() => void` |
| `getSize` | Gets the current size of the panel (in the panel's sizeUnit: percentage for '%', pixels for 'px'). | `() => number` |
| `resize` | Resize panel to the specified size (in the panel's sizeUnit: percentage for '%', pixels for 'px'). | `(size: number) => void` |

</llm-only>
