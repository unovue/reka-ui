import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'

// Remove `sourceContents` from the sourcemaps, as the source files are part of the package.
function removeContentsFromSourceMaps(path = new URL('../dist/', import.meta.url)) {
  for (const file of readdirSync(path)) {
    const url = new URL(file, path)
    if (statSync(url).isDirectory()) {
      removeContentsFromSourceMaps(new URL(`${file}/`, path))
    }
    else if (file.endsWith('js.map')) {
      const map = JSON.parse(readFileSync(url, 'utf8'))
      map.sourcesContent = []
      writeFileSync(url, JSON.stringify(map))
    }
  }
}

removeContentsFromSourceMaps()
