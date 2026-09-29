export interface Folder {
  name: string
  size: string
  children?: Folder[]
}

export const folders: Folder[] = [
  {
    name: 'Documents',
    size: '4.2 GB',
    children: [
      {
        name: 'Invoices',
        size: '820 MB',
        children: [
          { name: '2025', size: '410 MB' },
          { name: '2026', size: '410 MB' },
        ],
      },
      { name: 'Contracts', size: '1.1 GB' },
      { name: 'Receipts', size: '2.3 GB' },
    ],
  },
  {
    name: 'Photos',
    size: '18.4 GB',
    children: [
      { name: 'Camera Roll', size: '15.2 GB' },
      { name: 'Screenshots', size: '3.2 GB' },
    ],
  },
  { name: 'Music', size: '6.8 GB' },
]
