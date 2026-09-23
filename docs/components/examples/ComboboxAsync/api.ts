export interface User {
  id: number
  name: string
  handle: string
  team: string
}

const USERS: User[] = [
  { id: 1, name: 'Ada Lovelace', handle: 'ada', team: 'Engineering' },
  { id: 2, name: 'Alan Turing', handle: 'alan', team: 'Engineering' },
  { id: 3, name: 'Grace Hopper', handle: 'grace', team: 'Engineering' },
  { id: 4, name: 'Katherine Johnson', handle: 'katherine', team: 'Research' },
  { id: 5, name: 'Barbara Liskov', handle: 'barbara', team: 'Research' },
  { id: 6, name: 'Margaret Hamilton', handle: 'margaret', team: 'Research' },
  { id: 7, name: 'Radia Perlman', handle: 'radia', team: 'Infrastructure' },
  { id: 8, name: 'Anita Borg', handle: 'anita', team: 'Infrastructure' },
  { id: 9, name: 'Frances Allen', handle: 'frances', team: 'Compilers' },
  { id: 10, name: 'Jean Bartik', handle: 'jean', team: 'Compilers' },
  { id: 11, name: 'Shafi Goldwasser', handle: 'shafi', team: 'Security' },
  { id: 12, name: 'Elizabeth Feinler', handle: 'elizabeth', team: 'Security' },
]

/**
 * Stands in for a real endpoint. The latency is deliberately random so that
 * responses come back out of order — which is exactly the case `AbortController`
 * in `index.vue` exists to handle.
 */
export function searchUsers(query: string, signal: AbortSignal): Promise<User[]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const q = query.trim().toLowerCase()
      resolve(
        q
          ? USERS.filter(user => `${user.name} ${user.handle} ${user.team}`.toLowerCase().includes(q))
          : USERS.slice(0, 5),
      )
    }, 250 + Math.random() * 600)

    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
}
