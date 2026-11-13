<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'activationMode',
    'description': '<p>Whether a tab is activated automatically (on focus, so arrow keys select tabs as they move) or\nmanually (on click, or Enter/Space; arrow keys only move focus).</p>\n',
    'type': '\'automatic\' | \'manual\'',
    'required': false,
    'default': '\'manual\''
  },
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
    'name': 'defaultValue',
    'description': '<p>The value of the tab that should be active when initially rendered. Use when you do not need to control the state of the tabs.\nWithout it, the first enabled tab is selected; <code>null</code> selects no tab.</p>\n',
    'type': 'null | StringOrNumber',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>The reading direction of the combobox when applicable. &lt;br&gt; If omitted, inherits globally from <code>ConfigProvider</code> or assumes LTR (left-to-right) reading mode.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'modelValue',
    'description': '<p>The controlled value of the tab to activate. Can be bind as <code>v-model</code>. <code>null</code> selects no tab. While it has been\n<code>undefined</code> since mount the tabs are uncontrolled: they start on <code>defaultValue</code> (not emitted), or on the first\nenabled tab without one (emitted). Once defined, it stays controlled, also when cleared to <code>undefined</code>.</p>\n',
    'type': 'null | StringOrNumber',
    'required': false
  },
  {
    'name': 'orientation',
    'description': '<p>The orientation the tabs are laid out.\nMainly so arrow navigation is done accordingly (left &amp; right vs. up &amp; down)</p>\n',
    'type': '\'horizontal\' | \'vertical\'',
    'required': false,
    'default': '\'horizontal\''
  },
  {
    'name': 'unmountOnHide',
    'description': '<p>When <code>true</code>, an inactive <code>TabsContent</code> is removed from the DOM, element and all. When <code>false</code>, it\nstays mounted with the <code>hidden</code> attribute (any <code>display</code> style you give it overrides <code>hidden</code>).</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'beforeUpdate:modelValue',
    'description': '<p>Event handler called before the value changes; call <code>details.cancel()</code> to keep the current value</p>\n',
    'type': '[payload: StringOrNumber, details: ChangeEventDetails&lt;TabsChangeReason, Event&gt;]'
  },
  {
    'name': 'update:modelValue',
    'description': '<p>Event handler called when the value changes</p>\n',
    'type': '[payload: StringOrNumber, details: ChangeEventDetails&lt;TabsChangeReason, Event&gt;]'
  }
]" />

<SlotsTable :data="[
  {
    'name': 'modelValue',
    'description': '<p>Current input values</p>\n',
    'type': 'null | T'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `activationMode` | Whether a tab is activated automatically (on focus, so arrow keys select tabs as they move) or manually (on click, or Enter/Space; arrow keys only move focus). | `"automatic" \| "manual"` | No | `"manual"` |
| `as` | The element or component this component should render as. Can be overwritten by `asChild`. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `defaultValue` | The value of the tab that should be active when initially rendered. Use when you do not need to control the state of the tabs. Without it, the first enabled tab is selected; `null` selects no tab. | `null \| StringOrNumber` | No | - |
| `dir` | The reading direction of the combobox when applicable. \<br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. | `"ltr" \| "rtl"` | No | - |
| `modelValue` | The controlled value of the tab to activate. Can be bind as `v-model`. `null` selects no tab. While it has been `undefined` since mount the tabs are uncontrolled: they start on `defaultValue` (not emitted), or on the first enabled tab without one (emitted). Once defined, it stays controlled, also when cleared to `undefined`. | `null \| StringOrNumber` | No | - |
| `orientation` | The orientation the tabs are laid out. Mainly so arrow navigation is done accordingly (left & right vs. up & down) | `"horizontal" \| "vertical"` | No | `"horizontal"` |
| `unmountOnHide` | When `true`, an inactive `TabsContent` is removed from the DOM, element and all. When `false`, it stays mounted with the `hidden` attribute (any `display` style you give it overrides `hidden`). | `boolean` | No | `true` |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `beforeUpdate:modelValue` | Event handler called before the value changes; call `details.cancel()` to keep the current value | `[payload: StringOrNumber, details: ChangeEventDetails<TabsChangeReason, Event>]` |
| `update:modelValue` | Event handler called when the value changes | `[payload: StringOrNumber, details: ChangeEventDetails<TabsChangeReason, Event>]` |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `modelValue` | Current input values | `null \| T` |

</llm-only>
