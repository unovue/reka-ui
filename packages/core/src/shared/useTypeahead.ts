import { refAutoReset } from '@vueuse/shared'
import { getActiveElement } from './getActiveElement'

interface TypeaheadItem {
  ref: HTMLElement
  value?: any
}

// An empty `textValue` also falls back to the text content
function getItemText(item: TypeaheadItem) {
  return item.value?.textValue || item.ref.textContent?.trim() || ''
}

export function useTypeahead(callback?: (search: string) => void) {
  // Reset `search` 1 second after it was last updated
  const search = refAutoReset('', 1000)

  // Adds `key` to the search and returns the next item it matches after
  // `currentItem`, without focusing it
  const findTypeaheadMatch = <T extends TypeaheadItem>(key: string, items: T[], currentItem?: T) => {
    search.value = search.value + key
    return getNextMatch(items, search.value, currentItem, getItemText)
  }

  const handleTypeaheadSearch = (key: string, items: TypeaheadItem[]) => {
    if (callback) {
      search.value = search.value + key
      callback(key)
      return
    }

    const newItem = findTypeaheadMatch(key, items, items.find(item => item.ref === getActiveElement()))
    if (newItem)
      newItem.ref.focus()
    return newItem?.ref
  }

  const resetTypeahead = () => {
    search.value = ''
  }

  return {
    search,
    handleTypeaheadSearch,
    findTypeaheadMatch,
    resetTypeahead,
  }
}

/**
 * Wraps an array around itself at a given start index
 * Example: `wrapArray(['a', 'b', 'c', 'd'], 2) === ['c', 'd', 'a', 'b']`
 */
export function wrapArray<T>(array: T[], startIndex: number) {
  return array.map((_, index) => array[(startIndex + index) % array.length])
}

/**
 * This is the "meat" of the typeahead matching logic. It takes in all the values,
 * the search and the current match, and returns the next match (or `undefined`).
 *
 * We normalize the search because if a user has repeatedly pressed a character,
 * we want the exact same behavior as if we only had that one character
 * (ie. cycle through options starting with that character)
 *
 * We also reorder the values by wrapping the array around the current match.
 * This is so we always look forward from the current match, and picking the first
 * match will always be the correct one.
 *
 * Finally, if the normalized search is exactly one character, we exclude the
 * current match from the values because otherwise it would be the first to match always
 * and focus would never move. This is as opposed to the regular case, where we
 * don't want focus to move if the current match still matches.
 *
 * The values can be items, with `getText` returning each item's text. The current
 * match is then found by identity, so items with the same text stay distinct.
 */
export function getNextMatch<T>(
  values: T[],
  search: string,
  currentMatch?: T,
  getText: (value: T) => string = String,
) {
  const isRepeated
    = search.length > 1 && Array.from(search).every(char => char === search[0])
  const normalizedSearch = isRepeated ? search[0] : search
  const currentMatchIndex = currentMatch ? values.indexOf(currentMatch) : -1
  let wrappedValues = wrapArray(values, Math.max(currentMatchIndex, 0))
  const excludeCurrentMatch = normalizedSearch.length === 1
  if (excludeCurrentMatch)
    wrappedValues = wrappedValues.filter(v => v !== currentMatch)
  const nextMatch = wrappedValues.find(value =>
    getText(value).toLowerCase().startsWith(normalizedSearch.toLowerCase()),
  )
  return nextMatch !== currentMatch ? nextMatch : undefined
}
