import { promises as fs } from 'node:fs'
import process from 'node:process'

interface Contributor {
  login: string
}

async function fetchContributors(page = 1) {
  const collaborators: string[] = []

  const res = await fetch(`https://api.github.com/repos/unovue/reka-ui/contributors?per_page=100&page=${page}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      // Authenticated requests get a far higher rate limit, which matters on
      // shared CI runners. Falls back to anonymous access when unset.
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
  })

  // Throw rather than return an empty page: earlier pages have already been
  // collected, and treating a failure as "no more contributors" would silently
  // truncate the list.
  if (!res.ok)
    throw new Error(`Failed to fetch contributors page #${page}: ${res.status} ${res.statusText} ${await res.text()}`)

  const data: Contributor[] = await res.json()

  collaborators.push(...data.map(contributor => contributor.login))
  if (res.headers.get('Link')?.includes('rel=\"next\"'))
    collaborators.push(...(await fetchContributors(page + 1)))
  return collaborators.filter(name => !name.includes('[bot]'))
}

async function generate() {
  const collaborators = await fetchContributors()

  // Never overwrite a good file with nothing.
  if (!collaborators.length)
    throw new Error('No contributors fetched')

  await fs.writeFile('.vitepress/contributor-names.json', `${JSON.stringify(collaborators, null, 2)}\n`, 'utf8')
}

generate().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
