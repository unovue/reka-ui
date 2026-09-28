<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>The element or component this component should render as. Can be overwritten by <code>asChild</code>.</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'p\''
  },
  {
    'name': 'asChild',
    'description': '<p>Change the default rendered element for the one passed as a child, merging their props and behavior.</p>\n<p>Read our <a href=\'https://www.reka-ui.com/docs/guides/composition\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'forceMount',
    'description': '<p>Force mounting, ignoring <code>match</code>/validity — useful for animation frameworks.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'id',
    'description': '<p>Id of the element. Auto-generated when not provided.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'match',
    'description': '<p>Restricts when this error renders:</p>\n<ul>\n<li>a <code>ValidityState</code> key (e.g. <code>&quot;valueMissing&quot;</code>) — renders when that native constraint fails.</li>\n<li><code>true</code> — renders whenever the field is invalid, for any reason.</li>\n<li><code>false</code> — never renders (escape hatch).</li>\n<li>omitted — renders when custom <code>validate</code>/server errors exist.</li>\n</ul>\n',
    'type': 'boolean | keyof ValidityState',
    'required': false
  }
]" />

<SlotsTable :data="[
  {
    'name': 'errors',
    'description': '<p>All current error messages.</p>\n',
    'type': 'string[]'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"p"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `forceMount` | Force mounting, ignoring match/validity — useful for animation frameworks. | `boolean` | No | - |
| `id` | Id of the element. Auto-generated when not provided. | `string` | No | - |
| `match` | Restricts when this error renders:  a ValidityState key (e.g. "valueMissing") — renders when that native constraint fails. true — renders whenever the field is invalid, for any reason. false — never renders (escape hatch). omitted — renders when custom validate/server errors exist. | `boolean \| keyof ValidityState` | No | - |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `errors` | All current error messages. | `string[]` |

</llm-only>
