import { promises as fs } from 'node:fs'

const SPONSORS_SVG = 'https://raw.githubusercontent.com/zernonia/sponsor/main/sponsorkit/sponsors.wide.svg'

async function generate() {
  const res = await fetch(SPONSORS_SVG)

  if (!res.ok) {
    console.error(`Failed to fetch sponsors: ${res.status} ${res.statusText} ${await res.text()}`)
    return
  }

  const svg = await res.text()

  if (!svg.trimStart().startsWith('<svg')) {
    console.error('Fetched sponsors file is not an SVG, skipping write.')
    return
  }

  await fs.writeFile('content/public/sponsors.svg', svg, 'utf8')
}

generate()
