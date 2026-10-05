export interface NavLink {
  title: string
  description: string
}

export interface NavSection {
  value: string
  label: string
  links: NavLink[]
}

/** One source of truth, rendered two ways. */
export const sections: NavSection[] = [
  {
    value: 'product',
    label: 'Product',
    links: [
      { title: 'Primitives', description: 'Unstyled, accessible building blocks.' },
      { title: 'Themes', description: 'Drop-in styling for every primitive.' },
      { title: 'Icons', description: 'A crisp, consistent icon set.' },
    ],
  },
  {
    value: 'developers',
    label: 'Developers',
    links: [
      { title: 'Documentation', description: 'Guides, API reference and recipes.' },
      { title: 'Examples', description: 'Compositions you can copy today.' },
      { title: 'Changelog', description: 'Every release, in order.' },
    ],
  },
  {
    value: 'company',
    label: 'Company',
    links: [
      { title: 'About', description: 'Who builds this and why.' },
      { title: 'Sponsors', description: 'The people keeping it going.' },
    ],
  },
]
