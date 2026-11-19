<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'content',
    'description': '<p>Default settings that will be used by all tooltip components.</p>\n',
    'type': 'TooltipContentProps',
    'required': false
  },
  {
    'name': 'delayDuration',
    'description': '<p>The duration from when the pointer enters the trigger until the tooltip gets opened.</p>\n',
    'type': 'number',
    'required': false,
    'default': '700'
  },
  {
    'name': 'disableClosingTrigger',
    'description': '<p>When <code>true</code>, clicking on trigger will not close the content.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>When <code>true</code>, disable tooltip</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'disableHoverableContent',
    'description': '<p>When <code>true</code>, trying to hover the content will result in the tooltip closing as the pointer leaves the trigger.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'ignoreNonKeyboardFocus',
    'description': '<p>Prevent the tooltip from opening if the focus did not come from\nthe keyboard by matching against the <code>:focus-visible</code> selector.\nThis is useful if you want to avoid opening it when switching\nbrowser tabs or closing a dialog.</p>\n',
    'type': 'boolean',
    'required': false,
    'default': 'false'
  },
  {
    'name': 'skipDelayDuration',
    'description': '<p>How much time a user has to enter another trigger without incurring a delay again.</p>\n',
    'type': 'number',
    'required': false,
    'default': '300'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `content` | Default settings that will be used by all tooltip components. | `TooltipContentProps` | No | - |
| `delayDuration` | The duration from when the pointer enters the trigger until the tooltip gets opened. | `number` | No | `700` |
| `disableClosingTrigger` | When true, clicking on trigger will not close the content. | `boolean` | No | - |
| `disabled` | When true, disable tooltip | `boolean` | No | - |
| `disableHoverableContent` | When true, trying to hover the content will result in the tooltip closing as the pointer leaves the trigger. | `boolean` | No | `false` |
| `ignoreNonKeyboardFocus` | Prevent the tooltip from opening if the focus did not come from the keyboard by matching against the :focus-visible selector. This is useful if you want to avoid opening it when switching browser tabs or closing a dialog. | `boolean` | No | `false` |
| `skipDelayDuration` | How much time a user has to enter another trigger without incurring a delay again. | `number` | No | `300` |

</llm-only>
