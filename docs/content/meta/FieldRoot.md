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
    'name': 'disabled',
    'description': '<p>When <code>true</code>, prevents the user from interacting with the field\'s control. Takes precedence over the <code>disabled</code> of the control.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'invalid',
    'description': '<p>When <code>true</code>, marks the field invalid regardless of its own validation.\nUseful when the field state is controlled by an external library.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'name',
    'description': '<p>The name of the field. Submitted with its owning form as part of a\nname/value pair, and used to match server <code>errors</code> on a <code>FormRoot</code>.\nTakes precedence over the <code>name</code> of the control.</p>\n',
    'type': 'string',
    'required': false
  },
  {
    'name': 'required',
    'description': '<p>When <code>true</code>, indicates that the user must set the value before the owning form can be submitted.</p>\n',
    'type': 'boolean',
    'required': false
  },
  {
    'name': 'validate',
    'description': '<p>Custom validation function. Return an error message (or array of\nmessages) when invalid, or <code>null</code>/<code>undefined</code> when valid. Receives the\ncontrol\'s value and the values of every named field in the owning form.</p>\n<p>Can be async, but an async <code>validate</code> does not prevent form submission\nwhen <code>validationMode</code> is <code>onSubmit</code>.</p>\n',
    'type': 'FieldValidateFn',
    'required': false
  },
  {
    'name': 'validationDebounceTime',
    'description': '<p>How long to wait (in ms) between <code>validate</code> calls when validating on change.</p>\n',
    'type': 'number',
    'required': false
  },
  {
    'name': 'validationMode',
    'description': '<p>When the field (re-)runs validation. Takes precedence over the\n<code>validationMode</code> of an ancestor <code>FormRoot</code>.</p>\n<ul>\n<li><code>onSubmit</code>: when the form is submitted, then on every change after that.</li>\n<li><code>onBlur</code>: when the control loses focus.</li>\n<li><code>onChange</code>: on every change to the control\'s value.</li>\n</ul>\n',
    'type': '\'onBlur\' | \'onChange\' | \'onSubmit\'',
    'required': false
  }
]" />

<SlotsTable :data="[
  {
    'name': 'invalid',
    'description': '<p>Whether the field is currently invalid.</p>\n',
    'type': 'boolean'
  },
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
| `as` | The element or component this component should render as. Can be overwritten by asChild. | `AsTag \| Component` | No | `"div"` |
| `asChild` | Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details. | `boolean` | No | - |
| `disabled` | When true, prevents the user from interacting with the field's control. Takes precedence over the disabled of the control. | `boolean` | No | - |
| `invalid` | When true, marks the field invalid regardless of its own validation. Useful when the field state is controlled by an external library. | `boolean` | No | - |
| `name` | The name of the field. Submitted with its owning form as part of a name/value pair, and used to match server errors on a FormRoot. Takes precedence over the name of the control. | `string` | No | - |
| `required` | When true, indicates that the user must set the value before the owning form can be submitted. | `boolean` | No | - |
| `validate` | Custom validation function. Return an error message (or array of messages) when invalid, or null/undefined when valid. Receives the control's value and the values of every named field in the owning form. Can be async, but an async validate does not prevent form submission when validationMode is onSubmit. | `FieldValidateFn` | No | - |
| `validationDebounceTime` | How long to wait (in ms) between validate calls when validating on change. | `number` | No | - |
| `validationMode` | When the field (re-)runs validation. Takes precedence over the validationMode of an ancestor FormRoot.  onSubmit: when the form is submitted, then on every change after that. onBlur: when the control loses focus. onChange: on every change to the control's value. | `"onBlur" \| "onChange" \| "onSubmit"` | No | - |

**Slots**

| Name | Description | Type |
| --- | --- | --- |
| `invalid` | Whether the field is currently invalid. | `boolean` |
| `errors` | All current error messages. | `string[]` |

</llm-only>
