<!-- This file was automatically generated. Do not edit it manually -->

<llm-exclude>
<PropsTable :data="[
  {
    'name': 'as',
    'description': '<p>The element or component this component should render as. Can be overwritten by <code>asChild</code>.</p>\n',
    'type': 'AsTag | Component',
    'required': false,
    'default': '\'form\''
  },
  {
    'name': 'asChild',
    'description': '<p>Change the default rendered element for the one passed as a child, merging their props and behavior.</p>\n<p>Read our <a href=\'https://www.reka-ui.com/docs/guides/composition\'>Composition</a> guide for more details.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'errors',
    'description': '<p>A map of field <code>name</code> to server-side error message(s). Displayed by the\nmatching <code>FieldRoot</code>\'s <code>FieldError</code> until the user edits that field, or a\nnew value for that key is provided.</p>\n',
    'type': 'Record&lt;string, string | string[]&gt;',
    'required': false
  },
  {
    'name': 'validationMode',
    'description': '<p>When fields validate. The <code>validationMode</code> of a <code>FieldRoot</code> takes precedence over this.</p>\n<ul>\n<li><code>onSubmit</code>: when the form is submitted, then on every change after that.</li>\n<li><code>onBlur</code>: when a control loses focus.</li>\n<li><code>onChange</code>: on every change to a control\'s value.</li>\n</ul>\n',
    'type': '\'onBlur\' | \'onChange\' | \'onSubmit\'',
    'required': false,
    'default': '\'onSubmit\''
  }
]" />

<EmitsTable :data="[
  {
    'name': 'formSubmit',
    'description': '<p>Emitted after <code>submit</code> with the values of every named field. Listening\nto it prevents the native submission.</p>\n',
    'type': '[values: Record&lt;string, unknown&gt;, event: SubmitEvent]'
  },
  {
    'name': 'submit',
    'description': '<p>Emitted with the native submit event once every field has validated\nsuccessfully. When any field is invalid, the native submission is\nprevented and this isn\'t emitted. Otherwise the form submits natively\n(e.g. to its <code>action</code>) unless you call <code>event.preventDefault()</code>, or\nlisten to <code>formSubmit</code>.</p>\n',
    'type': '[event: SubmitEvent]'
  }
]" />

<MethodsTable :data="[
  {
    'name': 'validate',
    'description': '<p>Validates every field, or only the field with the given <code>name</code>. Returns whether they\'re all valid.</p>\n',
    'type': '(fieldName?: string | undefined) =&gt; boolean'
  }
]" />
</llm-exclude>

<llm-only>

**Props**

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"form"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `errors` | A map of field name to server-side error message(s). Displayed by the matching FieldRoot's FieldError until the user edits that field, or a new value for that key is provided. | `Record<string, string \| string[]>` | No | - |
| `validationMode` | When fields validate. The validationMode of a FieldRoot takes precedence over this.  onSubmit: when the form is submitted, then on every change after that. onBlur: when a control loses focus. onChange: on every change to a control's value. | `"onBlur" \| "onChange" \| "onSubmit"` | No | `"onSubmit"` |

**Events**

| Name | Description | Type |
| --- | --- | --- |
| `formSubmit` | Emitted after submit with the values of every named field. Listening to it prevents the native submission. | `[values: Record<string, unknown>, event: SubmitEvent]` |
| `submit` | Emitted with the native submit event once every field has validated successfully. When any field is invalid, the native submission is prevented and this isn't emitted. Otherwise the form submits natively (e.g. to its action) unless you call event.preventDefault(), or listen to formSubmit. | `[event: SubmitEvent]` |

**Methods**

| Name | Description | Type |
| --- | --- | --- |
| `validate` | Validates every field, or only the field with the given name. Returns whether they're all valid. | `(fieldName?: string \| undefined) => boolean` |

</llm-only>
