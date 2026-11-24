// Prints the npm dist-tag a version publishes under. Used by `pub:release`
// and the release workflow, so the two publish paths cannot drift.
//
// - A prerelease goes out under its prerelease id (`2.12.0-beta.1` -> `beta`),
//   never `latest`: npm 11 refuses a prerelease without `--tag`, and before
//   that it would have replaced the stable release for every install.
// - A stable version goes out as `latest`, unless npm's `latest` is already on
//   a higher major (for example once 3.0.0 ships). npm refuses to move
//   `latest` back to an older version without an explicit tag, so the release
//   goes out as `v<major>-latest` (`v2-latest`) instead.
//
//   node scripts/npm-dist-tag.mjs                  # version from package.json, latest from npm
//   node scripts/npm-dist-tag.mjs 2.12.0 3.0.0     # explicit version and current `latest`
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

// npm rejects a dist-tag that reads as a semver range (`0`, `v3`, `x`), so only
// lowercase words are taken as the tag; anything else goes to `next`.
const WORD_TAG = /^[a-z]+(?:-[a-z]+)*$/
const LEADING_V = /^v/

/**
 * @param {string} version a semver version
 * @returns {number} its major version
 */
function major(version) {
  return Number.parseInt(version.replace(LEADING_V, '').split('.')[0], 10)
}

/**
 * The npm dist-tag `version` publishes under.
 * @param {string} version a semver version, e.g. `2.12.0` or `2.12.0-beta.1`
 * @param {string} [currentLatest] the version npm's `latest` points at, if known
 * @returns {string} the prerelease id, `latest`, `v<major>-latest`, or `next`
 */
export function distTag(version, currentLatest) {
  // Build metadata (`+build-1`) is not part of the prerelease.
  const release = version.split('+')[0]
  const dash = release.indexOf('-')
  if (dash !== -1) {
    const id = release.slice(dash + 1).split('.')[0]
    if (WORD_TAG.test(id) && id !== 'latest' && id !== 'x')
      return id
    return 'next'
  }
  if (currentLatest && major(currentLatest) > major(release))
    return `v${major(release)}-latest`
  return 'latest'
}

/**
 * The version npm's `latest` dist-tag points at, or `undefined` when npm can't
 * be reached. Without it the stable release is tagged `latest`, and npm's own
 * guard refuses the publish if that would move `latest` backwards.
 * @param {string} name the package name
 * @returns {string | undefined} the version, if npm answered
 */
function npmLatest(name) {
  try {
    return execFileSync('npm', ['view', name, 'dist-tags.latest'], { encoding: 'utf8' }).trim() || undefined
  }
  catch {
    return undefined
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  const version = process.argv[2] ?? pkg.version
  const currentLatest = process.argv[3] ?? npmLatest(pkg.name)
  process.stdout.write(`${distTag(version, currentLatest)}\n`)
}
