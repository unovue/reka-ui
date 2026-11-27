import type { Settings } from './_SettingsScreen.vue'

// The task of the UI SDK agent benchmark (benchmarks/agent/harness/task.mjs):
// rename the project to Atlas, set the visibility to Internal, make Priya Shah an
// admin, remove Tom Becker (confirming), turn on Email > Deploy failures and turn
// off Email > Weekly digest, leaving Slack alone, then save.
// The benchmark's success check: one save, with every value the task asked for and nothing else changed.
export function isCorrect(saved: Settings[]) {
  if (saved.length !== 1)
    return false
  const [settings] = saved
  const roles = Object.fromEntries(settings!.members.map(member => [member.id, member.role]))
  const admins = ['ada-okafor', 'priya-shah']
  return settings!.name === 'Atlas'
    && settings!.visibility === 'internal'
    && settings!.members.length === 23
    && !('tom-becker' in roles)
    && Object.entries(roles).every(([id, role]) => role === (admins.includes(id) ? 'admin' : 'member'))
    && JSON.stringify(settings!.email) === JSON.stringify({ 'deploy-failures': true, 'weekly-digest': false, 'mentions': true })
    && JSON.stringify(settings!.slack) === JSON.stringify({ 'deploy-failures': true, 'new-members': false })
}

export const benchmarkSteps = [
  { ref: 'Project name', action: 'setValue', args: ['Atlas'] },
  { ref: 'Visibility', action: 'setValue', args: ['Internal'] },
  { ref: 'Priya Shah', action: 'press', args: ['Make admin'] },
  { ref: 'Tom Becker', action: 'press', args: ['Remove'] },
  { ref: 'dialog', action: 'press', args: ['Remove'] },
  { ref: 'Email > Deploy failures', action: 'setChecked', args: [true] },
  { ref: 'Email > Weekly digest', action: 'setChecked', args: [false] },
  { ref: 'Save settings', action: 'press' },
]
