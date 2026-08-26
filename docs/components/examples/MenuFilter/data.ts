export interface Entry {
  name: string
  icon: string
}

export const projects: Entry[] = [
  { name: 'Design System', icon: 'lucide:palette' },
  { name: 'Marketing Site', icon: 'lucide:megaphone' },
  { name: 'Mobile App', icon: 'lucide:smartphone' },
  { name: 'Docs Rewrite', icon: 'lucide:book-open' },
  { name: 'Billing Migration', icon: 'lucide:credit-card' },
  { name: 'Search Infrastructure', icon: 'lucide:search' },
  { name: 'Onboarding Revamp', icon: 'lucide:sparkles' },
]

export const labels: Entry[] = [
  { name: 'Bug', icon: 'lucide:bug' },
  { name: 'Feature', icon: 'lucide:plus' },
  { name: 'Documentation', icon: 'lucide:file-text' },
  { name: 'Performance', icon: 'lucide:gauge' },
  { name: 'Accessibility', icon: 'lucide:accessibility' },
  { name: 'Refactor', icon: 'lucide:recycle' },
]

export function filterEntries(entries: Entry[], query: string) {
  const q = query.trim().toLowerCase()
  return q ? entries.filter(entry => entry.name.toLowerCase().includes(q)) : entries
}
