export interface MenuLink {
  title: string
  description: string
  icon: string
}

export interface MenuSection {
  value: string
  label: string
  /** Wider panels need the viewport to grow — it measures the active content. */
  columns: 1 | 2
  links: MenuLink[]
}

export const sections: MenuSection[] = [
  {
    value: 'product',
    label: 'Product',
    columns: 2,
    links: [
      { title: 'Primitives', description: 'Unstyled, accessible building blocks.', icon: 'lucide:blocks' },
      { title: 'Themes', description: 'Drop-in styling for every primitive.', icon: 'lucide:palette' },
      { title: 'Icons', description: 'A crisp, consistent icon set.', icon: 'lucide:shapes' },
      { title: 'Colors', description: 'Palettes with automatic dark mode.', icon: 'lucide:droplet' },
    ],
  },
  {
    value: 'developers',
    label: 'Developers',
    columns: 1,
    links: [
      { title: 'Documentation', description: 'Guides, API reference and recipes.', icon: 'lucide:book-open' },
      { title: 'Examples', description: 'Compositions you can copy today.', icon: 'lucide:square-dashed-mouse-pointer' },
      { title: 'Changelog', description: 'Every release, in order.', icon: 'lucide:history' },
    ],
  },
]
