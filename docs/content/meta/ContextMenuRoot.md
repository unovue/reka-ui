<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'defaultOpen',
    'description': '<p>The open state of the menu when it is initially rendered. Use when you do not need to control its open state.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'dir',
    'description': '<p>The reading direction of the combobox when applicable.</p>\n<p>If omitted, inherits globally from <code>ConfigProvider</code> or assumes LTR (left-to-right) reading mode.</p>\n',
    'type': '\'ltr\' | \'rtl\'',
    'required': false
  },
  {
    'name': 'modal',
    'description': '<p>The modality of the dropdown menu.</p>\n<p>When set to <code>true</code>, interaction with outside elements will be disabled and only menu content will be visible to screen readers.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'true'
  },
  {
    'name': 'pressOpenDelay',
    'description': '<p>The duration from when the trigger is pressed until the menu opens.</p>\n',
    'type': 'number',
    'required': false,
    'default': '700'
  }
]" />

<EmitsTable :data="[
  {
    'name': 'beforeUpdate:open',
    'description': '<p>Called before the open state of the submenu changes; <code>details.cancel()</code> vetoes the change.</p>\n',
    'type': '[payload: boolean, details: ChangeEventDetails&lt;MenuOpenChangeReason, Event&gt;]'
  },
  {
    'name': 'update:open',
    'description': '<p>Event handler called when the open state of the submenu changes.</p>\n',
    'type': '[payload: boolean, details: ChangeEventDetails&lt;MenuOpenChangeReason, Event&gt;]'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `defaultOpen` | The open state of the menu when it is initially rendered. Use when you do not need to control its open state. | `boolean` | No | - |
| `dir` | The reading direction of the combobox when applicable. If omitted, inherits globally from ConfigProvider or assumes LTR (left-to-right) reading mode. | `"ltr" \| "rtl"` | No | - |
| `modal` | The modality of the dropdown menu. When set to true, interaction with outside elements will be disabled and only menu content will be visible to screen readers. | `boolean` | No | `true` |
| `pressOpenDelay` | The duration from when the trigger is pressed until the menu opens. | `number` | No | `700` |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `beforeUpdate:open` | Called before the open state of the submenu changes; details.cancel() vetoes the change. | `[payload: boolean, details: ChangeEventDetails<MenuOpenChangeReason, Event>]` |
| `update:open` | Event handler called when the open state of the submenu changes. | `[payload: boolean, details: ChangeEventDetails<MenuOpenChangeReason, Event>]` |

</llm-only>
