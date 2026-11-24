<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'defer',
    'description': '<p>Defer the resolving of a Teleport target until other parts of the\napplication have mounted (requires Vue 3.5.0+)</p>\n<p><a href=\'https://vuejs.org/guide/built-ins/teleport.html#deferred-teleport\' target=\'_blank\'>reference</a></p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'disabled',
    'description': '<p>Disable teleport and render the component inline</p>\n<p><a href=\'https://vuejs.org/guide/built-ins/teleport.html#disabling-teleport\' target=\'_blank\'>reference</a></p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'forceMount',
    'description': '<p>Used to force mounting when more control is needed. Useful when\ncontrolling animation with Vue animation libraries.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'to',
    'description': '<p>Vue native teleport component prop <code>:to</code></p>\n<p><a href=\'https://vuejs.org/guide/built-ins/teleport.html#basic-usage\' target=\'_blank\'>reference</a></p>\n',
    'type': 'string | HTMLElement',
    'required': false
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `defer` | Defer the resolving of a Teleport target until other parts of the application have mounted (requires Vue 3.5.0+) reference | `boolean` | No | - |
| `disabled` | Disable teleport and render the component inline reference | `boolean` | No | - |
| `forceMount` | Used to force mounting when more control is needed. Useful when controlling animation with Vue animation libraries. | `boolean` | No | - |
| `to` | Vue native teleport component prop :to reference | `string \| HTMLElement` | No | - |

</llm-only>
