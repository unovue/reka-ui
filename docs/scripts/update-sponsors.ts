import { promises as fs } from 'node:fs'
import process from 'node:process'

const SPONSORS_SVG = 'https://raw.githubusercontent.com/zernonia/sponsor/main/sponsorkit/sponsors.wide.svg'

/**
 * Vendors the sponsorkit-generated sponsors image into `content/public/sponsors.svg`,
 * relative to `docs/`, so the site serves a committed asset rather than hotlinking
 * `raw.githubusercontent.com`.
 *
 * @throws If the fetch fails or the response is not an SVG, leaving the committed
 * asset untouched.
 */
async function generate() {
  const res = await fetch(SPONSORS_SVG)

  if (!res.ok)
    throw new Error(`Failed to fetch sponsors: ${res.status} ${res.statusText} ${await res.text()}`)

  const svg = await res.text()

  // A GitHub outage serving an HTML error page must not overwrite a good asset.
  if (!svg.trimStart().startsWith('<svg'))
    throw new Error('Fetched sponsors file is not an SVG')

  await fs.writeFile('content/public/sponsors.svg', svg, 'utf8')
}

generate().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
