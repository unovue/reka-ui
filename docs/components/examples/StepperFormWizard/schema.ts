export interface WizardForm {
  email: string
  password: string
  name: string
  username: string
}

export type Errors = Partial<Record<keyof WizardForm, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_RE = /^\w{3,}$/

/**
 * One validator per step, each returning the errors for *its own* fields.
 * Keeping them separate is what lets the wizard gate `Next` on the current step
 * while still checking every earlier step before allowing a jump forward.
 */
export const validators: Record<number, (form: WizardForm) => Errors> = {
  1: (form) => {
    const errors: Errors = {}
    if (!EMAIL_RE.test(form.email))
      errors.email = 'Enter a valid email address'
    if (form.password.length < 8)
      errors.password = 'Use at least 8 characters'
    return errors
  },
  2: (form) => {
    const errors: Errors = {}
    if (!form.name.trim())
      errors.name = 'Name is required'
    if (!USERNAME_RE.test(form.username))
      errors.username = 'At least 3 letters, numbers or underscores'
    return errors
  },
  3: () => ({}),
}
