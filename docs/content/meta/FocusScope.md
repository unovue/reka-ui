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
    'name': 'loop',
    'description': '<p>When <code>true</code>, tabbing from last item will focus first tabbable\nand shift+tab from first item will focus last tababble.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'present',
    'description': '<p>Whether the scope is currently visible. Lets a consumer keep the scope\nmounted but hidden (e.g. <code>display: none</code>) and still get correct auto-focus:\nthe mount auto-focus is skipped while not present, and re-runs when it\nbecomes present again. Defaults to <code>true</code> so consumers that mount the scope\nonly while visible are unaffected.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  },
  {
    'name': 'trapped',
    'description': '<p>When <code>true</code>, focus cannot escape the focus scope via keyboard,\npointer, or a programmatic focus.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'mountAutoFocus',
    'description': '<p>Event handler called when auto-focusing on mount.\nCan be prevented.</p>\n',
    'type': '[event: Event]'
  },
  {
    'name': 'unmountAutoFocus',
    'description': '<p>Event handler called when auto-focusing on unmount.\nCan be prevented.</p>\n',
    'type': '[event: Event]'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `loop` | When true, tabbing from last item will focus first tabbable and shift+tab from first item will focus last tababble. | `boolean` | No | `false` |
| `present` | Whether the scope is currently visible. Lets a consumer keep the scope mounted but hidden (e.g. display: none) and still get correct auto-focus: the mount auto-focus is skipped while not present, and re-runs when it becomes present again. Defaults to true so consumers that mount the scope only while visible are unaffected. | `boolean` | No | `true` |
| `trapped` | When true, focus cannot escape the focus scope via keyboard, pointer, or a programmatic focus. | `boolean` | No | `false` |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `mountAutoFocus` | Event handler called when auto-focusing on mount. Can be prevented. | `[event: Event]` |
| `unmountAutoFocus` | Event handler called when auto-focusing on unmount. Can be prevented. | `[event: Event]` |

</llm-only>
