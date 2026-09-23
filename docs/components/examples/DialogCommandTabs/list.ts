export interface CommandItem {
  id: string
  name: string
  icon: string
  hint?: string
}

export interface Scope {
  value: string
  label: string
  items: CommandItem[]
}

export const scopes: Scope[] = [
  {
    value: 'pages',
    label: 'Pages',
    items: [
      { id: 'overview', name: 'Overview', icon: 'lucide:layout-dashboard' },
      { id: 'components', name: 'Components', icon: 'lucide:blocks' },
      { id: 'examples', name: 'Examples', icon: 'lucide:square-dashed-mouse-pointer' },
      { id: 'guides', name: 'Guides', icon: 'lucide:book-open' },
      { id: 'releases', name: 'Releases', icon: 'lucide:history' },
    ],
  },
  {
    value: 'actions',
    label: 'Actions',
    items: [
      { id: 'new-issue', name: 'New issue', icon: 'lucide:circle-plus', hint: '⌘ I' },
      { id: 'invite', name: 'Invite teammate', icon: 'lucide:user-plus' },
      { id: 'theme', name: 'Toggle theme', icon: 'lucide:sun-moon', hint: '⌘ D' },
      { id: 'copy-link', name: 'Copy page link', icon: 'lucide:link', hint: '⌘ ⇧ C' },
    ],
  },
  {
    value: 'people',
    label: 'People',
    items: [
      { id: 'ada', name: 'Ada Lovelace', icon: 'lucide:user' },
      { id: 'grace', name: 'Grace Hopper', icon: 'lucide:user' },
      { id: 'radia', name: 'Radia Perlman', icon: 'lucide:user' },
      { id: 'katherine', name: 'Katherine Johnson', icon: 'lucide:user' },
    ],
  },
]
