// Prints the npm dist-tag a version publishes under: the prerelease id for a
// prerelease (`3.0.0-alpha.0` -> `alpha`), `latest` for a stable version.
// A prerelease must never go out as `latest`, or every install of the stable
// line would pick it up. Used by `pub:release` and the release workflow.
//
//   node scripts/npm-dist-tag.mjs            # version from packages/core/package.json
//   node scripts/npm-dist-tag.mjs 3.0.0-rc.1 # explicit version
import { readFileSync } from 'node:fs'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

// npm rejects a dist-tag that reads as a semver range (`0`, `v3`, `x`), so only
// lowercase words are taken as the tag; anything else goes to `next`.
const WORD_TAG = /^[a-z]+(?:-[a-z]+)*$/

export function distTag(version) {
  // Build metadata (`+build-1`) is not part of the prerelease.
  const release = version.split('+')[0]
  const dash = release.indexOf('-')
  if (dash === -1)
    return 'latest'
  const id = release.slice(dash + 1).split('.')[0]
  if (WORD_TAG.test(id) && id !== 'latest' && id !== 'x')
    return id
  return 'next'
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const version = process.argv[2]
    ?? JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version
  process.stdout.write(`${distTag(version)}\n`)
}
