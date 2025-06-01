<!-- This file was automatic generated. Do not edit it manually -->

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
    'description': '<p>The size of panel when it is collapsed.</p>\n',
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
    'description': '<p>Initial size of panel (numeric value between 1-100)</p>\n',
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
    'description': '<p>The maximum allowable size of panel (numeric value between 1-100); defaults to <code>100</code></p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'minSize',
    'description': '<p>The minimum allowable size of panel (numeric value between 1-100); defaults to <code>10</code></p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'order',
    'description': '<p>The order of panel within group; required for groups with conditionally rendered panels</p>\n',
    'type': 'number',
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
    'type': '() => void'
  },
  {
    'name': 'expand',
    'description': '<p>If panel is currently collapsed, expand it to its most recent size.</p>\n',
    'type': '() => void'
  },
  {
    'name': 'getSize',
    'description': '<p>Gets the current size of the panel as a percentage (1 - 100).</p>\n',
    'type': '() => number'
  },
  {
    'name': 'resize',
    'description': '<p>Resize panel to the specified percentage (1 - 100).</p>\n',
    'type': '(size: number) => void'
  }
]" />
